"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Table,
  Utensils,
  XCircle,
  BarChart3,
  ChefHat,
  Boxes,
  DollarSign,
  Gift,
  Settings,
  Store,
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
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
  deleteDoc,
  onSnapshot,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

type Booking = {
  id: string;
  customer_name: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  table_name: string;
  guests_count: number;
  occasion?: string;
  payment_status?: "paid" | "not_paid";
  status: "approved" | "pending" | "completed" | "cancelled";
  source?: string;
};

export default function BookingsManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);

  // New Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("18:00");
  const [newTable, setNewTable] = useState("Table 1");
  const [newGuests, setNewGuests] = useState(4);
  const [newOccasion, setNewOccasion] = useState("Dining");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (!rSnap.empty) {
          const rDoc = rSnap.docs[0];
          setRestaurantId(rDoc.id);
          setRestaurantName(rDoc.data().name || "Afsona Restaurant");
        }

        // Real-time Firestore Listeners
        const unsub = onSnapshot(collection(db, "bookings"), (snap) => {
          const list: Booking[] = snap.docs.map((d) => ({
            id: d.id,
            customer_name: d.data().customer_name || "Guest",
            customer_phone: d.data().customer_phone || "+998 90 123 45 67",
            booking_date: d.data().booking_date || "Today",
            booking_time: d.data().booking_time || "12:00",
            table_name: d.data().table_name || "Table 1",
            guests_count: d.data().guests_count || 2,
            occasion: d.data().occasion || "",
            payment_status: d.data().payment_status || "paid",
            status: d.data().status || "approved",
            source: d.data().source || "Website",
          }));

          if (list.length > 0) {
            setBookings(list);
          } else {
            // Mock dataset matching Mockup 4
            setBookings([
              { id: "b1", customer_name: "Karimov Jasur", customer_phone: "+998 90 123 45 67", booking_date: "Today", booking_time: "12:00", table_name: "Table 5", guests_count: 4, occasion: "Birthday", payment_status: "paid", status: "approved" },
              { id: "b2", customer_name: "Aliyeva Malika", customer_phone: "+998 91 234 56 78", booking_date: "Today", booking_time: "13:30", table_name: "Table 2", guests_count: 2, occasion: "", payment_status: "not_paid", status: "pending" },
              { id: "b3", customer_name: "Raximov Bobur", customer_phone: "+998 93 345 67 89", booking_date: "Today", booking_time: "15:00", table_name: "Table 8", guests_count: 6, occasion: "Anniversary", payment_status: "paid", status: "approved" },
              { id: "b4", customer_name: "Toshmatov Sarvar", customer_phone: "+998 94 456 78 90", booking_date: "Today", booking_time: "17:00", table_name: "Table 3", guests_count: 3, occasion: "", payment_status: "not_paid", status: "pending" },
              { id: "b5", customer_name: "Yusupova Dilnoza", customer_phone: "+998 95 567 89 01", booking_date: "Tomorrow", booking_time: "19:00", table_name: "Table 10", guests_count: 8, occasion: "Business", payment_status: "paid", status: "approved" },
              { id: "b6", customer_name: "Nazarov Eldor", customer_phone: "+998 97 678 90 12", booking_date: "Yesterday", booking_time: "20:30", table_name: "Table 1", guests_count: 2, occasion: "", payment_status: "paid", status: "completed" },
              { id: "b7", customer_name: "Xolmatova Zarina", customer_phone: "+998 98 789 01 23", booking_date: "3 days ago", booking_time: "19:00", table_name: "Table 6", guests_count: 4, occasion: "", payment_status: "not_paid", status: "cancelled" },
            ]);
          }
          setIsLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("Bookings load error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleUpdateStatus(id: string, nextStatus: Booking["status"]) {
    try {
      await updateDoc(doc(db, "bookings", id), { status: nextStatus });
    } catch (err) {
      console.error("Error updating booking status:", err);
      // Fallback local update
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)));
    }
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomerName) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        restaurant_id: restaurantId,
        customer_name: newCustomerName,
        customer_phone: newCustomerPhone,
        booking_date: newDate,
        booking_time: newTime,
        table_name: newTable,
        guests_count: Number(newGuests),
        occasion: newOccasion,
        payment_status: "paid",
        status: "approved",
        source: "Website",
        created_at: new Date().toISOString(),
      });

      setShowModal(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    } catch (err) {
      console.error("Error creating booking:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  // Filtered dataset
  const filteredBookings = bookings.filter((b) => {
    const matchesTab = activeTab === "all" ? true : b.status === activeTab;
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone?.includes(searchQuery) ||
      b.table_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Bookings...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Mockup 4 */}
      <aside className="w-64 border-r border-slate-800 bg-[#080e1a] text-white flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Utensils size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">DineFlow</span>
          </div>

          <nav className="space-y-1 text-sm font-semibold">
            <Link
              href="/partner"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/partner/bookings"
              className="flex items-center justify-between rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} />
                <span>Bookings</span>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                3
              </span>
            </Link>

            <Link
              href="/partner/floor-plan"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Table size={18} />
              <span>Floor Map</span>
            </Link>

            <Link
              href="/partner/menu"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <UtensilsCrossed size={18} />
              <span>Menu</span>
            </Link>

            <Link
              href="/partner/analytics"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </Link>

            <Link
              href="/partner/crm"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Users size={18} />
              <span>CRM</span>
            </Link>

            <Link
              href="/partner/promotions"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Gift size={18} />
              <span>Promotions</span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-800 space-y-1">
            <p className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              ERP Modules
            </p>
            <Link
              href="/partner/kitchen"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <ChefHat size={16} /> Kitchen
            </Link>
            <Link
              href="/partner/inventory"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Boxes size={16} /> Inventory
            </Link>
            <Link
              href="/partner/finance"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <DollarSign size={16} /> Finance
            </Link>
            <Link
              href="/partner/staff"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <User size={16} /> Staff
            </Link>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <Link
            href="/partner/settings"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <Settings size={16} /> Settings
          </Link>

          <Link
            href="/partner/profile"
            className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 p-3 hover:bg-slate-800/80 transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-orange-400 font-bold border border-slate-700">
              <Store size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{restaurantName}</p>
              <p className="text-[10px] text-slate-400">Restaurant Owner</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace Area matching Mockup 4 */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Bookings</h1>
            <p className="text-xs font-medium text-slate-500">Manage all your reservations in one place</p>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="relative">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                <Bell size={18} />
              </button>
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white">
                3
              </span>
            </div>
            <Link
              href="/partner/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-500/20 hover:scale-105 transition"
            >
              A
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-6">
          {/* Top Controls Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs matching Mockup 4 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: `All (${bookings.length})` },
                { id: "pending", label: `Pending (${bookings.filter((b) => b.status === "pending").length})` },
                { id: "approved", label: `Approved (${bookings.filter((b) => b.status === "approved").length})` },
                { id: "completed", label: `Completed (${bookings.filter((b) => b.status === "completed").length})` },
                { id: "cancelled", label: `Cancelled (${bookings.filter((b) => b.status === "cancelled").length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeTab === tab.id
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions: View toggle, search, + New Booking */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "timeline" ? "bg-slate-100 text-slate-900" : "text-slate-500"
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "list" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  List view
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 w-48 sm:w-64"
                />
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 transition flex-shrink-0"
              >
                <Plus size={16} /> + New Booking
              </button>
            </div>
          </div>

          {/* Bookings Data Table matching Mockup 4 */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-4 px-6">Time</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Contact</th>
                    <th className="py-4 px-6">Table</th>
                    <th className="py-4 px-6">Party Size</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Source</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition">
                      {/* Time & Date */}
                      <td className="py-4 px-6 font-mono text-slate-900">{b.booking_time}</td>

                      {/* Customer Initials & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-black text-slate-700">
                            {b.customer_name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="font-black text-slate-900">{b.customer_name}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 font-mono text-slate-500">{b.customer_phone || "+998 90 123 45 67"}</td>

                      {/* Table */}
                      <td className="py-4 px-6">
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-slate-900 font-black">
                          {b.table_name}
                        </span>
                      </td>

                      {/* Party Size */}
                      <td className="py-4 px-6 text-slate-900 font-black">{b.guests_count}</td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[11px] font-black capitalize ${
                            b.status === "approved"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : b.status === "pending"
                              ? "bg-orange-50 text-orange-600 border border-orange-200"
                              : b.status === "completed"
                              ? "bg-sky-50 text-sky-600 border border-sky-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Source Badge */}
                      <td className="py-4 px-6 text-slate-500">{b.source || "Website"}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, "approved")}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-black text-emerald-600 hover:bg-emerald-100 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, "cancelled")}
                                className="rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-100 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching Mockup 4 */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-xs font-bold text-slate-400">
                Showing 1-{filteredBookings.length} of {bookings.length} bookings
              </span>

              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronLeft size={16} />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 font-black text-xs text-white">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  3
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Booking Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Create Reservation</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Karimov Jasur"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Table</label>
                  <select
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  >
                    <option value="Table 1">Table 1</option>
                    <option value="Table 2">Table 2</option>
                    <option value="Table 5">Table 5</option>
                    <option value="Table 8">Table 8</option>
                    <option value="Table 12">Table 12</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-orange-500 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Save Reservation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}