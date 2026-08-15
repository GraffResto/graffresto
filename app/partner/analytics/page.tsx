"use client";

import {
  Calendar,
  DollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  UserX,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartnerSidebar from "@/components/PartnerSidebar";
import PartnerHeader from "@/components/PartnerHeader";
import { usePartnerRestaurant } from "@/components/usePartnerRestaurant";
import {
  auth,
  db,
  collection,
  query,
  where,
  onSnapshot,
  onAuthStateChanged,
} from "@/lib/firebase";

type AnalyticsBooking = {
  booking_date: string;
  booking_time: string;
  guests_count: number;
  status: string;
  total_amount: number;
  preorder_items: { name: string; quantity: number; price: number }[];
};

type TimeRange = "Today" | "Week" | "Month" | "Year";

const RANGE_DAYS: Record<TimeRange, number> = {
  Today: 1,
  Week: 7,
  Month: 30,
  Year: 365,
};

function startOfRange(range: TimeRange): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
  return start;
}

function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString()} UZS`;
}

function formatDayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AnalyticsSuitePage() {
  const router = useRouter();
  const { restaurantId, isLoading: restaurantLoading } = usePartnerRestaurant();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("Month");
  const [bookings, setBookings] = useState<AnalyticsBooking[]>([]);

  // Derived rather than stored, so the effect never sets state synchronously
  const isLoading = restaurantLoading || (restaurantId !== null && !dataLoaded);

  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const detach = () => {
      listenerRef.current?.();
      listenerRef.current = null;
    };

    detach();

    if (restaurantLoading || !restaurantId) return;

    listenerRef.current = onSnapshot(
      query(collection(db, "bookings"), where("restaurant_id", "==", restaurantId)),
      (snap) => {
        setBookings(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              booking_date: data.booking_date || "",
              booking_time: data.booking_time || "",
              guests_count: Number(data.guests_count) || 0,
              status: data.status || "pending",
              total_amount: Number(data.total_amount) || 0,
              preorder_items: Array.isArray(data.preorder_items) ? data.preorder_items : [],
            };
          })
        );
        setDataLoaded(true);
      },
      (err) => {
        console.error("Analytics listener error:", err);
        setDataLoaded(true);
      }
    );

    return detach;
  }, [restaurantId, restaurantLoading]);

  // Everything below is derived from the restaurant's own bookings. When there
  // is no data yet the screen says so instead of inventing figures.
  const stats = useMemo(() => {
    const rangeStart = startOfRange(timeRange);
    const previousStart = new Date(rangeStart);
    previousStart.setDate(previousStart.getDate() - RANGE_DAYS[timeRange]);

    const inRange: AnalyticsBooking[] = [];
    const inPreviousRange: AnalyticsBooking[] = [];

    bookings.forEach((booking) => {
      if (!booking.booking_date) return;
      const date = new Date(`${booking.booking_date}T00:00:00`);
      if (Number.isNaN(date.getTime())) return;

      if (date >= rangeStart) inRange.push(booking);
      else if (date >= previousStart) inPreviousRange.push(booking);
    });

    const earned = (list: AnalyticsBooking[]) =>
      list
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + b.total_amount, 0);

    const revenue = earned(inRange);
    const previousRevenue = earned(inPreviousRange);

    const percentChange = (current: number, previous: number): number | null =>
      previous > 0 ? ((current - previous) / previous) * 100 : null;

    const guests = inRange.reduce((sum, b) => sum + b.guests_count, 0);
    const cancelled = inRange.filter((b) => b.status === "cancelled").length;

    const byStatus = {
      approved: inRange.filter((b) => b.status === "approved").length,
      pending: inRange.filter((b) => b.status === "pending").length,
      completed: inRange.filter((b) => b.status === "completed").length,
      cancelled,
    };

    // Revenue per day, oldest first, for the trend chart
    const dailyTotals = new Map<string, number>();
    inRange
      .filter((b) => b.status !== "cancelled")
      .forEach((b) => {
        dailyTotals.set(b.booking_date, (dailyTotals.get(b.booking_date) || 0) + b.total_amount);
      });

    const trend = Array.from(dailyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));

    // Booking count per hour of day, for the peak-hours bars
    const hourly = new Map<number, number>();
    inRange.forEach((b) => {
      const hour = Number(b.booking_time?.split(":")[0]);
      if (Number.isNaN(hour)) return;
      hourly.set(hour, (hourly.get(hour) || 0) + 1);
    });

    // Pre-ordered dishes ranked by quantity
    const dishTotals = new Map<string, number>();
    inRange.forEach((b) => {
      b.preorder_items.forEach((item) => {
        if (!item?.name) return;
        dishTotals.set(item.name, (dishTotals.get(item.name) || 0) + (Number(item.quantity) || 0));
      });
    });

    const topDishes = Array.from(dishTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, orders]) => ({ name, orders }));

    // Bookings grouped by party size
    const sizeBuckets = [
      { label: "1–2 guests", min: 1, max: 2 },
      { label: "3–4 guests", min: 3, max: 4 },
      { label: "5–6 guests", min: 5, max: 6 },
      { label: "7+ guests", min: 7, max: Infinity },
    ].map((bucket) => {
      const rows = inRange.filter(
        (b) => b.guests_count >= bucket.min && b.guests_count <= bucket.max
      );
      const bucketRevenue = rows
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + b.total_amount, 0);

      return {
        label: bucket.label,
        count: rows.length,
        share: inRange.length > 0 ? (rows.length / inRange.length) * 100 : 0,
        avgSpend: rows.length > 0 ? bucketRevenue / rows.length : 0,
      };
    });

    return {
      total: inRange.length,
      revenue,
      revenueChange: percentChange(revenue, previousRevenue),
      bookingsChange: percentChange(inRange.length, inPreviousRange.length),
      avgPartySize: inRange.length > 0 ? guests / inRange.length : 0,
      cancellationRate: inRange.length > 0 ? (cancelled / inRange.length) * 100 : 0,
      byStatus,
      trend,
      hourly,
      topDishes,
      sizeBuckets,
    };
  }, [bookings, timeRange]);

  const trendPath = useMemo(() => {
    if (stats.trend.length < 2) return null;

    const max = Math.max(...stats.trend.map((p) => p.total), 1);
    const stepX = 600 / (stats.trend.length - 1);

    return stats.trend
      .map((point, index) => {
        const x = index * stepX;
        const y = 180 - (point.total / max) * 160;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [stats.trend]);

  const peakHours = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 09:00 – 22:00
    const max = Math.max(1, ...Array.from(stats.hourly.values()));
    return hours.map((hour) => ({
      hour,
      count: stats.hourly.get(hour) || 0,
      intensity: (stats.hourly.get(hour) || 0) / max,
    }));
  }, [stats.hourly]);

  const maxDishOrders = Math.max(1, ...stats.topDishes.map((d) => d.orders));
  const hasData = stats.total > 0;

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
      <PartnerSidebar active="analytics" />

      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <PartnerHeader
          title="Analytics"
          subtitle="Track your restaurant's performance"
          actions={
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["Today", "Week", "Month", "Year"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    timeRange === r
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        />

        <div className="p-8 space-y-8">
          {!hasData && (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-base font-black text-slate-900">
                No bookings in this period yet
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Figures appear here as soon as guests start booking. Try a wider time range.
              </p>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={formatMoney(stats.revenue)}
              change={stats.revenueChange}
              icon={<DollarSign size={24} />}
              tone="bg-orange-100 text-orange-600"
            />
            <KpiCard
              label="Bookings"
              value={String(stats.total)}
              change={stats.bookingsChange}
              icon={<Calendar size={24} />}
              tone="bg-sky-100 text-sky-600"
            />
            <KpiCard
              label="Avg. Party Size"
              value={stats.avgPartySize > 0 ? stats.avgPartySize.toFixed(1) : "—"}
              change={null}
              icon={<Users size={24} />}
              tone="bg-purple-100 text-purple-600"
            />
            <KpiCard
              label="Cancellation Rate"
              value={hasData ? `${stats.cancellationRate.toFixed(1)}%` : "—"}
              change={null}
              icon={<UserX size={24} />}
              tone="bg-red-100 text-red-600"
            />
          </div>

          {/* Revenue trend + status breakdown */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Revenue Trend</h3>
                <span className="text-xs font-bold text-slate-400">
                  {stats.trend.length} day{stats.trend.length === 1 ? "" : "s"} with revenue
                </span>
              </div>

              {trendPath ? (
                <div className="relative h-64 w-full pt-6">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path d={`${trendPath} L 600 200 L 0 200 Z`} fill="url(#revenueGrad)" />
                    <path d={trendPath} fill="none" stroke="#f97316" strokeWidth="3.5" />
                  </svg>

                  <div className="flex justify-between pt-3 text-[10px] font-bold text-slate-400">
                    <span>{formatDayLabel(stats.trend[0].date)}</span>
                    <span>{formatDayLabel(stats.trend[stats.trend.length - 1].date)}</span>
                  </div>
                </div>
              ) : (
                <p className="flex h-64 items-center justify-center text-sm font-bold text-slate-400">
                  At least two days of revenue are needed to draw a trend.
                </p>
              )}
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <h3 className="text-base font-black text-slate-900">Booking Status Breakdown</h3>

              <div className="flex items-center justify-center">
                <div className="flex h-44 w-44 flex-col items-center justify-center rounded-full border-[18px] border-slate-100">
                  <span className="text-3xl font-black text-slate-900">{stats.total}</span>
                  <span className="text-[10px] font-bold text-slate-400">Total</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-bold">
                {[
                  { label: "Approved", value: stats.byStatus.approved, color: "bg-emerald-500" },
                  { label: "Pending", value: stats.byStatus.pending, color: "bg-orange-500" },
                  { label: "Completed", value: stats.byStatus.completed, color: "bg-sky-500" },
                  { label: "Cancelled", value: stats.byStatus.cancelled, color: "bg-red-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} /> {row.label}
                    </span>
                    <span>
                      {stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0}% ({row.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peak hours + top dishes */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Peak Booking Hours</h3>

              <div className="flex items-end gap-1.5 h-40">
                {peakHours.map((slot) => (
                  <div key={slot.hour} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      title={`${slot.count} booking${slot.count === 1 ? "" : "s"}`}
                      className="w-full rounded-t-md bg-orange-500 transition-all"
                      style={{
                        height: `${Math.max(slot.intensity * 100, slot.count > 0 ? 6 : 2)}%`,
                        opacity: slot.count > 0 ? 1 : 0.15,
                      }}
                    />
                    <span className="text-[9px] font-bold text-slate-400">{slot.hour}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold text-slate-400 text-right">Hour of day</p>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Top Pre-ordered Dishes</h3>

              {stats.topDishes.length === 0 ? (
                <p className="py-10 text-center text-sm font-bold text-slate-400">
                  No dishes have been pre-ordered yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.topDishes.map((dish) => (
                    <div key={dish.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900">{dish.name}</span>
                        <span className="text-slate-500">
                          {dish.orders} order{dish.orders === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${(dish.orders / maxDishOrders) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Party size table */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Bookings by Party Size</h3>

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
                  {stats.sizeBuckets.map((bucket) => (
                    <tr key={bucket.label}>
                      <td className="py-3 px-4 text-slate-900 font-black">{bucket.label}</td>
                      <td className="py-3 px-4">{bucket.count}</td>
                      <td className="py-3 px-4">{bucket.share.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-slate-900 font-black">
                        {bucket.count > 0 ? formatMoney(bucket.avgSpend) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({
  label,
  value,
  change,
  icon,
  tone,
}: {
  label: string;
  value: string;
  change: number | null;
  icon: ReactNode;
  tone: string;
}) {
  const isUp = (change ?? 0) >= 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>

        {change === null ? (
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            No comparable previous period
          </p>
        ) : (
          <p
            className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${
              isUp ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isUp ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
            <span className="text-slate-400 font-normal">vs previous period</span>
          </p>
        )}
      </div>

      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
    </div>
  );
}
