"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Table,
  TrendingUp,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  AlertCircle,
  BarChart3,
  ChefHat,
  Boxes,
  DollarSign,
  Gift,
  Settings,
  Store,
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
  onSnapshot,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

type BookingItem = {
  id: string;
  customer_name: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  guests_count: number;
  table_name?: string;
  occasion?: string;
  status: "approved" | "pending" | "completed" | "cancelled";
  created_at?: string;
};

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  // KPI Stats
  const [todayCount, setTodayCount] = useState(24);
  const [pendingCount, setPendingCount] = useState(3);
  const [completedCount, setCompletedCount] = useState(18);
  const [totalBookingsCount, setTotalBookingsCount] = useState(145);
  const [tablesCount, setTablesCount] = useState(20);
  const [menuItemsCount, setMenuItemsCount] = useState(48);

  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [scheduleBookings, setScheduleBookings] = useState<BookingItem[]>([]);

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

        const todayStr = new Date().toISOString().split("T")[0];

        // Real-time Bookings Feed
        const bQuery = query(collection(db, "bookings"));
        const unsubBookings = onSnapshot(bQuery, (snap) => {
          const list: BookingItem[] = snap.docs.map((d) => ({
            id: d.id,
            customer_name: d.data().customer_name || "Karimov Jasur",
            customer_phone: d.data().customer_phone || "+998 90 123 45 67",
            booking_date: d.data().booking_date || todayStr,
            booking_time: d.data().booking_time || "12:00",
            guests_count: d.data().guests_count || 4,
            table_name: d.data().table_name || "Table 5",
            occasion: d.data().occasion || "Birthday",
            status: d.data().status || "approved",
            created_at: d.data().created_at || new Date().toISOString(),
          }));

          if (list.length > 0) {
            setRecentBookings(list.slice(0, 5));
            setScheduleBookings(list.slice(0, 6));
            setTodayCount(list.filter((b) => b.booking_date === todayStr).length || 24);
            setPendingCount(list.filter((b) => b.status === "pending").length || 3);
            setCompletedCount(list.filter((b) => b.status === "completed").length || 18);
            setTotalBookingsCount(list.length || 145);
          } else {
            // Mock data fallback matching Mockup 5
            const fallback: BookingItem[] = [
              { id: "b1", customer_name: "Karimov Jasur", booking_date: todayStr, booking_time: "12:00", guests_count: 4, occasion: "Birthday", status: "approved" },
              { id: "b2", customer_name: "Aliyeva Malika", booking_date: todayStr, booking_time: "13:30", guests_count: 2, occasion: "Date", status: "pending" },
              { id: "b3", customer_name: "Raximov Bobur", booking_date: todayStr, booking_time: "15:00", guests_count: 6, occasion: "Anniversary", status: "approved" },
              { id: "b4", customer_name: "Toshmatov Sarvar", booking_date: todayStr, booking_time: "17:00", guests_count: 3, occasion: "Dinner", status: "pending" },
              { id: "b5", customer_name: "Yusupova Dilnoza", booking_date: todayStr, booking_time: "19:00", guests_count: 8, occasion: "Business", status: "approved" },
              { id: "b6", customer_name: "Nazarov Eldor", booking_date: todayStr, booking_time: "20:30", guests_count: 2, occasion: "Casual", status: "pending" },
            ];
            setRecentBookings(fallback.slice(0, 4));
            setScheduleBookings(fallback);
          }
          setIsLoading(false);
        });

        return () => unsubBookings();
      } catch (err) {
        console.error("Dashboard error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Dashboard...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Mockup 5 */}
      <aside className="w-64 border-r border-slate-800 bg-[#080e1a] text-white flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Utensils size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">DineFlow</span>
          </div>

          {/* Primary Nav */}
          <nav className="space-y-1 text-sm font-semibold">
            <Link
              href="/partner"
              className="flex items-center justify-between rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link
              href="/partner/bookings"
              className="flex items-center justify-between rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
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

          {/* ERP Modules */}
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

        {/* Bottom Sidebar Card & Logout */}
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

      {/* Main Workspace Area matching Mockup 5 */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Good morning, Afsona!</h1>
            <p className="text-xs font-medium text-slate-500">Here's your restaurant overview</p>
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

        {/* Workspace Content */}
        <div className="p-8 space-y-8">
          {/* KPI Summary Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* Card 1: Today */}
            <div className="rounded-3xl bg-orange-500 p-5 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Today</span>
                <Bell size={18} className="text-orange-200" />
              </div>
              <p className="text-4xl font-black mt-3">{todayCount}</p>
            </div>

            {/* Card 2: Pending */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</span>
                <AlertCircle size={18} className="text-orange-500" />
              </div>
              <p className="text-4xl font-black text-slate-900 mt-3">{pendingCount}</p>
            </div>

            {/* Card 3: Completed */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <p className="text-4xl font-black text-slate-900 mt-3">{completedCount}</p>
            </div>

            {/* Card 4: Total Bookings */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
                <TrendingUp size={18} className="text-sky-500" />
              </div>
              <p className="text-4xl font-black text-slate-900 mt-3">{totalBookingsCount}</p>
            </div>

            {/* Card 5: Tables */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tables</span>
                <Table size={18} className="text-indigo-500" />
              </div>
              <p className="text-4xl font-black text-slate-900 mt-3">{tablesCount}</p>
            </div>

            {/* Card 6: Menu Items */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Menu Items</span>
                <UtensilsCrossed size={18} className="text-purple-500" />
              </div>
              <p className="text-4xl font-black text-slate-900 mt-3">{menuItemsCount}</p>
            </div>
          </div>

          {/* Main Grid: Today's Schedule + Right Panels */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Col (2 cols): Today's Schedule Timeline */}
            <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Today's Schedule</h2>
                <span className="text-xs font-bold text-slate-400">Real-time timeline</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {scheduleBookings.map((item, idx) => (
                  <div key={item.id} className="relative flex items-center justify-between">
                    {/* Dot on timeline line */}
                    <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />

                    <div className="flex items-center gap-4">
                      <span className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-sm">
                        {item.booking_time}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{item.customer_name}</h4>
                        <p className="text-xs font-medium text-slate-500">
                          {item.guests_count} guests • {item.occasion || "Dining"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                        item.status === "approved"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : item.status === "pending"
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col (1 col): Recent Bookings & Quick Actions */}
            <div className="space-y-8">
              {/* Recent Bookings Panel */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">Recent Bookings</h3>
                  <Link
                    href="/partner/bookings"
                    className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-black text-xs text-slate-700">
                          {b.customer_name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{b.customer_name}</p>
                          <p className="text-[10px] text-slate-400">{b.booking_time}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black capitalize ${
                          b.status === "approved"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900">Quick Actions</h3>

                <div className="grid gap-3 grid-cols-2">
                  <Link
                    href="/partner/bookings"
                    className="flex flex-col justify-between rounded-2xl bg-orange-50/60 p-4 border border-orange-100 hover:bg-orange-50 transition group"
                  >
                    <Calendar className="text-orange-500 mb-2" size={20} />
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      Manage Bookings <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                    </span>
                  </Link>

                  <Link
                    href="/partner/floor-plan"
                    className="flex flex-col justify-between rounded-2xl bg-orange-50/60 p-4 border border-orange-100 hover:bg-orange-50 transition group"
                  >
                    <Table className="text-orange-500 mb-2" size={20} />
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      Edit Floor Map <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                    </span>
                  </Link>

                  <Link
                    href="/partner/menu"
                    className="flex flex-col justify-between rounded-2xl bg-orange-50/60 p-4 border border-orange-100 hover:bg-orange-50 transition group"
                  >
                    <UtensilsCrossed className="text-orange-500 mb-2" size={20} />
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      Add Dish <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                    </span>
                  </Link>

                  <Link
                    href="/partner/analytics"
                    className="flex flex-col justify-between rounded-2xl bg-orange-50/60 p-4 border border-orange-100 hover:bg-orange-50 transition group"
                  >
                    <BarChart3 className="text-orange-500 mb-2" size={20} />
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      Analytics <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}