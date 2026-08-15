"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  ChefHat,
  Clock,
  Edit2,
  Loader2,
  LogOut,
  Plus,
  Search,
  Table,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  BarChart3,
  Boxes,
  DollarSign,
  Gift,
  Settings,
  Store,
  LayoutDashboard,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import PartnerSidebar from "@/components/PartnerSidebar";
import PartnerHeaderActions from "@/components/PartnerHeaderActions";
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

type StaffMember = {
  id: string;
  name: string;
  role: "Waiter" | "Head Chef" | "Line Cook" | "Cashier";
  phone: string;
  status: "on_shift" | "off_shift" | "on_break";
  tables: string;
  hire_date: string;
  avatar_url: string;
};

export default function StaffRosterPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");

  const [activeSubtab, setActiveSubtab] = useState<"list" | "schedule" | "roles">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Held in a ref because the async auth callback cannot return a cleanup
  const staffListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const detachStaff = () => {
      staffListenerRef.current?.();
      staffListenerRef.current = null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      detachStaff();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rSnap = await getDocs(
          query(collection(db, "restaurants"), where("owner_id", "==", user.uid))
        );

        if (rSnap.empty) {
          setStaffList([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        setRestaurantName(rDoc.data().name || "Your restaurant");

        // Employees of this restaurant only
        staffListenerRef.current = onSnapshot(
          query(collection(db, "staff"), where("restaurant_id", "==", rDoc.id)),
          (snap) => {
            const list: StaffMember[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                // Onboarding writes full_name; the roster screen reads name
                name: data.name || data.full_name || "Staff",
                role: data.role || "Waiter",
                phone: data.phone || "",
                status: data.status || "off_shift",
                tables: data.tables || "",
                hire_date: data.hire_date || "",
                avatar_url: data.avatar_url || "",
              };
            });

            setStaffList(list);
            setIsLoading(false);
          },
          (err) => {
            console.error("Staff listener error:", err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("Staff load error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detachStaff();
    };
  }, [router]);

  async function handleDeleteStaff(id: string) {
    try {
      await deleteDoc(doc(db, "staff", id));
    } catch (err) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Staff Roster...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Staff Mockup */}
      <PartnerSidebar active="staff" />

      {/* Main Workspace Area matching Staff Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Staff</h1>
            <p className="text-xs font-medium text-slate-500">14 team members • 3 on shift now</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 transition">
              <Plus size={16} /> + Add Staff Member
            </button>

            <LanguageSwitcher />
            <PartnerHeaderActions />

            
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-8">
          {/* Summary KPI Cards Row matching Staff Mockup */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Staff */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Staff</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{staffList.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Users size={24} />
              </div>
            </div>

            {/* Card 2: On Shift Now (Orange Active) */}
            <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-100">On Shift Now</p>
                <p className="text-3xl font-black mt-2">
                  {staffList.filter((s) => s.status === "on_shift").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/40 text-white">
                <Clock size={24} />
              </div>
            </div>

            {/* Card 3: Waiters */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Waiters</p>
                <p className="text-3xl font-black text-slate-900 mt-2">
                  {staffList.filter((s) => s.role === "Waiter").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <UserCheck size={24} />
              </div>
            </div>

            {/* Card 4: Kitchen Staff */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kitchen Staff</p>
                <p className="text-3xl font-black text-slate-900 mt-2">
                  {staffList.filter((s) => s.role === "Head Chef" || s.role === "Line Cook").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <ChefHat size={24} />
              </div>
            </div>
          </div>

          {/* Sub-tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(["list", "schedule", "roles"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setActiveSubtab(st)}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-black capitalize transition ${
                    activeSubtab === st
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {st === "list" ? "Staff List" : st === "schedule" ? "Shift Schedule" : "Roles & Permissions"}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 w-64"
              />
            </div>
          </div>

          {/* Staff Directory Table matching Staff Mockup */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6">Shift Status</th>
                    <th className="py-4 px-6">Assigned Tables</th>
                    <th className="py-4 px-6">Hire Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      {/* Avatar & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={s.avatar_url} alt={s.name} className="h-10 w-10 rounded-full object-cover" />
                          <span className="font-black text-slate-900">{s.name}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6 text-slate-600">{s.role}</td>

                      {/* Phone */}
                      <td className="py-4 px-6 font-mono text-slate-500">{s.phone}</td>

                      {/* Shift Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black capitalize ${
                            s.status === "on_shift"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : s.status === "on_break"
                              ? "bg-orange-50 text-orange-600 border border-orange-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Tables */}
                      <td className="py-4 px-6 text-slate-900">{s.tables}</td>

                      {/* Hire Date */}
                      <td className="py-4 px-6 text-slate-500">{s.hire_date}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(s.id)}
                            className="rounded-xl p-1.5 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Shift Timeline Gantt Chart matching Staff Mockup */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Today&apos;s Shift Timeline</h3>

            <div className="space-y-3 overflow-x-auto pt-2">
              <div className="grid grid-cols-8 gap-2 text-[10px] font-bold text-slate-400 text-center pl-36">
                {["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "9 PM", "11 PM"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>

              {[
                { name: "Karimov Bobur", role: "Head Chef", shift: "Morning", color: "bg-emerald-500", start: 0, width: "60%" },
                { name: "Aliyeva Dilnoza", role: "Waiter", shift: "Afternoon", color: "bg-orange-500", start: "25%", width: "50%" },
                { name: "Yusupova Malika", role: "Cashier", shift: "Evening", color: "bg-sky-500", start: "50%", width: "45%" },
              ].map((st, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-xs font-bold">
                    <p className="text-slate-900 truncate">{st.name}</p>
                    <p className="text-[10px] text-slate-400">{st.role}</p>
                  </div>
                  <div className="flex-1 h-8 rounded-xl bg-slate-50 relative overflow-hidden">
                    <div
                      className={`h-full rounded-xl ${st.color} opacity-90 flex items-center px-3 text-white text-[10px] font-black shadow-sm`}
                      style={{ marginLeft: st.start, width: st.width }}
                    >
                      {st.shift} Shift
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
