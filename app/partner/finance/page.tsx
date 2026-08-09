"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  LogOut,
  PieChart as PieIcon,
  Table,
  Wallet,
  Utensils,
  BarChart3,
  ChefHat,
  Boxes,
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
import { auth, signOut } from "@/lib/firebase";

export default function FinancePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");
  const [filterPeriod, setFilterPeriod] = useState<"Day" | "Week" | "Month" | "Year">("Month");

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
          <span className="font-bold text-gray-300">Loading Finance...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Finance Mockup */}
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20"
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

      {/* Main Workspace Area matching Finance Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Finance</h1>
            <p className="text-xs font-medium text-slate-500">August 2026 overview</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Pills */}
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["Day", "Week", "Month", "Year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                    filterPeriod === p ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
              <Download size={14} /> Export Report
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
          {/* Summary KPI Cards Row matching Finance Mockup */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Revenue (Orange Card) */}
            <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Revenue</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/40 text-white">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black">$18,420</p>
                <span className="inline-block mt-2 rounded-md bg-orange-400/30 px-2 py-0.5 text-[10px] font-black text-white">
                  ↑ 12.4%
                </span>
              </div>
            </div>

            {/* Card 2: Expenses */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expenses</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900">$9,180</p>
                <span className="inline-block mt-2 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600">
                  ↑ 3.1%
                </span>
              </div>
            </div>

            {/* Card 3: Net Profit */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900">$9,240</p>
                <span className="inline-block mt-2 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                  ↑ 18.9%
                </span>
              </div>
            </div>

            {/* Card 4: Today's Cash */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Cash</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Wallet size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900">$1,860</p>
              </div>
            </div>
          </div>

          {/* Charts Row: Revenue vs Expenses Dual Bar + Expense Breakdown Donut */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Revenue vs Expenses Bar Chart */}
            <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Revenue vs Expenses</h3>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Expenses
                  </span>
                </div>
              </div>

              {/* Bar Visualization */}
              <div className="flex items-end justify-between gap-4 h-60 pt-6 px-4">
                {[
                  { date: "Aug 12", rev: 2200, exp: 1100 },
                  { date: "Aug 13", rev: 2800, exp: 1300 },
                  { date: "Aug 14", rev: 3600, exp: 1700 },
                  { date: "Aug 15", rev: 2600, exp: 1200 },
                  { date: "Aug 16", rev: 3100, exp: 1400 },
                  { date: "Aug 17", rev: 2850, exp: 1300 },
                  { date: "Aug 18", rev: 3000, exp: 1350 },
                ].map((bar) => (
                  <div key={bar.date} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex items-end gap-1.5 h-full w-full justify-center">
                      <div
                        className="w-4 rounded-t-md bg-orange-500 transition-all hover:opacity-90"
                        style={{ height: `${(bar.rev / 4000) * 100}%` }}
                      />
                      <div
                        className="w-4 rounded-t-md bg-slate-300 transition-all hover:opacity-90"
                        style={{ height: `${(bar.exp / 4000) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{bar.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 Col: Expense Breakdown Donut Chart */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <h3 className="text-base font-black text-slate-900">Expense Breakdown</h3>

              {/* Donut Visual */}
              <div className="relative flex items-center justify-center">
                <div className="h-40 w-40 rounded-full border-[16px] border-orange-500 border-t-sky-500 border-r-purple-500 border-b-emerald-500 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900">$9,180</span>
                  <span className="text-[9px] font-bold text-slate-400">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Ingredients
                  </span>
                  <span>45% ($4,131)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Staff Wages
                  </span>
                  <span>30% ($2,754)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Utilities
                  </span>
                  <span>12% ($1,102)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Rent
                  </span>
                  <span>8% ($734)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Other
                  </span>
                  <span>5% ($459)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Cash Register Table matching Finance Mockup */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Daily Cash Register</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Opening Balance</th>
                    <th className="py-3.5 px-4">Cash In</th>
                    <th className="py-3.5 px-4">Cash Out</th>
                    <th className="py-3.5 px-4">Closing Balance</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { date: "Aug 18, 2026 (Mon)", open: "$1,245.00", in: "$5,320.00", out: "$4,705.00", close: "$1,860.00", status: "Reconciled" },
                    { date: "Aug 17, 2026 (Sun)", open: "$1,390.00", in: "$5,115.00", out: "$5,260.00", close: "$1,245.00", status: "Reconciled" },
                    { date: "Aug 16, 2026 (Sat)", open: "$1,105.00", in: "$4,890.00", out: "$4,605.00", close: "$1,390.00", status: "Reconciled" },
                    { date: "Aug 15, 2026 (Fri)", open: "$920.00", in: "$4,230.00", out: "$4,045.00", close: "$1,105.00", status: "Pending" },
                    { date: "Aug 14, 2026 (Thu)", open: "$875.00", in: "$3,980.00", out: "$3,935.00", close: "$920.00", status: "Reconciled" },
                  ].map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-900 font-mono">{row.date}</td>
                      <td className="py-3.5 px-4 font-mono">{row.open}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-600">{row.in}</td>
                      <td className="py-3.5 px-4 font-mono text-red-600">{row.out}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900">{row.close}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${
                            row.status === "Reconciled"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-orange-50 text-orange-600 border border-orange-200"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profit & Loss Summary Card matching Finance Mockup */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Profit & Loss Summary</h3>

            <div className="grid gap-6 md:grid-cols-2 text-xs font-bold divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="space-y-3 pr-4">
                <div className="flex justify-between text-slate-600">
                  <span>Total Revenue</span>
                  <span className="font-black text-slate-900">$18,420.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cost of Goods Sold</span>
                  <span className="font-black text-slate-900">$6,420.00</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-900 font-black">
                  <span>Gross Profit</span>
                  <span>$12,000.00</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                <div className="flex justify-between text-slate-600">
                  <span>Operating Expenses</span>
                  <span className="font-black text-slate-900">$2,760.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Other Income</span>
                  <span className="font-black text-slate-900">$0.00</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-orange-600 font-black text-sm">
                  <span>Net Profit</span>
                  <span>$9,240.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
