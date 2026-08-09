"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Edit2,
  Gift,
  Loader2,
  LogOut,
  Percent,
  Plus,
  Tag,
  Ticket,
  Trash2,
  Utensils,
  Table,
  BarChart3,
  ChefHat,
  Boxes,
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

type PromoCard = {
  id: string;
  badge_text: string;
  badge_color: "orange" | "purple" | "teal" | "pink" | "gold" | "grey";
  title: string;
  description: string;
  validity: string;
  code: string;
  used: number;
  max: number;
  status: "active" | "scheduled" | "expired";
  is_active: boolean;
};

export default function PromotionsPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "expired">("active");

  const [promos, setPromos] = useState<PromoCard[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const unsub = onSnapshot(collection(db, "promotions"), (snap) => {
          const list: PromoCard[] = snap.docs.map((d) => ({
            id: d.id,
            badge_text: d.data().badge_text || "20% OFF",
            badge_color: d.data().badge_color || "orange",
            title: d.data().title || "Weekend Brunch Deal",
            description: d.data().description || "20% off all brunch items",
            validity: d.data().validity || "Aug 1 - Aug 31",
            code: d.data().code || "BRUNCH20",
            used: d.data().used || 142,
            max: d.data().max || 200,
            status: d.data().status || "active",
            is_active: d.data().is_active !== false,
          }));

          if (list.length > 0) {
            setPromos(list);
          } else {
            // Mock dataset matching Promotions Mockup
            setPromos([
              { id: "p1", badge_text: "20% OFF", badge_color: "orange", title: "Weekend Brunch Deal", description: "20% off all brunch items, Sat-Sun 9AM-1PM", validity: "Aug 1 - Aug 31", code: "BRUNCH20", used: 142, max: 200, status: "active", is_active: true },
              { id: "p2", badge_text: "FREE DESSERT", badge_color: "purple", title: "Birthday Special", description: "Get a free dessert on your birthday with any main course.", validity: "Ongoing", code: "BIRTHDAY", used: 38, max: 100, status: "active", is_active: true },
              { id: "p3", badge_text: "15% OFF", badge_color: "teal", title: "Happy Hour", description: "15% off on all drinks and appetizers Daily 5PM - 7PM", validity: "Daily 5-7PM", code: "HAPPY15", used: 210, max: 300, status: "active", is_active: true },
              { id: "p4", badge_text: "10% OFF", badge_color: "pink", title: "First Visit Bonus", description: "10% off for first-time customers. Welcome to Afsona!", validity: "Ongoing", code: "WELCOME10", used: 89, max: 150, status: "active", is_active: true },
              { id: "p5", badge_text: "25% OFF", badge_color: "gold", title: "Ramadan Iftar Menu", description: "25% off on special Iftar menu during Ramadan", validity: "Starts Sep 1", code: "IFTAR25", used: 0, max: 500, status: "scheduled", is_active: true },
              { id: "p6", badge_text: "$10 OFF", badge_color: "grey", title: "Summer Kickoff", description: "$10 off on orders over $50 to kick off the summer!", validity: "Jun 1 - Jun 30", code: "SUMMER10", used: 300, max: 300, status: "expired", is_active: false },
            ]);
          }
          setIsLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("Promotions load error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleTogglePromo(id: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, "promotions", id), { is_active: !currentStatus });
    } catch (err) {
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
    }
  }

  async function handleDeletePromo(id: string) {
    try {
      await deleteDoc(doc(db, "promotions", id));
    } catch (err) {
      setPromos((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const filteredPromos = promos.filter((p) =>
    activeTab === "all" ? true : p.status === activeTab
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Promotions...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Promotions Mockup */}
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
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

      {/* Main Workspace Area matching Promotions Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Promotions</h1>
            <p className="text-xs font-medium text-slate-500">6 active campaigns • 1,240 redemptions this month</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 transition">
              <Plus size={16} /> + New Promotion
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
          {/* Summary KPI Cards Row matching Promotions Mockup */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Active Promos (Orange Card) */}
            <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-100">Active Promos</p>
                <p className="text-3xl font-black mt-2">6</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/40 text-white">
                <Tag size={24} />
              </div>
            </div>

            {/* Card 2: Redemptions */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Redemptions</p>
                <p className="text-3xl font-black text-slate-900 mt-2">1,240</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Ticket size={24} />
              </div>
            </div>

            {/* Card 3: Revenue Generated */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue Generated</p>
                <p className="text-3xl font-black text-slate-900 mt-2">$6,850</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <DollarSign size={24} />
              </div>
            </div>

            {/* Card 4: Avg. Discount */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg. Discount</p>
                <p className="text-3xl font-black text-slate-900 mt-2">18%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <Percent size={24} />
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: `All (${promos.length})` },
              { id: "active", label: `Active (${promos.filter((p) => p.status === "active").length})` },
              { id: "scheduled", label: `Scheduled (${promos.filter((p) => p.status === "scheduled").length})` },
              { id: "expired", label: `Expired (${promos.filter((p) => p.status === "expired").length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-2xl px-5 py-2.5 text-xs font-black transition ${
                  activeTab === tab.id
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid Layout: Coupon Cards Grid + Right Top Performing Promo */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: 6 Coupon Cards Grid */}
            <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {filteredPromos.map((p) => (
                <div
                  key={p.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition"
                >
                  {/* Card Header Badge */}
                  <div
                    className={`rounded-2xl p-4 text-white font-black flex items-center justify-between shadow-sm ${
                      p.badge_color === "orange"
                        ? "bg-orange-500"
                        : p.badge_color === "purple"
                        ? "bg-purple-600"
                        : p.badge_color === "teal"
                        ? "bg-teal-600"
                        : p.badge_color === "pink"
                        ? "bg-pink-600"
                        : p.badge_color === "gold"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  >
                    <span className="text-xl">{p.badge_text}</span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] uppercase tracking-wider backdrop-blur-sm">
                      {p.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                  </div>

                  {/* Date & Promo Code Badge */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                    <span>{p.validity}</span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
                      {p.code}
                    </span>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>{p.used} / {p.max} used</span>
                      <span>{Math.round((p.used / p.max) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${(p.used / p.max) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleTogglePromo(p.id, p.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        p.is_active ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          p.is_active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>

                    <div className="flex items-center gap-1">
                      <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePromo(p.id)}
                        className="rounded-xl p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right 1 Col: Top Performing Promo Leaderboard */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Top Performing Promo</h3>
                <p className="text-xs text-slate-400">Redemptions this month</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Happy Hour", count: 210, width: "100%" },
                  { name: "Weekend Brunch Deal", count: 142, width: "68%" },
                  { name: "First Visit Bonus", count: 89, width: "42%" },
                  { name: "Birthday Special", count: 38, width: "18%" },
                  { name: "Ramadan Iftar Menu", count: 0, width: "0%" },
                  { name: "Summer Kickoff", count: 0, width: "0%" },
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900">{item.name}</span>
                      <span className="font-mono text-slate-700">{item.count}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                View all reports <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
