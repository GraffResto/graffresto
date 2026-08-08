"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChartLine,
  CheckCircle,
  ClipboardList,
  Clock,
  Loader2,
  LogOut,
  Map,
  Settings,
  TrendingUp,
  Users,
  Utensils,
  XCircle,
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
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  guests_count: number;
  status: string;
  created_at: string;
  table_id: string | null;
  occasion: string | null;
};

const t = {
  en: {
    title: "Analytics",
    subtitle: "Booking trends, peak hours, occupancy and revenue insights.",
    dashboard: "Dashboard", bookings: "Bookings", floorMap: "Floor Map",
    menu: "Menu", analytics: "Analytics", settings: "Settings", logout: "Logout",
    loading: "Loading analytics...",
    totalBookings: "Total Bookings", confirmed: "Confirmed", pending: "Pending",
    cancelled: "Cancelled", guests: "Total Guests", avgGuests: "Avg Guests/Booking",
    completionRate: "Completion Rate", peakHour: "Peak Hour",
    topTables: "Most Booked Tables", recentBookings: "Recent Bookings",
    byStatus: "Bookings by Status", byDay: "Last 7 Days",
    noData: "No bookings yet for this period.",
    today: "Today", thisWeek: "This Week", thisMonth: "This Month", allTime: "All Time",
    ownerLabel: "Restaurant Owner",
    statusConfirmed: "Confirmed", statusPending: "Pending",
    statusCancelled: "Cancelled", statusCompleted: "Completed",
  },
  uz: {
    title: "Tahlil",
    subtitle: "Bron tendentsiyalari, eng faol soatlar, bandlik va daromad.",
    dashboard: "Dashboard", bookings: "Bronlar", floorMap: "Floor Map",
    menu: "Menyu", analytics: "Tahlil", settings: "Sozlamalar", logout: "Chiqish",
    loading: "Tahlil yuklanmoqda...",
    totalBookings: "Jami bronlar", confirmed: "Tasdiqlangan", pending: "Kutilmoqda",
    cancelled: "Bekor", guests: "Jami mehmonlar", avgGuests: "O'rt. mehmon/bron",
    completionRate: "Yakunlash %", peakHour: "Eng faol soat",
    topTables: "Ko'p bronlangan stollar", recentBookings: "So'nggi bronlar",
    byStatus: "Status bo'yicha", byDay: "So'nggi 7 kun",
    noData: "Bu davrda bronlar yo'q.",
    today: "Bugun", thisWeek: "Bu hafta", thisMonth: "Bu oy", allTime: "Hammasi",
    ownerLabel: "Restoran egasi",
    statusConfirmed: "Tasdiqlangan", statusPending: "Kutilmoqda",
    statusCancelled: "Bekor", statusCompleted: "Yakunlangan",
  },
  ru: {
    title: "Аналитика",
    subtitle: "Тренды бронирований, пиковые часы, загрузка и выручка.",
    dashboard: "Дэшборд", bookings: "Брони", floorMap: "План зала",
    menu: "Меню", analytics: "Аналитика", settings: "Настройки", logout: "Выйти",
    loading: "Загрузка аналитики...",
    totalBookings: "Всего броней", confirmed: "Подтверждено", pending: "В ожидании",
    cancelled: "Отменено", guests: "Всего гостей", avgGuests: "Ср. гостей/бронь",
    completionRate: "% завершения", peakHour: "Пиковый час",
    topTables: "Топ столов", recentBookings: "Последние брони",
    byStatus: "По статусам", byDay: "Последние 7 дней",
    noData: "Бронирований за этот период нет.",
    today: "Сегодня", thisWeek: "Эта неделя", thisMonth: "Этот месяц", allTime: "Всё время",
    ownerLabel: "Владелец ресторана",
    statusConfirmed: "Подтверждено", statusPending: "В ожидании",
    statusCancelled: "Отменено", statusCompleted: "Завершено",
  },
};

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-bold text-gray-500">{item.value > 0 ? item.value : ""}</span>
          <div
            className="w-full rounded-t-lg bg-orange-400 transition-all duration-500"
            style={{ height: `${(item.value / max) * 110}px`, minHeight: item.value > 0 ? "6px" : "2px", opacity: item.value === 0 ? 0.2 : 1 }}
          />
          <span className="text-xs text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <p className="text-sm text-gray-400">No data</p>;
  let cumulative = 0;
  const r = 48, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {segments.filter((s) => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const offset = circ * (1 - cumulative);
          const dash = circ * pct;
          cumulative += pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="18"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }} />
          );
        })}
        <text x={cx} y={cy + 6} textAnchor="middle" style={{ fontSize: 18, fontWeight: 900, fill: "#111" }}>{total}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600">{seg.label} <strong>{seg.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, accent = false }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-6 ${accent ? "bg-orange-500 text-white" : "border border-gray-200 bg-white shadow-sm"}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2 ${accent ? "bg-white/20" : "bg-orange-50"}`}>
          <Icon size={20} className={accent ? "text-white" : "text-orange-500"} />
        </div>
        <ArrowUpRight size={15} className={accent ? "text-white/40" : "text-gray-200"} />
      </div>
      <p className={`mt-4 text-3xl font-black ${accent ? "text-white" : "text-gray-950"}`}>{value}</p>
      <p className={`mt-1 text-sm font-bold ${accent ? "text-white/80" : "text-gray-600"}`}>{title}</p>
      {subtitle && <p className={`mt-0.5 text-xs ${accent ? "text-white/60" : "text-gray-400"}`}>{subtitle}</p>}
    </div>
  );
}

export default function PartnerAnalyticsPage() {
  const { language } = useLanguage();
  const text = t[language];
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        setRestaurantName(rDoc.data().name || "Restaurant");

        const bQuery = query(collection(db, "bookings"), where("restaurant_id", "==", rDoc.id));
        const bSnap = await getDocs(bQuery);

        const list: Booking[] = bSnap.docs.map((d) => ({
          id: d.id,
          booking_date: d.data().booking_date || "",
          booking_time: d.data().booking_time || "",
          guests_count: d.data().guests_count || 1,
          status: d.data().status || "pending",
          created_at: d.data().created_at || "",
          table_id: d.data().table_id || null,
          occasion: d.data().occasion || null,
        }));

        setBookings(list);
      } catch (error) {
        console.error("Analytics error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const d = new Date(b.booking_date);
    if (period === "today") return d.toDateString() === now.toDateString();
    if (period === "week") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
    if (period === "month") { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
    return true;
  });

  const total = filtered.length;
  const confirmed = filtered.filter((b) => b.status === "approved" || b.status === "confirmed").length;
  const pending = filtered.filter((b) => b.status === "pending").length;
  const cancelled = filtered.filter((b) => b.status === "cancelled").length;
  const completed = filtered.filter((b) => b.status === "completed").length;
  const totalGuests = filtered.reduce((s, b) => s + (b.guests_count || 0), 0);
  const avgGuests = total > 0 ? (totalGuests / total).toFixed(1) : "0";
  const completionRate = total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const weekData = weekDays.map((d) => ({
    label: d.toLocaleDateString("en-US", { weekday: "short" }),
    value: bookings.filter((b) => new Date(b.booking_date).toDateString() === d.toDateString()).length,
  }));

  const tableCounts: Record<string, number> = {};
  filtered.forEach((b) => { if (b.table_id) tableCounts[b.table_id] = (tableCounts[b.table_id] || 0) + 1; });
  const topTables = Object.entries(tableCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const hourCounts: Record<number, number> = {};
  filtered.forEach((b) => {
    const h = parseInt(b.booking_time?.split(":")[0] ?? "12");
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  const navItems = [
    { label: text.dashboard, icon: ChartLine, href: "/partner" },
    { label: text.bookings, icon: CalendarDays, href: "/partner/bookings" },
    { label: text.floorMap, icon: Map, href: "/partner/floor-plan" },
    { label: text.menu, icon: ClipboardList, href: "/partner/menu" },
    { label: text.analytics, icon: ChartLine, href: "/partner/analytics", active: true },
    { label: text.settings, icon: Settings, href: "/partner/settings" },
  ];

  return (
    <main className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 flex-col bg-[#07111f] p-6 text-white lg:flex">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500"><Utensils size={18} /></div>
          <span className="text-lg font-black">DineFlow</span>
        </Link>
        <nav className="flex-1 space-y-1 text-sm font-semibold">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                (item as { active?: boolean }).active ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}>
              <item.icon size={18} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm font-black text-white">{restaurantName || "..."}</p>
            <p className="mt-0.5 text-xs text-gray-400">{text.ownerLabel}</p>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white">
            <LogOut size={16} />{text.logout}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950">{text.title}</h1>
            <p className="text-sm text-gray-500">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-600">
              {restaurantName.charAt(0) || "P"}
            </div>
          </div>
        </header>

        <section className="flex-1 p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="animate-spin text-orange-500" />{text.loading}
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-2">
                {(["today", "week", "month", "all"] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`rounded-2xl px-5 py-2.5 text-sm font-black transition ${
                      period === p ? "bg-orange-500 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-orange-50"
                    }`}>
                    {p === "today" ? text.today : p === "week" ? text.thisWeek : p === "month" ? text.thisMonth : text.allTime}
                  </button>
                ))}
              </div>

              {total === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <TrendingUp className="mx-auto text-orange-300" size={48} />
                  <p className="mt-4 text-gray-500">{text.noData}</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title={text.totalBookings} value={total} icon={CalendarDays} accent />
                    <StatCard title={text.confirmed} value={confirmed} subtitle={`${completionRate}% ${text.completionRate}`} icon={CheckCircle} />
                    <StatCard title={text.guests} value={totalGuests} subtitle={`${text.avgGuests}: ${avgGuests}`} icon={Users} />
                    <StatCard title={text.cancelled} value={cancelled} icon={XCircle} />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-5 text-lg font-black text-gray-950">{text.byDay}</h2>
                      <BarChart data={weekData} />
                    </div>
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-5 text-lg font-black text-gray-950">{text.byStatus}</h2>
                      <DonutChart segments={[
                        { label: text.statusConfirmed, value: confirmed, color: "#22c55e" },
                        { label: text.statusPending, value: pending, color: "#f97316" },
                        { label: text.statusCancelled, value: cancelled, color: "#ef4444" },
                        { label: text.statusCompleted, value: completed, color: "#3b82f6" },
                      ]} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-5 text-lg font-black text-gray-950">{text.topTables}</h2>
                      {topTables.length === 0 ? (
                        <p className="text-sm text-gray-400">{text.noData}</p>
                      ) : (
                        <div className="space-y-3">
                          {topTables.map(([id, count], i) => (
                            <div key={id} className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-600">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-sm font-bold mb-1">
                                  <span className="text-gray-700">{id.slice(0, 8)}...</span>
                                  <span className="text-gray-500">{count} bookings</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-orange-50">
                                  <div className="h-2 rounded-full bg-orange-400" style={{ width: `${(count / (topTables[0]?.[1] || 1)) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-5 text-lg font-black text-gray-950">Key Insights</h2>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-4">
                          <div>
                            <p className="text-sm font-bold text-orange-700">{text.peakHour}</p>
                            <p className="mt-1 text-2xl font-black text-gray-950">
                              {peakHour ? `${String(peakHour[0]).padStart(2, "0")}:00` : "—"}
                            </p>
                          </div>
                          <Clock className="text-orange-400" size={28} />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4">
                          <div>
                            <p className="text-sm font-bold text-green-700">{text.completionRate}</p>
                            <p className="mt-1 text-2xl font-black text-gray-950">{completionRate}%</p>
                          </div>
                          <CheckCircle className="text-green-400" size={28} />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">
                          <div>
                            <p className="text-sm font-bold text-blue-700">{text.avgGuests}</p>
                            <p className="mt-1 text-2xl font-black text-gray-950">{avgGuests}</p>
                          </div>
                          <Users className="text-blue-400" size={28} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-black text-gray-950">{text.recentBookings}</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-gray-400">
                            <th className="pb-3 pr-4 font-bold">Date</th>
                            <th className="pb-3 pr-4 font-bold">Time</th>
                            <th className="pb-3 pr-4 font-bold">Guests</th>
                            <th className="pb-3 pr-4 font-bold">Occasion</th>
                            <th className="pb-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice(0, 10).map((b) => (
                            <tr key={b.id} className="border-b border-gray-50 last:border-0">
                              <td className="py-3 pr-4 font-medium text-gray-800">{b.booking_date}</td>
                              <td className="py-3 pr-4 text-gray-600">{b.booking_time}</td>
                              <td className="py-3 pr-4 text-gray-600">{b.guests_count}</td>
                              <td className="py-3 pr-4 text-gray-500 text-xs">{b.occasion && b.occasion !== "none" ? b.occasion : "—"}</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2 py-1 text-xs font-black ${
                                  b.status === "approved" || b.status === "confirmed" ? "bg-green-100 text-green-700" :
                                  b.status === "cancelled" ? "bg-red-100 text-red-700" :
                                  b.status === "completed" ? "bg-blue-100 text-blue-700" :
                                  "bg-orange-100 text-orange-700"
                                }`}>{b.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
