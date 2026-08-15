"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

type FinanceBooking = {
  booking_date: string;
  status: string;
  total_amount: number;
  prepayment_amount: number;
};

type FilterPeriod = "Day" | "Week" | "Month" | "Year";

const PERIOD_DAYS: Record<FilterPeriod, number> = {
  Day: 1,
  Week: 7,
  Month: 30,
  Year: 365,
};

function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString()} UZS`;
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function FinancePage() {
  const router = useRouter();
  const { restaurantId, isLoading: restaurantLoading } = usePartnerRestaurant();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("Month");
  const [bookings, setBookings] = useState<FinanceBooking[]>([]);

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
              status: data.status || "pending",
              total_amount: Number(data.total_amount) || 0,
              prepayment_amount: Number(data.prepayment_amount) || 0,
            };
          })
        );
        setDataLoaded(true);
      },
      (err) => {
        console.error("Finance listener error:", err);
        setDataLoaded(true);
      }
    );

    return detach;
  }, [restaurantId, restaurantLoading]);

  // Revenue is what the restaurant actually booked. This app has no expense
  // ledger yet, so expenses and profit are reported as unavailable rather than
  // filled in with invented numbers.
  const finance = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (PERIOD_DAYS[filterPeriod] - 1));

    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - PERIOD_DAYS[filterPeriod]);

    const inRange: FinanceBooking[] = [];
    const inPrevious: FinanceBooking[] = [];

    bookings.forEach((booking) => {
      if (!booking.booking_date) return;
      const date = new Date(`${booking.booking_date}T00:00:00`);
      if (Number.isNaN(date.getTime())) return;

      if (date >= start) inRange.push(booking);
      else if (date >= previousStart) inPrevious.push(booking);
    });

    const sumRevenue = (list: FinanceBooking[]) =>
      list.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.total_amount, 0);

    const revenue = sumRevenue(inRange);
    const previousRevenue = sumRevenue(inPrevious);

    const collected = inRange
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.prepayment_amount, 0);

    const today = todayIso();
    const todayRevenue = bookings
      .filter((b) => b.booking_date === today && b.status !== "cancelled")
      .reduce((sum, b) => sum + b.total_amount, 0);

    // Daily revenue for the bar chart, most recent last
    const dailyTotals = new Map<string, number>();
    inRange
      .filter((b) => b.status !== "cancelled")
      .forEach((b) => {
        dailyTotals.set(b.booking_date, (dailyTotals.get(b.booking_date) || 0) + b.total_amount);
      });

    const daily = Array.from(dailyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, total]) => ({ date, total }));

    return {
      revenue,
      revenueChange:
        previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : null,
      collected,
      outstanding: Math.max(revenue - collected, 0),
      todayRevenue,
      daily,
      bookingCount: inRange.length,
      cancelledValue: inRange
        .filter((b) => b.status === "cancelled")
        .reduce((sum, b) => sum + b.total_amount, 0),
    };
  }, [bookings, filterPeriod]);

  const maxDaily = Math.max(1, ...finance.daily.map((d) => d.total));

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
      <PartnerSidebar active="finance" />

      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <PartnerHeader
          title="Finance"
          subtitle="Revenue booked through DineFlow"
          actions={
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["Day", "Week", "Month", "Year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    filterPeriod === p
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        />

        <div className="p-8 space-y-8">
          {/* Summary cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
                  Revenue
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/40 text-white">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black">{formatMoney(finance.revenue)}</p>
                {finance.revenueChange !== null && (
                  <span className="inline-block mt-2 rounded-md bg-orange-400/30 px-2 py-0.5 text-[10px] font-black text-white">
                    {finance.revenueChange >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(finance.revenueChange).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prepaid / Collected
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900">
                  {formatMoney(finance.collected)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Due on Arrival
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Wallet size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900">
                  {formatMoney(finance.outstanding)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lost to Cancellations
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900">
                  {formatMoney(finance.cancelledValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Daily revenue chart */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Daily Revenue</h3>
              <span className="text-xs font-bold text-slate-400">
                {finance.bookingCount} booking{finance.bookingCount === 1 ? "" : "s"} in period
              </span>
            </div>

            {finance.daily.length === 0 ? (
              <p className="flex h-52 items-center justify-center text-sm font-bold text-slate-400">
                No revenue recorded in this period yet.
              </p>
            ) : (
              <div className="flex items-end justify-between gap-3 h-60 pt-6 px-2">
                {finance.daily.map((bar) => (
                  <div key={bar.date} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        title={formatMoney(bar.total)}
                        className="w-6 rounded-t-md bg-orange-500 transition-all hover:opacity-90"
                        style={{ height: `${Math.max((bar.total / maxDaily) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(`${bar.date}T00:00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today + revenue statement */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Today</h3>
              <p className="text-4xl font-black text-slate-900">
                {formatMoney(finance.todayRevenue)}
              </p>
              <p className="text-xs font-medium text-slate-500">
                Total value of today&apos;s active bookings, including pre-orders.
              </p>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Revenue Statement</h3>

              <div className="space-y-3 text-xs font-bold">
                <div className="flex justify-between text-slate-600">
                  <span>Booked revenue</span>
                  <span className="font-black text-slate-900">{formatMoney(finance.revenue)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already collected</span>
                  <span className="font-black text-slate-900">{formatMoney(finance.collected)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-orange-600 font-black text-sm">
                  <span>Outstanding</span>
                  <span>{formatMoney(finance.outstanding)}</span>
                </div>
              </div>

              <p className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-[11px] font-medium leading-relaxed text-slate-500">
                Expenses, payroll and profit are not tracked yet — DineFlow has no expense ledger,
                so no cost figures are shown here rather than estimated ones.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
