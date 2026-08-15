"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  auth,
  db,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  formatAuthError,
} from "@/lib/firebase";

type UserProfile = {
  id: string;
  uid: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  status?: string;
  created_at?: string;
};

type RestaurantItem = {
  id: string;
  name: string;
  cuisine_type: string | null;
  city: string | null;
  address: string | null;
  phone?: string | null;
  stir?: string | null; // STIR / ИНН for legal checking
  approval_status: string;
  owner_id: string;
  created_at?: string;
};

type StaffMember = {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  role: "Super Admin" | "Support Manager" | "Auditor";
  status: "Active" | "Inactive";
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "restaurants" | "staff">("overview");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Active Firestore subscriptions, so they can be detached on unmount / re-sync
  const listenersRef = useRef<Array<() => void>>([]);

  // Data Collections
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);

  // Search Filters
  const [customerSearch, setCustomerSearch] = useState("");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Staff Form State
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<StaffMember["role"]>("Support Manager");

  // Inline Admin Login Form States
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const detachListeners = useCallback(() => {
    listenersRef.current.forEach((unsubscribe) => unsubscribe());
    listenersRef.current = [];
  }, []);

  // Reads the signed-in user's role straight from Firestore. This is the only
  // way into the panel: there is no master key and no email-pattern shortcut.
  const resolveAdminRole = useCallback(async (uid: string): Promise<boolean> => {
    const pSnap = await getDocs(query(collection(db, "profiles"), where("uid", "==", uid)));
    if (pSnap.empty) return false;
    return pSnap.docs[0].data().role === "admin";
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        detachListeners();
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const allowed = await resolveAdminRole(user.uid);
        setIsAdmin(allowed);

        if (allowed) {
          setupRealtimeListeners();
        } else {
          detachListeners();
        }
      } catch (err) {
        console.error("Admin auth check error:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detachListeners();
    };
  }, [detachListeners, resolveAdminRole]);

  async function handleAdminSubmitLogin(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoginError("");
    setAdminLoginLoading(true);

    try {
      const res = await signInWithEmailAndPassword(
        auth,
        adminEmail.trim(),
        adminPassword
      );

      const allowed = await resolveAdminRole(res.user.uid);

      if (allowed) {
        setIsAdmin(true);
        setupRealtimeListeners();
      } else {
        await signOut(auth);
        setAdminLoginError("Access denied. Your account is not authorized as Platform Admin.");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      setAdminLoginError(formatAuthError(err, "Invalid email or password. Verify credentials."));
    } finally {
      setAdminLoginLoading(false);
    }
  }

  function setupRealtimeListeners() {
    // Drop any previous subscriptions so re-syncing never stacks listeners
    detachListeners();

    // 1. Real-time Customers
    const unsubCustomers = onSnapshot(collection(db, "profiles"), (snap) => {
      const list: UserProfile[] = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.role === "customer" || !u.role);
      setCustomers(list);
    });

    // 2. Real-time Restaurants
    const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snap) => {
      const list: RestaurantItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RestaurantItem[];
      setRestaurants(list);
    });

    // 3. Real-time Bookings count
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      setTotalBookings(snap.size);
    });

    // 4. Real-time Platform Staff
    const unsubStaff = onSnapshot(collection(db, "platform_staff"), (snap) => {
      const list: StaffMember[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StaffMember[];
      setStaffList(list);
    });

    listenersRef.current = [
      unsubCustomers,
      unsubRestaurants,
      unsubBookings,
      unsubStaff,
    ];

    setLoading(false);
  }

  async function handleUpdateRestaurantStatus(id: string, newStatus: string) {
    setActionLoading(id + "_" + newStatus);
    try {
      await updateDoc(doc(db, "restaurants", id), {
        approval_status: newStatus,
      });
    } catch (err) {
      console.error("Error updating restaurant status:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleUserStatus(uid: string, currentStatus?: string) {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    setActionLoading(uid);
    try {
      const pSnap = await getDocs(query(collection(db, "profiles"), where("uid", "==", uid)));
      if (!pSnap.empty) {
        await updateDoc(doc(db, "profiles", pSnap.docs[0].id), {
          status: nextStatus,
        });
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddStaffMember() {
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    try {
      await addDoc(collection(db, "platform_staff"), {
        full_name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        phone: newStaffPhone.trim(),
        role: newStaffRole,
        status: "Active",
        created_at: new Date().toISOString(),
      });

      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPhone("");
    } catch (err) {
      console.error("Error adding staff:", err);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/admin/login");
  }

  // Filtered queries
  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
  );

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name?.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
      r.city?.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
      r.stir?.includes(restaurantSearch) ||
      r.cuisine_type?.toLowerCase().includes(restaurantSearch.toLowerCase())
  );

  const pendingRestaurants = restaurants.filter(
    (r) => (r.approval_status || "pending") === "pending"
  );
  const approvedRestaurants = restaurants.filter(
    (r) => r.approval_status === "approved"
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-gray-900 border border-white/10 px-8 py-6 shadow-xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Platform Admin Panel...</span>
        </div>
      </main>
    );
  }

  // If not authenticated as admin, show inline Admin Login form
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] p-6 text-white">
        <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Platform Admin Panel</h1>
              <p className="text-xs font-bold text-orange-400">DineFlow Core Control</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Enter your Platform Founder / Admin credentials below to unlock management controls.
          </p>

          <form onSubmit={handleAdminSubmitLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-400 uppercase">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@dineflow.uz"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-gray-400 uppercase">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-orange-500"
              />
            </div>

            {adminLoginError && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-bold text-red-400">
                {adminLoginError}
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoginLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
            >
              {adminLoginLoading && <Loader2 className="animate-spin" size={16} />}
              {adminLoginLoading ? "Verifying..." : "Sign In to Admin Panel"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
              <Utensils size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black">DineFlow Admin</span>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black text-orange-400 border border-orange-500/30">
                  OWNER & STAFF
                </span>
              </div>
              <p className="text-xs text-gray-400">Platform Control & Verification Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setupRealtimeListeners()}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-bold text-gray-300 hover:bg-white/10"
            >
              <RefreshCw size={14} /> Live Sync
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Metric Cards Row */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-xl">
            <div className="flex items-center justify-between text-orange-400">
              <Users size={24} />
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold">
                Users
              </span>
            </div>
            <p className="mt-4 text-4xl font-black">{customers.length}</p>
            <p className="mt-1 text-xs font-bold text-gray-400">Total Registered Customers</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-xl">
            <div className="flex items-center justify-between text-sky-400">
              <Store size={24} />
              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-bold">
                {pendingRestaurants.length} Pending
              </span>
            </div>
            <p className="mt-4 text-4xl font-black">{restaurants.length}</p>
            <p className="mt-1 text-xs font-bold text-gray-400">Total Partner Restaurants</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-xl">
            <div className="flex items-center justify-between text-emerald-400">
              <CalendarDays size={24} />
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold">
                Live Bookings
              </span>
            </div>
            <p className="mt-4 text-4xl font-black">{totalBookings}</p>
            <p className="mt-1 text-xs font-bold text-gray-400">Platform Total Reservations</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-xl">
            <div className="flex items-center justify-between text-purple-400">
              <ShieldCheck size={24} />
              <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-bold">
                Staff
              </span>
            </div>
            <p className="mt-4 text-4xl font-black">{staffList.length}</p>
            <p className="mt-1 text-xs font-bold text-gray-400">Active Platform Employees</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 border-b border-white/10 pb-4 mb-8">
          {[
            { id: "overview", label: "Overview & Approvals", icon: LayoutDashboard },
            { id: "customers", label: `Customers Search (${customers.length})`, icon: Users },
            { id: "restaurants", label: `Partners & Restaurants (${restaurants.length})`, icon: Store },
            { id: "staff", label: `Platform Staff (${staffList.length})`, icon: ShieldCheck },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & PENDING APPROVALS */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Pending Approvals Table */}
            <div className="rounded-[2.5rem] border border-white/10 bg-gray-900/80 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black">Pending Restaurant Approvals</h2>
                  <p className="text-sm text-gray-400">
                    Review legal info, STIR/ИНН data, and approve restaurant partners.
                  </p>
                </div>
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-black text-orange-400 border border-orange-500/30">
                  {pendingRestaurants.length} Needs Review
                </span>
              </div>

              {pendingRestaurants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-gray-400">
                  <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} />
                  <p className="font-bold">No pending restaurants waiting for approval.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                      <tr>
                        <th className="py-3 px-4">Restaurant</th>
                        <th className="py-3 px-4">STIR / ИНН</th>
                        <th className="py-3 px-4">Cuisine & City</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingRestaurants.map((res) => (
                        <tr key={res.id} className="hover:bg-white/5">
                          <td className="py-4 px-4 font-black text-white">{res.name}</td>
                          <td className="py-4 px-4 font-mono text-orange-400 font-bold">
                            {res.stir || <span className="text-gray-500">Not provided</span>}
                          </td>
                          <td className="py-4 px-4">
                            {res.cuisine_type || "General"} • {res.city || "Tashkent"}
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-400">
                            {res.created_at ? new Date(res.created_at).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleUpdateRestaurantStatus(res.id, "approved")}
                              disabled={actionLoading === res.id + "_approved"}
                              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateRestaurantStatus(res.id, "rejected")}
                              disabled={actionLoading === res.id + "_rejected"}
                              className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-500/30"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS SEARCH & DIRECTORY */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-gray-900/80 p-6">
              <div>
                <h2 className="text-2xl font-black">Customer Search & Management</h2>
                <p className="text-sm text-gray-400">
                  Search registered customers, inspect account profiles, and toggle statuses.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Toggle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="py-4 px-4 font-black text-white flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-bold">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        {user.full_name}
                      </td>
                      <td className="py-4 px-4">{user.email}</td>
                      <td className="py-4 px-4 text-xs font-mono">{user.phone || "N/A"}</td>
                      <td className="py-4 px-4">
                        <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            user.status === "suspended"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {user.status === "suspended" ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(user.uid, user.status)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            user.status === "suspended"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                          }`}
                        >
                          {user.status === "suspended" ? "Activate User" : "Suspend User"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PARTNERS & RESTAURANTS DIRECTORY */}
        {activeTab === "restaurants" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-gray-900/80 p-6">
              <div>
                <h2 className="text-2xl font-black">Partner & Restaurant Directory</h2>
                <p className="text-sm text-gray-400">
                  Search by restaurant name, STIR/ИНН, city, or status.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  placeholder="Search restaurant or STIR/ИНН..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="py-3 px-4">Restaurant Name</th>
                    <th className="py-3 px-4">STIR / ИНН</th>
                    <th className="py-3 px-4">Cuisine & City</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRestaurants.map((res) => (
                    <tr key={res.id} className="hover:bg-white/5">
                      <td className="py-4 px-4 font-black text-white">{res.name}</td>
                      <td className="py-4 px-4 font-mono text-orange-400 font-bold">
                        {res.stir || <span className="text-gray-500">Not provided</span>}
                      </td>
                      <td className="py-4 px-4">
                        {res.cuisine_type || "General"} • {res.city || "Tashkent"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                            res.approval_status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : res.approval_status === "rejected"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          }`}
                        >
                          {res.approval_status || "pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {res.approval_status !== "approved" && (
                          <button
                            onClick={() => handleUpdateRestaurantStatus(res.id, "approved")}
                            className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                          >
                            Approve
                          </button>
                        )}
                        {res.approval_status !== "suspended" && (
                          <button
                            onClick={() => handleUpdateRestaurantStatus(res.id, "suspended")}
                            className="rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM STAFF & EMPLOYEES */}
        {activeTab === "staff" && (
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-white/10 bg-gray-900/80 p-8 shadow-xl">
              <h2 className="text-2xl font-black">Platform Employee Roles & Permissions</h2>
              <p className="text-sm text-gray-400 mt-1">
                Add support managers, auditors, and super admins for the platform.
              </p>

              {/* Add staff form */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <h3 className="text-sm font-bold text-orange-400 uppercase">Add Platform Employee</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="text"
                    placeholder="Employee Full Name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) =>
                      setNewStaffRole(e.target.value as StaffMember["role"])
                    }
                    className="rounded-xl border border-white/10 bg-gray-900 px-3.5 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Support Manager">Support Manager</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddStaffMember}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20"
                >
                  <UserPlus size={16} /> Assign Employee Permission
                </button>
              </div>

              {/* Staff Grid */}
              {staffList.length === 0 && (
                <p className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm font-bold text-gray-400">
                  No platform employees added yet.
                </p>
              )}

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {staffList.map((staff) => (
                  <div
                    key={staff.id || staff.email}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 font-black">
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-white">{staff.full_name}</p>
                        <p className="text-xs font-bold text-orange-400">{staff.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{staff.email}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span className="text-emerald-400 font-bold">● Active Access</span>
                      <span className="text-gray-500">{staff.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}