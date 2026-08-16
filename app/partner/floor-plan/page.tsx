"use client";

import Link from "next/link";
import {
  Calendar,
  Loader2,
  Pencil,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartnerSidebar from "@/components/PartnerSidebar";
import PartnerHeader from "@/components/PartnerHeader";
import Restaurant3DViewer from "@/components/spatial/Restaurant3DViewer";
import { Sparkles, Layers } from "lucide-react";
import { usePartnerRestaurant } from "@/components/usePartnerRestaurant";
import {
  auth,
  db,
  collection,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
  onAuthStateChanged,
} from "@/lib/firebase";

type TableStatus = "available" | "seated" | "arriving" | "occupied" | "blocked";

type TableItem = {
  id: string;
  table_name: string;
  seats: number;
  zone: string;
  status: TableStatus;
};

type TodayBooking = {
  id: string;
  customer_name: string;
  booking_time: string;
  guests_count: number;
  table_name: string;
  status: string;
};

const STATUS_STYLES: Record<TableStatus, string> = {
  available: "bg-emerald-950/40 border-emerald-500 text-emerald-300",
  seated: "bg-blue-950/40 border-blue-500 text-blue-300",
  arriving: "bg-amber-950/40 border-amber-500 text-amber-300",
  occupied: "bg-red-950/40 border-red-500 text-red-300",
  blocked: "bg-slate-900 border-slate-700 text-slate-500",
};

const STATUS_ACTIONS: { status: TableStatus; label: string; primary?: boolean }[] = [
  { status: "available", label: "Available" },
  { status: "arriving", label: "Arriving" },
  { status: "seated", label: "Seated", primary: true },
  { status: "occupied", label: "Occupied" },
  { status: "blocked", label: "Blocked" },
];

function isTableStatus(value: unknown): value is TableStatus {
  return (
    value === "available" ||
    value === "seated" ||
    value === "arriving" ||
    value === "occupied" ||
    value === "blocked"
  );
}

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G"
  );
}

export default function FloorMapSeatingPage() {
  const router = useRouter();
  const { restaurantId, isLoading: restaurantLoading } = usePartnerRestaurant();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  // Derived rather than stored, so the effect never sets state synchronously
  const isLoading = restaurantLoading || (restaurantId !== null && !dataLoaded);

  const listenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const detach = () => {
      listenersRef.current.forEach((unsubscribe) => unsubscribe());
      listenersRef.current = [];
    };

    detach();

    if (restaurantLoading || !restaurantId) return;

    const unsubTables = onSnapshot(
      query(collection(db, "tables"), where("restaurant_id", "==", restaurantId)),
      (snap) => {
        const list: TableItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            table_name: data.table_name || "Table",
            seats: Number(data.seats) || 0,
            zone: data.zone || "Main Hall",
            status: isTableStatus(data.status) ? data.status : "available",
          };
        });

        list.sort((a, b) =>
          a.table_name.localeCompare(b.table_name, undefined, { numeric: true })
        );

        setTables(list);
        setDataLoaded(true);
      },
      (err) => {
        console.error("Floor plan tables listener error:", err);
        setDataLoaded(true);
      }
    );

    const todayStr = new Date().toISOString().split("T")[0];

    const unsubBookings = onSnapshot(
      query(
        collection(db, "bookings"),
        where("restaurant_id", "==", restaurantId),
        where("booking_date", "==", todayStr)
      ),
      (snap) => {
        const list: TodayBooking[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              customer_name: data.customer_name || "Guest",
              booking_time: data.booking_time || "",
              guests_count: Number(data.guests_count) || 0,
              table_name: data.table_name || "",
              status: data.status || "pending",
            };
          })
          .filter((b) => b.status !== "cancelled")
          .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

        setTodayBookings(list);
      },
      (err) => console.error("Floor plan bookings listener error:", err)
    );

    listenersRef.current = [unsubTables, unsubBookings];

    return detach;
  }, [restaurantId, restaurantLoading]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

  // Zones come from the tables themselves, not a fixed list of three
  const zones = useMemo(() => {
    const grouped = new Map<string, TableItem[]>();
    tables.forEach((table) => {
      const list = grouped.get(table.zone) || [];
      list.push(table);
      grouped.set(table.zone, list);
    });
    return Array.from(grouped.entries());
  }, [tables]);

  const covers = todayBookings.reduce((sum, b) => sum + b.guests_count, 0);
  const seatedCount = tables.filter((t) => t.status === "seated" || t.status === "occupied").length;

  // Bookings grouped into hourly buckets for the small timeline chart
  const coversByHour = useMemo(() => {
    const buckets = new Map<number, number>();
    todayBookings.forEach((b) => {
      const hour = Number(b.booking_time?.split(":")[0]);
      if (Number.isNaN(hour)) return;
      buckets.set(hour, (buckets.get(hour) || 0) + b.guests_count);
    });

    return Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  }, [todayBookings]);

  const maxCovers = Math.max(1, ...coversByHour.map(([, count]) => count));

  async function handleChangeTableStatus(newStatus: TableStatus) {
    if (!selectedTable) return;

    setSavingStatus(true);
    setErrorMessage("");

    try {
      // Persist to Firestore — the snapshot listener refreshes the map
      await updateDoc(doc(db, "tables", selectedTable.id), { status: newStatus });
    } catch (err) {
      console.error("Error updating table status:", err);
      setErrorMessage("Could not save the table status. Please try again.");
    } finally {
      setSavingStatus(false);
    }
  }

  // Safe to build during render: this branch only runs after the loader above,
  // which is what the server prerendered, so there is no hydration mismatch.
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
      <PartnerSidebar active="floor-plan" />

      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafc] text-slate-900">
        <PartnerHeader
          title="Floor Map"
          subtitle="Live seating status for today"
          actions={
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("2d")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "2d"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Layers size={14} /> 2D Layout
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "3d"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={14} /> 3D Digital Twin
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                <Calendar size={14} className="text-orange-500" />
                <span>{todayLabel || "Today"}</span>
              </div>

              <Link
                href="/partner/onboarding"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={14} /> Edit layout
              </Link>
            </>
          }
        />

        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 bg-[#060c14]">
          {/* Left panel: today's guests */}
          <div className="w-full lg:w-80 rounded-[2.5rem] border border-slate-800 bg-[#09111e] p-5 flex flex-col justify-between space-y-5 flex-shrink-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase text-slate-400">
                  Seated {seatedCount}/{tables.length}
                </span>
                <Link
                  href="/partner/bookings"
                  className="text-[10px] font-black text-orange-400 hover:underline"
                >
                  All bookings
                </Link>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {todayBookings.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs font-bold text-slate-500">
                    No bookings for today.
                  </p>
                ) : (
                  todayBookings.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-900/90 border border-slate-800/80 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-900/60 text-purple-300 font-black text-xs border border-purple-500/30">
                          {initialsOf(guest.customer_name)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{guest.customer_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {guest.booking_time || "—"} • {guest.status}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-300">{guest.guests_count} 👤</p>
                        {guest.table_name && (
                          <p className="text-[10px] text-orange-400 font-bold">{guest.table_name}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {covers} covers today
              </span>

              {coversByHour.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-600">No covers booked yet.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-16 pt-2">
                  {coversByHour.map(([hour, count]) => (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        title={`${count} covers`}
                        className="w-full rounded-t-lg bg-orange-500 transition-all"
                        style={{ height: `${Math.max((count / maxCovers) * 100, 6)}%` }}
                      />
                      <span className="text-[9px] font-bold text-slate-500">{hour}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: the map itself */}
          <div className="flex-1 flex flex-col justify-between rounded-[2.5rem] border border-slate-800 bg-[#09111e] p-6 space-y-6 overflow-x-auto">
            {viewMode === "3d" ? (
              <Restaurant3DViewer
                restaurantId={restaurantId || ""}
                restaurantName="Floor Plan 3D Digital Twin"
              />
            ) : tables.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
                <Users size={36} className="text-slate-600" />
                <div>
                  <p className="text-base font-black text-white">No tables set up yet</p>
                  <p className="mt-1 text-sm font-medium text-slate-400">
                    Add your tables and zones in onboarding, then they appear here.
                  </p>
                </div>
                <Link
                  href="/partner/onboarding"
                  className="rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600"
                >
                  Set up floor plan
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {zones.map(([zoneName, zoneTables]) => (
                  <div
                    key={zoneName}
                    className="rounded-3xl border border-slate-800 bg-[#050b12] p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {zoneName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {zoneTables.length} tables
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {zoneTables.map((table) => {
                        const guest = todayBookings.find((b) => b.table_name === table.table_name);

                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setSelectedTableId(table.id)}
                            title={
                              guest
                                ? `${guest.customer_name} • ${guest.guests_count} guests • ${guest.booking_time}`
                                : `${table.seats} seats`
                            }
                            className={`relative flex h-20 flex-col items-center justify-center rounded-2xl border-2 transition ${
                              STATUS_STYLES[table.status]
                            } ${
                              selectedTableId === table.id
                                ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-[#050b12]"
                                : ""
                            }`}
                          >
                            <span className="text-base font-black">{table.table_name}</span>
                            <span className="text-[10px] font-bold opacity-80">
                              {table.seats} seats
                            </span>
                            {guest && (
                              <span className="absolute top-1 right-1.5 text-[9px] font-black text-orange-300">
                                ●
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend and status actions */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              {errorMessage && (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                  {(
                    [
                      ["available", "bg-emerald-500", "Available"],
                      ["seated", "bg-blue-500", "Seated"],
                      ["arriving", "bg-amber-500", "Arriving"],
                      ["occupied", "bg-red-500", "Occupied"],
                      ["blocked", "bg-slate-600", "Blocked"],
                    ] as const
                  ).map(([key, color, label]) => (
                    <span key={key} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  {STATUS_ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => handleChangeTableStatus(action.status)}
                      disabled={!selectedTable || savingStatus}
                      className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        action.primary
                          ? "bg-orange-500 text-white font-black shadow-md shadow-orange-500/20 hover:bg-orange-600"
                          : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-500">
                {selectedTable
                  ? `${selectedTable.table_name} selected — pick a status to save it.`
                  : "Select a table on the map to change its status."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
