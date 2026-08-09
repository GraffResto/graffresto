"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  ChevronDown,
  DollarSign,
  Download,
  Loader2,
  LogOut,
  TrendingDown,
  TrendingUp,
  UserX,
  Users,
  Utensils,
  Table,
  BarChart3,
  ChefHat,
  Boxes,
  Gift,
  Settings,
  Store,
  LayoutDashboard,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { auth, signOut } from "@/lib/firebase";

export default function AnalyticsSuitePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");
  const [timeRange, setTimeRange] = useState<"Today" | "Week" | "Month" | "Year">("Month");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setIsLoading(false);
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
          <span className="font-bold text-gray-300">Loading Analytics...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Analytics Mockup */}
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
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

      {/* Main Workspace Area matching Analytics Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
            <p className="text-xs font-medium text-slate-500">Track your restaurant's performance</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Pills */}
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["Today", "Week", "Month", "Year"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                    timeRange === r ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
              <Download size={14} /> Export
            </button>

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
        <div className="p-8 space-y-8">
          {/* KPI Summary Cards matching Analytics Mockup */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Revenue */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue</p>
                <p className="text-3xl font-black text-slate-900 mt-1">$18,420</p>
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp size={14} /> ↑ 12.4% <span className="text-slate-400 font-normal">vs last month</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <DollarSign size={24} />
              </div>
            </div>

            {/* Card 2: Bookings */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bookings</p>
                <p className="text-3xl font-black text-slate-900 mt-1">412</p>
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp size={14} /> ↑ 8.1% <span className="text-slate-400 font-normal">vs last month</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Calendar size={24} />
              </div>
            </div>

            {/* Card 3: Avg Party Size */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg. Party Size</p>
                <p className="text-3xl font-black text-slate-900 mt-1">3.4</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">— vs last month</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Users size={24} />
              </div>
            </div>

            {/* Card 4: No-show Rate */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No-show Rate</p>
                <p className="text-3xl font-black text-slate-900 mt-1">4.2%</p>
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingDown size={14} /> ↓ -1.1% <span className="text-slate-400 font-normal">vs last month</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <UserX size={24} />
              </div>
            </div>
          </div>

          {/* Charts Row: Revenue Trend + Booking Status Breakdown */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Revenue Trend SVG Area Chart */}
            <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Revenue Trend</h3>
                <select className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Curve Chart Container with Tooltip matching Analytics Mockup */}
              <div className="relative h-64 w-full pt-6">
                {/* May 20 $22,310 Tooltip */}
                <div className="absolute left-[58%] top-4 z-10 rounded-2xl bg-slate-900 px-3 py-1.5 text-white shadow-xl text-[10px] font-bold text-center">
                  <p className="opacity-70 text-[9px]">May 20</p>
                  <p className="text-xs font-black text-orange-400">$22,310</p>
                </div>

                <svg className="h-full w-full overflow-visible" viewBox="0 0 600 200">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 0 150 C 40 120, 80 140, 120 100 C 160 130, 200 80, 240 110 C 280 70, 320 40, 360 20 C 400 60, 440 40, 480 80 C 520 70, 560 90, 600 110 L 600 200 L 0 200 Z"
                    fill="url(#revenueGrad)"
                  />
                  <path
                    d="M 0 150 C 40 120, 80 140, 120 100 C 160 130, 200 80, 240 110 C 280 70, 320 40, 360 20 C 400 60, 440 40, 480 80 C 520 70, 560 90, 600 110"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3.5"
                  />
                  <circle cx="360" cy="20" r="5" fill="#f97316" className="animate-ping" />
                  <circle cx="360" cy="20" r="5" fill="#f97316" />
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between pt-3 text-[10px] font-bold text-slate-400">
                  <span>May 1</span>
                  <span>May 6</span>
                  <span>May 11</span>
                  <span>May 16</span>
                  <span>May 21</span>
                  <span>May 26</span>
                  <span>May 31</span>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Booking Status Breakdown Donut Chart */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <h3 className="text-base font-black text-slate-900">Booking Status Breakdown</h3>

              {/* Donut Chart Visual */}
              <div className="relative flex items-center justify-center">
                <div className="h-44 w-44 rounded-full border-[18px] border-emerald-500 border-t-orange-500 border-r-sky-500 border-b-red-500 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">412</span>
                  <span className="text-[10px] font-bold text-slate-400">Total</span>
                </div>
              </div>

              {/* Status List */}
              <div className="space-y-2.5 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Approved
                  </span>
                  <span>68% (281)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Pending
                  </span>
                  <span>12% (49)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Completed
                  </span>
                  <span>15% (62)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Cancelled
                  </span>
                  <span>5% (20)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Peak Hours Heatmap + Top Performing Dishes */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Heatmap Card */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Peak Hours Heatmap</h3>

              <div className="space-y-2 overflow-x-auto">
                <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-slate-400 text-center pl-8">
                  {["11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM"].map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>

                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-6 text-[10px] font-bold text-slate-400">{day}</span>
                    <div className="grid grid-cols-12 gap-1 flex-1">
                      {[1, 2, 3, 2, 4, 3, 5, 7, 9, 10, 8, 4].map((intensity, idx) => (
                        <div
                          key={idx}
                          className="h-6 rounded-md transition hover:scale-105"
                          style={{
                            backgroundColor: `rgba(249, 115, 22, ${intensity * 0.1})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-end gap-2 pt-3 text-[10px] font-bold text-slate-400">
                  <span>Low Traffic</span>
                  <div className="flex gap-1">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((op, i) => (
                      <span key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `rgba(249, 115, 22, ${op})` }} />
                    ))}
                  </div>
                  <span>High Traffic</span>
                </div>
              </div>
            </div>

            {/* Top Performing Dishes Card */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Top Performing Dishes</h3>

              <div className="space-y-4">
                {[
                  { name: "Pasta Bologna", orders: 342, pct: 100, img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=200" },
                  { name: "Grilled Steak", orders: 287, pct: 84, img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200" },
                  { name: "Spicy Fried Chicken", orders: 254, pct: 74, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=200" },
                  { name: "Salmon Teriyaki", orders: 198, pct: 58, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=200" },
                  { name: "Tiramisu", orders: 156, pct: 45, img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=200" },
                ].map((dish) => (
                  <div key={dish.name} className="flex items-center gap-4">
                    <img src={dish.img} alt={dish.name} className="h-10 w-10 rounded-2xl object-cover" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900">{dish.name}</span>
                        <span className="text-slate-500">{dish.orders} orders</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${dish.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bookings Trend by Table Size Table */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Bookings Trend by Table Size</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Party Size</th>
                    <th className="py-3 px-4">Bookings</th>
                    <th className="py-3 px-4">% of Total</th>
                    <th className="py-3 px-4">Avg Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-black">2-top</td>
                    <td className="py-3 px-4">128</td>
                    <td className="py-3 px-4">31.1%</td>
                    <td className="py-3 px-4 text-slate-900 font-black">$34.20</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-black">4-top</td>
                    <td className="py-3 px-4">174</td>
                    <td className="py-3 px-4">42.2%</td>
                    <td className="py-3 px-4 text-slate-900 font-black">$45.80</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-black">6-top</td>
                    <td className="py-3 px-4">78</td>
                    <td className="py-3 px-4">18.9%</td>
                    <td className="py-3 px-4 text-slate-900 font-black">$56.30</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-black">8+ top</td>
                    <td className="py-3 px-4">32</td>
                    <td className="py-3 px-4">7.8%</td>
                    <td className="py-3 px-4 text-slate-900 font-black">$71.40</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
