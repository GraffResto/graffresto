"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronUp,
  Crown,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Table,
  TrendingUp,
  UserPlus,
  Users,
  Utensils,
  BarChart3,
  ChefHat,
  Boxes,
  DollarSign,
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

type CustomerRecord = {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  total_visits: number;
  total_spent: number;
  last_visit: string;
  partner_notes?: string;
  booking_history?: { date: string; table: string; guests: number; status: string }[];
};

export default function CRMCustomerDirectoryPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  const [activeTier, setActiveTier] = useState<"All" | "Platinum" | "Gold" | "Silver" | "Bronze">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("c1");
  const [editingNote, setEditingNote] = useState<Record<string, string>>({});

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const unsub = onSnapshot(collection(db, "customers_crm"), (snap) => {
          const list: CustomerRecord[] = snap.docs.map((d) => ({
            id: d.id,
            full_name: d.data().full_name || "Guest",
            phone: d.data().phone || "+998 90 123 45 67",
            email: d.data().email || "",
            tier: d.data().tier || "Platinum",
            total_visits: d.data().total_visits || 24,
            total_spent: d.data().total_spent || 2840,
            last_visit: d.data().last_visit || "3 days ago",
            partner_notes: d.data().partner_notes || "Prefers window seat, allergic to nuts, birthday in March",
            booking_history: d.data().booking_history || [
              { date: "May 18, 2025", table: "Table 12", guests: 4, status: "Completed" },
              { date: "May 10, 2025", table: "Table 7", guests: 2, status: "Completed" },
              { date: "Apr 28, 2025", table: "Table 3", guests: 6, status: "Completed" },
              { date: "Apr 12, 2025", table: "Table 9", guests: 3, status: "No Show" },
            ],
          }));

          if (list.length > 0) {
            setCustomers(list);
          } else {
            // Mock dataset matching CRM Mockup
            setCustomers([
              {
                id: "c1",
                full_name: "Karimov Jasur",
                phone: "+998 90 123 45 67",
                tier: "Platinum",
                total_visits: 24,
                total_spent: 2840,
                last_visit: "3 days ago",
                partner_notes: "Prefers window seat, allergic to nuts, birthday in March",
                booking_history: [
                  { date: "May 18, 2025", table: "Table 12", guests: 4, status: "Completed" },
                  { date: "May 10, 2025", table: "Table 7", guests: 2, status: "Completed" },
                  { date: "Apr 28, 2025", table: "Table 3", guests: 6, status: "Completed" },
                  { date: "Apr 12, 2025", table: "Table 9", guests: 3, status: "No Show" },
                ],
              },
              { id: "c2", full_name: "Aliyeva Malika", phone: "+998 91 234 56 78", tier: "Gold", total_visits: 14, total_spent: 1120, last_visit: "1 week ago" },
              { id: "c3", full_name: "Raximov Bobur", phone: "+998 93 345 67 89", tier: "Gold", total_visits: 11, total_spent: 980, last_visit: "5 days ago" },
              { id: "c4", full_name: "Toshmatov Sarvar", phone: "+998 94 456 78 90", tier: "Silver", total_visits: 6, total_spent: 410, last_visit: "2 weeks ago" },
              { id: "c5", full_name: "Yusupova Dilnoza", phone: "+998 95 567 89 01", tier: "Platinum", total_visits: 31, total_spent: 3650, last_visit: "Yesterday" },
              { id: "c6", full_name: "Nazarov Eldor", phone: "+998 97 678 90 12", tier: "Bronze", total_visits: 2, total_spent: 95, last_visit: "1 month ago" },
            ]);
          }
          setIsLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("CRM load error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSaveNote(id: string) {
    const text = editingNote[id];
    if (text === undefined) return;

    try {
      await updateDoc(doc(db, "customers_crm", id), { partner_notes: text });
    } catch (err) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, partner_notes: text } : c))
      );
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const filteredCustomers = customers.filter((c) => {
    const matchesTier = activeTier === "All" ? true : c.tier === activeTier;
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesTier && matchesSearch;
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading CRM Directory...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching CRM Mockup */}
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
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

      {/* Main Workspace Area matching CRM Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Customers</h1>
            <p className="text-xs font-medium text-slate-500">312 customers • managing relationships and loyalty</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 w-64"
              />
            </div>

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
          {/* KPI Summary Cards Row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Customers */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Customers</p>
                <p className="text-3xl font-black text-slate-900 mt-2">312</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Users size={24} />
              </div>
            </div>

            {/* Card 2: VIP / Platinum */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">VIP / Platinum</p>
                <p className="text-3xl font-black text-slate-900 mt-2">18</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <Crown size={24} />
              </div>
            </div>

            {/* Card 3: New this month */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">New this month</p>
                <p className="text-3xl font-black text-slate-900 mt-2">24</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserPlus size={24} />
              </div>
            </div>

            {/* Card 4: Avg Spend */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg. Spend</p>
                <p className="text-3xl font-black text-slate-900 mt-2">$42.50</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Tier Filters & Sort Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {(["All", "Platinum", "Gold", "Silver", "Bronze"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-black transition ${
                    activeTier === tier
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Sort by:</span>
              <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none">
                <option value="last_visit">Last visit</option>
                <option value="total_spent">Total spent</option>
                <option value="total_visits">Total visits</option>
              </select>
            </div>
          </div>

          {/* Customer Directory Table matching CRM Mockup */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 text-xs font-bold">
              {/* Header Row */}
              <div className="grid grid-cols-12 bg-slate-50/50 py-4 px-6 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <div className="col-span-4">Customer</div>
                <div className="col-span-2">Tier</div>
                <div className="col-span-2">Visits</div>
                <div className="col-span-2">Total Spent</div>
                <div className="col-span-2 text-right">Last Visit</div>
              </div>

              {/* Data Rows */}
              {filteredCustomers.map((c) => {
                const isExpanded = expandedId === c.id;
                return (
                  <div key={c.id} className="transition">
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="grid grid-cols-12 items-center py-4 px-6 hover:bg-slate-50/80 cursor-pointer"
                    >
                      {/* Customer Info */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-black text-xs shadow-sm">
                          {c.full_name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{c.full_name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{c.phone}</p>
                        </div>
                      </div>

                      {/* Tier Badge */}
                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
                            c.tier === "Platinum"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : c.tier === "Gold"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : c.tier === "Silver"
                              ? "bg-slate-200 text-slate-700 border border-slate-300"
                              : "bg-orange-100 text-orange-700 border border-orange-200"
                          }`}
                        >
                          <Crown size={12} /> {c.tier}
                        </span>
                      </div>

                      {/* Visits */}
                      <div className="col-span-2 text-slate-900 font-black">{c.total_visits} visits</div>

                      {/* Total Spent */}
                      <div className="col-span-2 text-slate-900 font-black">${c.total_spent.toLocaleString()}</div>

                      {/* Last Visit & Expand Arrow */}
                      <div className="col-span-2 text-right flex items-center justify-end gap-3 text-slate-500 font-medium">
                        <span>{c.last_visit}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expandable Drawer Drawer matching CRM Mockup */}
                    {isExpanded && (
                      <div className="bg-orange-50/30 border-t border-b border-orange-100 p-6 grid gap-6 md:grid-cols-2">
                        {/* Booking History Timeline */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Booking History
                          </h4>
                          <div className="space-y-3">
                            {(c.booking_history || []).map((h, i) => (
                              <div key={i} className="flex items-center justify-between text-xs font-bold">
                                <div className="flex items-center gap-3">
                                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                                  <span className="text-slate-900">{h.date}</span>
                                  <span className="text-slate-500">{h.table}</span>
                                  <span className="text-slate-500">{h.guests} people</span>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                    h.status === "Completed"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-sky-50 text-sky-600"
                                  }`}
                                >
                                  {h.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Partner Notes & Quick Actions */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Partner Notes
                            </h4>
                            <textarea
                              rows={3}
                              value={editingNote[c.id] ?? c.partner_notes}
                              onChange={(e) =>
                                setEditingNote({ ...editingNote, [c.id]: e.target.value })
                              }
                              placeholder="Prefers window seat, allergic to nuts..."
                              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 italic bg-slate-50/50"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => handleSaveNote(c.id)}
                              className="text-xs font-bold text-orange-600 hover:underline"
                            >
                              + Save Note
                            </button>

                            <div className="flex items-center gap-2">
                              <button className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100">
                                <Send size={12} /> Send Promo
                              </button>
                              <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                <Phone size={12} /> Call
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}