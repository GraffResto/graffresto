"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Table,
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
  Users,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import PartnerSidebar from "@/components/PartnerSidebar";
import PartnerHeaderActions from "@/components/PartnerHeaderActions";
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

type Booking = {
  id: string;
  customer_name: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  table_name: string;
  guests_count: number;
  occasion?: string;
  payment_status?: "paid" | "not_paid";
  status: "approved" | "pending" | "completed" | "cancelled";
  source?: string;
};

export default function BookingsManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");

  // Held in a ref because the async auth callback cannot return a cleanup
  const bookingsListenerRef = useRef<(() => void) | null>(null);

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);

  // New Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("18:00");
  const [newTable, setNewTable] = useState("Table 1");
  const [newGuests, setNewGuests] = useState(4);
  const [newOccasion, setNewOccasion] = useState("Dining");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const detachBookings = () => {
      bookingsListenerRef.current?.();
      bookingsListenerRef.current = null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      detachBookings();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setBookings([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        setRestaurantId(rDoc.id);
        setRestaurantName(rDoc.data().name || "Your restaurant");

        // Real-time bookings for this restaurant only
        bookingsListenerRef.current = onSnapshot(
          query(collection(db, "bookings"), where("restaurant_id", "==", rDoc.id)),
          (snap) => {
            const list: Booking[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                customer_name: data.customer_name || "Guest",
                customer_phone: data.customer_phone || "",
                booking_date: data.booking_date || "",
                booking_time: data.booking_time || "",
                table_name: data.table_name || "",
                guests_count: data.guests_count ?? 0,
                occasion: data.occasion || "",
                payment_status: data.payment_status || "not_paid",
                status: data.status || "pending",
                source: data.source || "Website",
              };
            });

            setBookings(list);
            setIsLoading(false);
          },
          (err) => {
            console.error("Bookings listener error:", err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("Bookings load error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detachBookings();
    };
  }, [router]);

  async function handleUpdateStatus(id: string, nextStatus: Booking["status"]) {
    try {
      await updateDoc(doc(db, "bookings", id), { status: nextStatus });
    } catch (err) {
      console.error("Error updating booking status:", err);
      // Fallback local update
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)));
    }
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomerName) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        restaurant_id: restaurantId,
        customer_name: newCustomerName,
        customer_phone: newCustomerPhone,
        booking_date: newDate,
        booking_time: newTime,
        table_name: newTable,
        guests_count: Number(newGuests),
        occasion: newOccasion,
        payment_status: "paid",
        status: "approved",
        source: "Website",
        created_at: new Date().toISOString(),
      });

      setShowModal(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    } catch (err) {
      console.error("Error creating booking:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  // Filtered dataset
  const filteredBookings = bookings.filter((b) => {
    const matchesTab = activeTab === "all" ? true : b.status === activeTab;
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone?.includes(searchQuery) ||
      b.table_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Bookings...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Mockup 4 */}
      <PartnerSidebar active="bookings" />

      {/* Main Workspace Area matching Mockup 4 */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Bookings</h1>
            <p className="text-xs font-medium text-slate-500">Manage all your reservations in one place</p>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <PartnerHeaderActions />
            
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-6">
          {/* Top Controls Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs matching Mockup 4 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: `All (${bookings.length})` },
                { id: "pending", label: `Pending (${bookings.filter((b) => b.status === "pending").length})` },
                { id: "approved", label: `Approved (${bookings.filter((b) => b.status === "approved").length})` },
                { id: "completed", label: `Completed (${bookings.filter((b) => b.status === "completed").length})` },
                { id: "cancelled", label: `Cancelled (${bookings.filter((b) => b.status === "cancelled").length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeTab === tab.id
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions: View toggle, search, + New Booking */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "timeline" ? "bg-slate-100 text-slate-900" : "text-slate-500"
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "list" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  List view
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 w-48 sm:w-64"
                />
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 transition flex-shrink-0"
              >
                <Plus size={16} /> + New Booking
              </button>
            </div>
          </div>

          {/* Bookings Data Table matching Mockup 4 */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-4 px-6">Time</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Contact</th>
                    <th className="py-4 px-6">Table</th>
                    <th className="py-4 px-6">Party Size</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Source</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition">
                      {/* Time & Date */}
                      <td className="py-4 px-6 font-mono text-slate-900">{b.booking_time}</td>

                      {/* Customer Initials & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-black text-slate-700">
                            {b.customer_name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="font-black text-slate-900">{b.customer_name}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 font-mono text-slate-500">{b.customer_phone || "+998 90 123 45 67"}</td>

                      {/* Table */}
                      <td className="py-4 px-6">
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-slate-900 font-black">
                          {b.table_name}
                        </span>
                      </td>

                      {/* Party Size */}
                      <td className="py-4 px-6 text-slate-900 font-black">{b.guests_count}</td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[11px] font-black capitalize ${
                            b.status === "approved"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : b.status === "pending"
                              ? "bg-orange-50 text-orange-600 border border-orange-200"
                              : b.status === "completed"
                              ? "bg-sky-50 text-sky-600 border border-sky-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Source Badge */}
                      <td className="py-4 px-6 text-slate-500">{b.source || "Website"}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, "approved")}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-black text-emerald-600 hover:bg-emerald-100 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, "cancelled")}
                                className="rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-100 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching Mockup 4 */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-xs font-bold text-slate-400">
                Showing 1-{filteredBookings.length} of {bookings.length} bookings
              </span>

              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronLeft size={16} />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 font-black text-xs text-white">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  3
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Booking Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Create Reservation</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Karimov Jasur"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Table</label>
                  <select
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  >
                    <option value="Table 1">Table 1</option>
                    <option value="Table 2">Table 2</option>
                    <option value="Table 5">Table 5</option>
                    <option value="Table 8">Table 8</option>
                    <option value="Table 12">Table 12</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-orange-500 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Save Reservation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}