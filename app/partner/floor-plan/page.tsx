"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LogOut,
  Plus,
  Table as TableIcon,
  User,
  Users,
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
  Clock,
  MessageSquare,
  UserPlus,
  MoreHorizontal,
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
  doc,
  updateDoc,
  onSnapshot,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

type TableItem = {
  id: string;
  table_number: number;
  seats: number;
  zone: "MAIN HALL" | "TERRACE" | "VIP ROOM";
  status: "available" | "seated" | "arriving" | "occupied" | "blocked";
  guest_name?: string;
  guests_count?: number;
  time?: string;
};

export default function FloorMapSeatingPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  // Filters & State
  const [serviceFilter, setServiceFilter] = useState<"lunch" | "dinner">("lunch");
  const [leftTab, setLeftTab] = useState<"guests" | "alerts" | "history">("guests");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);

  // Default Mock Tables matching Mockup 1
  const [tables, setTables] = useState<TableItem[]>([
    { id: "t1", table_number: 1, seats: 4, zone: "MAIN HALL", status: "available" },
    { id: "t2", table_number: 2, seats: 4, zone: "MAIN HALL", status: "available" },
    { id: "t3", table_number: 3, seats: 4, zone: "MAIN HALL", status: "seated", guest_name: "Toshmatov Sarvar", guests_count: 3, time: "5:00 PM" },
    { id: "t4", table_number: 4, seats: 4, zone: "MAIN HALL", status: "available" },
    { id: "t5", table_number: 5, seats: 6, zone: "MAIN HALL", status: "occupied", guest_name: "Karimov Jasur", guests_count: 4, time: "12:00 PM" },
    { id: "t6", table_number: 6, seats: 4, zone: "MAIN HALL", status: "occupied" },
    { id: "t7", table_number: 7, seats: 4, zone: "MAIN HALL", status: "available" },
    { id: "t9", table_number: 9, seats: 4, zone: "MAIN HALL", status: "seated" },
    { id: "t10", table_number: 10, seats: 4, zone: "MAIN HALL", status: "available" },
    { id: "t11", table_number: 11, seats: 4, zone: "MAIN HALL", status: "arriving" },
    { id: "t13", table_number: 13, seats: 4, zone: "MAIN HALL", status: "blocked" },
    { id: "t14", table_number: 14, seats: 4, zone: "MAIN HALL", status: "available" },
    { id: "t15", table_number: 15, seats: 4, zone: "MAIN HALL", status: "seated" },

    // TERRACE
    { id: "t16", table_number: 16, seats: 4, zone: "TERRACE", status: "available" },
    { id: "t17", table_number: 17, seats: 4, zone: "TERRACE", status: "occupied" },
    { id: "t18", table_number: 18, seats: 4, zone: "TERRACE", status: "seated" },
    { id: "t19", table_number: 19, seats: 4, zone: "TERRACE", status: "arriving" },
    { id: "t21", table_number: 21, seats: 4, zone: "TERRACE", status: "available" },
    { id: "t22", table_number: 22, seats: 4, zone: "TERRACE", status: "available" },
    { id: "t23", table_number: 23, seats: 6, zone: "TERRACE", status: "seated" },
    { id: "t24", table_number: 24, seats: 4, zone: "TERRACE", status: "blocked" },
    { id: "t25", table_number: 25, seats: 4, zone: "TERRACE", status: "available" },
    { id: "t26", table_number: 26, seats: 4, zone: "TERRACE", status: "blocked" },
    { id: "t27", table_number: 27, seats: 6, zone: "TERRACE", status: "occupied" },

    // VIP ROOM
    { id: "t12", table_number: 12, seats: 8, zone: "VIP ROOM", status: "arriving", guest_name: "Aliyeva Malika", guests_count: 2, time: "1:30 PM" },
    { id: "t20", table_number: 20, seats: 4, zone: "VIP ROOM", status: "seated", guest_name: "Yusupova Dilnoza", guests_count: 8, time: "7:00 PM" },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  function handleChangeTableStatus(newStatus: TableItem["status"]) {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTable.id ? { ...t, status: newStatus } : t))
    );
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Seating Map...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#060c14] text-white font-sans">
      {/* Sidebar matching Mockup 1 */}
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
            >
              <TableIcon size={18} />
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

      {/* Main Workspace matching Mockup 1 */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#09111e]/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-white">Floor Map</h1>
            <p className="text-xs font-medium text-slate-400">Live view of your restaurant seating</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Navigator */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-bold text-slate-300">
              <button className="hover:text-white">
                <ChevronLeft size={16} />
              </button>
              <Calendar size={14} className="text-orange-400" />
              <span>Today, Aug 8</span>
              <button className="hover:text-white">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Service Filters */}
            <div className="flex items-center rounded-2xl border border-orange-500/30 bg-slate-900 p-1">
              <button
                onClick={() => setServiceFilter("lunch")}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                  serviceFilter === "lunch"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Lunch
              </button>
              <button
                onClick={() => setServiceFilter("dinner")}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                  serviceFilter === "dinner"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dinner
              </button>
            </div>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
              <Eye size={14} /> Show sections
            </button>

            <LanguageSwitcher />

            <div className="relative">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">
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

        {/* Floor Map Layout split view matching Mockup 1 */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
          {/* Left Guest Panel */}
          <div className="w-full lg:w-80 rounded-[2.5rem] border border-slate-800 bg-[#09111e] p-5 flex flex-col justify-between space-y-5 flex-shrink-0">
            <div className="space-y-4">
              {/* Left Sub-tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-black">
                <button
                  onClick={() => setLeftTab("guests")}
                  className={`pb-2 border-b-2 transition ${
                    leftTab === "guests"
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  GUESTS
                </button>
                <button
                  onClick={() => setLeftTab("alerts")}
                  className={`pb-2 border-b-2 transition ${
                    leftTab === "alerts"
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  ALERTS
                </button>
                <button
                  onClick={() => setLeftTab("history")}
                  className={`pb-2 border-b-2 transition ${
                    leftTab === "history"
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  HISTORY
                </button>
              </div>

              {/* SEATED 22 Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400">SEATED 22</span>
                <button className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">
                  <Plus size={14} />
                </button>
              </div>

              {/* Guests Feed List matching Mockup 1 */}
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {[
                  { initials: "KJ", name: "Karimov Jasur", time: "12:00 PM", zone: "Main Hall", table: "Table 5", guests: 4, isVip: false },
                  { initials: "AM", name: "Aliyeva Malika", time: "1:30 PM", zone: "VIP", table: "Table 12", guests: 2, isVip: true },
                  { initials: "RB", name: "Raximov Bobur", time: "3:00 PM", zone: "Terrace", table: "Table 8", guests: 6, isVip: false },
                  { initials: "TS", name: "Toshmatov Sarvar", time: "5:00 PM", zone: "Main Hall", table: "Table 3", guests: 3, isVip: false },
                  { initials: "YD", name: "Yusupova Dilnoza", time: "7:00 PM", zone: "VIP", table: "Table 20", guests: 8, isVip: true },
                  { initials: "NE", name: "Nazarov Eldor", time: "8:30 PM", zone: "Terrace", table: "Table 15", guests: 2, isVip: false },
                ].map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-900/90 border border-slate-800/80 p-3 hover:bg-slate-800/60 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-900/60 text-purple-300 font-black text-xs border border-purple-500/30">
                        {g.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-white">{g.name}</p>
                          {g.isVip && (
                            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-400 border border-amber-500/30">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {g.time} • {g.zone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-300">{g.guests} 👤</p>
                      <p className="text-[10px] text-orange-400 font-bold">{g.table}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 102 COVERS Timeline Bar Chart */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">102 COVERS</span>
              <div className="flex items-end gap-1.5 h-16 pt-2">
                {[
                  { time: "11 AM", count: 12 },
                  { time: "12 PM", count: 24, active: true },
                  { time: "1 PM", count: 18 },
                  { time: "2 PM", count: 20 },
                  { time: "3 PM", count: 16 },
                  { time: "4 PM+", count: 12 },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        item.active ? "bg-orange-500 shadow-md shadow-orange-500/30" : "bg-slate-800"
                      }`}
                      style={{ height: `${item.count * 1.8}px` }}
                    />
                    <span className="text-[9px] font-bold text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Main Floor Plan Map Grid Area */}
          <div className="flex-1 flex flex-col justify-between rounded-[2.5rem] border border-slate-800 bg-[#09111e] p-6 space-y-6 overflow-x-auto">
            {/* Map Zones Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Zone 1: MAIN HALL */}
              <div className="rounded-3xl border border-slate-800 bg-[#050b12] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">MAIN HALL</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {tables
                    .filter((t) => t.zone === "MAIN HALL")
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTable(t)}
                        className={`relative flex flex-col items-center justify-center h-20 rounded-2xl border-2 transition cursor-pointer ${
                          t.status === "available"
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : t.status === "seated"
                            ? "bg-blue-950/40 border-blue-500 text-blue-300"
                            : t.status === "arriving"
                            ? "bg-amber-950/40 border-amber-500 text-amber-300"
                            : t.status === "occupied"
                            ? "bg-red-950/40 border-red-500 text-red-300 shadow-lg shadow-red-500/20"
                            : "bg-slate-900 border-slate-700 text-slate-500"
                        }`}
                      >
                        <span className="text-lg font-black">{t.table_number}</span>
                        {t.status === "blocked" && (
                          <span className="absolute top-1 right-1 text-slate-500 text-xs">✕</span>
                        )}

                        {/* Popover Hover Tooltip matching Mockup 1 for Table 5 */}
                        {t.table_number === 5 && (
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 w-36 rounded-2xl bg-orange-500 p-2.5 text-white shadow-xl shadow-orange-500/40 text-[10px] space-y-0.5">
                            <p className="font-black text-xs">Karimov Jasur</p>
                            <p className="font-bold opacity-90">👤 4 guests</p>
                            <p className="opacity-90">🕒 12:00 PM</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Zone 2: TERRACE */}
              <div className="rounded-3xl border border-slate-800 bg-[#050b12] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">TERRACE</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {tables
                    .filter((t) => t.zone === "TERRACE")
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTable(t)}
                        className={`relative flex flex-col items-center justify-center h-20 rounded-2xl border-2 transition cursor-pointer ${
                          t.status === "available"
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : t.status === "seated"
                            ? "bg-blue-950/40 border-blue-500 text-blue-300"
                            : t.status === "arriving"
                            ? "bg-amber-950/40 border-amber-500 text-amber-300"
                            : t.status === "occupied"
                            ? "bg-red-950/40 border-red-500 text-red-300"
                            : "bg-slate-900 border-slate-700 text-slate-500"
                        }`}
                      >
                        <span className="text-lg font-black">{t.table_number}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Zone 3: VIP ROOM */}
              <div className="rounded-3xl border border-slate-800 bg-[#050b12] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">VIP ROOM</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {tables
                    .filter((t) => t.zone === "VIP ROOM")
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTable(t)}
                        className={`relative flex flex-col items-center justify-center h-24 rounded-3xl border-2 transition cursor-pointer ${
                          t.status === "available"
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : t.status === "seated"
                            ? "bg-blue-950/40 border-blue-500 text-blue-300"
                            : t.status === "arriving"
                            ? "bg-amber-950/40 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20"
                            : "bg-red-950/40 border-red-500 text-red-300"
                        }`}
                      >
                        <span className="text-2xl font-black">{t.table_number}</span>
                        <span className="text-[10px] font-bold opacity-80">{t.seats} seats</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Bottom Legend & Actions Bar matching Mockup 1 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Seated
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Arriving Soon
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Occupied
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Blocked
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => handleChangeTableStatus("available")}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Waitlist
                </button>
                <button
                  onClick={() => handleChangeTableStatus("arriving")}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Booked
                </button>
                <button
                  onClick={() => handleChangeTableStatus("seated")}
                  className="rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
                >
                  Seated
                </button>
                <button
                  onClick={() => handleChangeTableStatus("occupied")}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Done
                </button>
                <button
                  onClick={() => handleChangeTableStatus("blocked")}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Xcl/No
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}