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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import PartnerSidebar from "@/components/PartnerSidebar";
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
  const [restaurantName, setRestaurantName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  // Empty until the client renders, otherwise server and client markup differ
  const [currentTime, setCurrentTime] = useState("");

  // Held in a ref because the async auth callback cannot return a cleanup
  const ordersListenerRef = useRef<(() => void) | null>(null);

  const [orders, setOrders] = useState<KitchenOrder[]>([]);

  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );

    tick();
    const timerInterval = setInterval(tick, 10000);

    const detachOrders = () => {
      ordersListenerRef.current?.();
      ordersListenerRef.current = null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      detachOrders();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rSnap = await getDocs(
          query(collection(db, "restaurants"), where("owner_id", "==", user.uid))
        );

        if (rSnap.empty) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        setRestaurantName(rDoc.data().name || "Your restaurant");

        // Kitchen tickets for this restaurant only
        ordersListenerRef.current = onSnapshot(
          query(collection(db, "kitchen_orders"), where("restaurant_id", "==", rDoc.id)),
          (snap) => {
            const list: KitchenOrder[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                order_number: data.order_number || `#${d.id.slice(0, 4)}`,
                table_name: data.table_name || "",
                timer: data.timer || "",
                items: data.items || [],
                status: data.status || "new",
                is_urgent: data.is_urgent || false,
              };
            });

            setOrders(list);
            setIsLoading(false);
          },
          (err) => {
            console.error("KDS listener error:", err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("KDS load error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      clearInterval(timerInterval);
      unsubscribe();
      detachOrders();
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

  // Tickets still moving through the kitchen right now
  const activeOrderCount = orders.filter(
    (o) => o.status === "new" || o.status === "preparing"
  ).length;

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
      <PartnerSidebar active="kitchen" />

      {/* Main Workspace Area matching KDS Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top KDS Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#07111f]/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-white">Kitchen Display</h1>
            <p className="text-xs font-medium text-slate-400">
              {activeOrderCount} active order{activeOrderCount === 1 ? "" : "s"}
            </p>
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
