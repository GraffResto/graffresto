"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  ChefHat,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Volume2,
  VolumeX,
  Utensils,
  Table,
  BarChart3,
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
  onSnapshot,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

type KitchenOrder = {
  id: string;
  order_number: string;
  table_name: string;
  timer: string;
  items: { name: string; quantity: number; note?: string }[];
  status: "new" | "preparing" | "ready" | "served";
  is_urgent?: boolean;
};

export default function KitchenDisplaySystemPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState("12:34 PM");

  const [orders, setOrders] = useState<KitchenOrder[]>([]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const unsub = onSnapshot(collection(db, "kitchen_orders"), (snap) => {
          const list: KitchenOrder[] = snap.docs.map((d) => ({
            id: d.id,
            order_number: d.data().order_number || "#0142",
            table_name: d.data().table_name || "Table 5",
            timer: d.data().timer || "2:14",
            items: d.data().items || [
              { name: "Pasta Bologna", quantity: 2, note: "no onions" },
              { name: "Grilled Steak", quantity: 1 },
            ],
            status: d.data().status || "new",
            is_urgent: d.data().is_urgent || false,
          }));

          if (list.length > 0) {
            setOrders(list);
          } else {
            // Mock dataset matching KDS Mockup
            setOrders([
              // NEW ORDERS (4)
              { id: "k1", order_number: "#0142", table_name: "Table 5", timer: "2:14", status: "new", items: [{ name: "Pasta Bologna", quantity: 2, note: "no onions" }, { name: "Grilled Steak", quantity: 1 }] },
              { id: "k2", order_number: "#0143", table_name: "Table 12", timer: "4:50", status: "new", items: [{ name: "Fish and Chips", quantity: 1 }, { name: "Spicy Fried Chicken", quantity: 3 }] },
              { id: "k3", order_number: "#0144", table_name: "Table 3", timer: "6:02", status: "new", items: [{ name: "Kimchi Jjigae", quantity: 2 }] },
              { id: "k4", order_number: "#0145", table_name: "Table 20", timer: "8:30", status: "new", items: [{ name: "Beef Bourguignon", quantity: 4, note: "extra spicy" }] },

              // PREPARING (5)
              { id: "k5", order_number: "#0139", table_name: "Table 8", timer: "11:20", status: "preparing", items: [{ name: "Spaghetti Carbonara", quantity: 1 }, { name: "Soup", quantity: 2 }] },
              { id: "k6", order_number: "#0140", table_name: "Table 2", timer: "9:45", status: "preparing", items: [{ name: "Ratatouille", quantity: 3 }] },
              { id: "k7", order_number: "#0141", table_name: "Table 15", timer: "16:10", status: "preparing", is_urgent: true, items: [{ name: "Tofu Scramble", quantity: 2 }, { name: "Grilled Steak", quantity: 1, note: "medium rare" }] },
              { id: "k8", order_number: "#0146", table_name: "Table 9", timer: "7:30", status: "preparing", items: [{ name: "Salmon Teriyaki", quantity: 1 }] },
              { id: "k9", order_number: "#0147", table_name: "Table 14", timer: "5:10", status: "preparing", items: [{ name: "Pasta Bologna", quantity: 2, note: "extra cheese" }] },

              // READY TO SERVE (3)
              { id: "k10", order_number: "#0137", table_name: "Table 1", timer: "1:05", status: "ready", items: [{ name: "Pasta Bologna", quantity: 2 }] },
              { id: "k11", order_number: "#0138", table_name: "Table 6", timer: "2:20", status: "ready", items: [{ name: "Fish and Chips", quantity: 1 }] },
              { id: "k12", order_number: "#0148", table_name: "Table 11", timer: "3:15", status: "ready", items: [{ name: "Grilled Steak", quantity: 1, note: "medium rare" }] },
            ]);
          }
          setIsLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("KDS load error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      clearInterval(timerInterval);
      unsubscribe();
    };
  }, [router]);

  async function handleUpdateOrderStatus(id: string, nextStatus: KitchenOrder["status"]) {
    try {
      await updateDoc(doc(db, "kitchen_orders", id), { status: nextStatus });
    } catch (err) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
      );
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050b12] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0b1523] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Kitchen Display System...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#050b12] text-white font-sans">
      {/* Sidebar matching KDS Mockup */}
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20"
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

      {/* Main Workspace Area matching KDS Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top KDS Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#07111f]/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-white">Kitchen Display</h1>
            <p className="text-xs font-medium text-slate-400">12 active orders</p>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-2xl font-black font-mono text-white tracking-widest">
              {currentTime}
            </span>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <Link
              href="/partner/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-500/20 hover:scale-105 transition"
            >
              A
            </Link>
          </div>
        </header>

        {/* 3 Order Columns Grid matching KDS Mockup */}
        <div className="p-8 grid gap-6 md:grid-cols-3">
          {/* Column 1: NEW ORDERS (4) */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-[#091424] p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                NEW ORDERS
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 font-black text-xs text-white">
                {orders.filter((o) => o.status === "new").length}
              </span>
            </div>

            <div className="space-y-4">
              {orders
                .filter((o) => o.status === "new")
                .map((o) => (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-orange-500/30 bg-[#0c1a2d] p-5 space-y-4 shadow-lg shadow-orange-500/5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xl font-black text-white">{o.order_number}</span>
                        <span className="ml-3 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                          {o.table_name}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400">{o.timer}</span>
                    </div>

                    <div className="space-y-2">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between text-sm font-bold text-slate-200">
                          <div>
                            <span className="text-orange-400 mr-2">{item.quantity}x</span>
                            <span>{item.name}</span>
                            {item.note && (
                              <p className="text-xs italic text-slate-400 font-normal pl-6">{item.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, "preparing")}
                      className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 py-3 text-xs font-black text-orange-400 hover:bg-orange-500/20 transition"
                    >
                      Start Preparing
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: PREPARING (5) */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-[#091424] p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                PREPARING
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-black text-xs text-white">
                {orders.filter((o) => o.status === "preparing").length}
              </span>
            </div>

            <div className="space-y-4">
              {orders
                .filter((o) => o.status === "preparing")
                .map((o) => (
                  <div
                    key={o.id}
                    className={`rounded-2xl border p-5 space-y-4 shadow-lg transition ${
                      o.is_urgent
                        ? "border-red-500 bg-red-950/20 animate-pulse"
                        : "border-amber-500/30 bg-[#0c1a2d]"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xl font-black text-white">{o.order_number}</span>
                        <span className="ml-3 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                          {o.table_name}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-sm font-bold ${
                          o.is_urgent ? "text-red-400 font-black" : "text-amber-400"
                        }`}
                      >
                        {o.timer} {o.is_urgent && "•"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between text-sm font-bold text-slate-200">
                          <div>
                            <span className="text-amber-400 mr-2">{item.quantity}x</span>
                            <span>{item.name}</span>
                            {item.note && (
                              <p className="text-xs italic text-slate-400 font-normal pl-6">{item.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, "ready")}
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 text-xs font-black text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      Mark Ready
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: READY TO SERVE (3) */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-[#091424] p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                READY TO SERVE
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 font-black text-xs text-white">
                {orders.filter((o) => o.status === "ready").length}
              </span>
            </div>

            <div className="space-y-4">
              {orders
                .filter((o) => o.status === "ready")
                .map((o) => (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-emerald-500/30 bg-[#0c1a2d] p-5 space-y-4 shadow-lg shadow-emerald-500/5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xl font-black text-white">{o.order_number}</span>
                        <span className="ml-3 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                          {o.table_name}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400">{o.timer}</span>
                    </div>

                    <div className="space-y-2">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between text-sm font-bold text-slate-200">
                          <div>
                            <span className="text-emerald-400 mr-2">{item.quantity}x</span>
                            <span>{item.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, "served")}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-black text-slate-300 hover:bg-slate-700 transition"
                    >
                      ✓ Served
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
