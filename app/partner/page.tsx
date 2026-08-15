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
  const [restaurantName, setRestaurantName] = useState("");

  // KPI Stats — all derived from this restaurant's own data
  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [tablesCount, setTablesCount] = useState(0);
  const [menuItemsCount, setMenuItemsCount] = useState(0);

  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [scheduleBookings, setScheduleBookings] = useState<BookingItem[]>([]);

  // Subscriptions are held in a ref: the async auth callback below cannot
  // return a working cleanup function to React, so we detach them ourselves.
  const listenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const detachListeners = () => {
      listenersRef.current.forEach((unsubscribe) => unsubscribe());
      listenersRef.current = [];
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      detachListeners();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          // Owner has no restaurant yet — send them through onboarding
          setIsLoading(false);
          router.push("/partner/pending");
          return;
        }

        const rDoc = rSnap.docs[0];
        const ownRestaurantId = rDoc.id;
        setRestaurantName(rDoc.data().name || "Your restaurant");

        const todayStr = new Date().toISOString().split("T")[0];

        // Real-time bookings for THIS restaurant only
        const bQuery = query(
          collection(db, "bookings"),
          where("restaurant_id", "==", ownRestaurantId)
        );
        const unsubBookings = onSnapshot(bQuery, (snap) => {
          const list: BookingItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              customer_name: data.customer_name || "Guest",
              customer_phone: data.customer_phone || "",
              booking_date: data.booking_date || "",
              booking_time: data.booking_time || "",
              guests_count: data.guests_count ?? 0,
              table_name: data.table_name || "",
              occasion: data.occasion || "",
              status: data.status || "pending",
              created_at: data.created_at || "",
            };
          });

          const sorted = [...list].sort((a, b) =>
            `${a.booking_date} ${a.booking_time}`.localeCompare(
              `${b.booking_date} ${b.booking_time}`
            )
          );

          setRecentBookings(sorted.slice(0, 5));
          setScheduleBookings(sorted.filter((b) => b.booking_date === todayStr).slice(0, 6));
          setTodayCount(list.filter((b) => b.booking_date === todayStr).length);
          setPendingCount(list.filter((b) => b.status === "pending").length);
          setCompletedCount(list.filter((b) => b.status === "completed").length);
          setTotalBookingsCount(list.length);
          setIsLoading(false);
        });

        // Real-time table and menu counts for THIS restaurant
        const unsubTables = onSnapshot(
          query(collection(db, "tables"), where("restaurant_id", "==", ownRestaurantId)),
          (snap) => setTablesCount(snap.size)
        );

        const unsubMenu = onSnapshot(
          query(collection(db, "menu_items"), where("restaurant_id", "==", ownRestaurantId)),
          (snap) => setMenuItemsCount(snap.size)
        );

        listenersRef.current = [unsubBookings, unsubTables, unsubMenu];
      } catch (err) {
        console.error("Dashboard error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detachListeners();
    };
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
      <PartnerSidebar active="dashboard" />

      {/* Main Workspace Area matching Mockup 5 */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Welcome back{restaurantName ? `, ${restaurantName}` : ""}!
            </h1>
            <p className="text-xs font-medium text-slate-500">Here&apos;s your restaurant overview</p>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <PartnerHeaderActions />

            
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
                <h2 className="text-xl font-black text-slate-900">Today&apos;s Schedule</h2>
                <span className="text-xs font-bold text-slate-400">Real-time timeline</span>
              </div>

              {scheduleBookings.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
                  No bookings scheduled for today yet.
                </p>
              )}

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {scheduleBookings.map((item) => (
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
                  {recentBookings.length === 0 && (
                    <p className="text-xs font-bold text-slate-400">No bookings yet.</p>
                  )}

                  {recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-black text-xs text-slate-700">
                          {b.customer_name
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "G"}
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