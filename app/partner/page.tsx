"use client";

import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  HelpCircle,
  HelpCircle as HelpIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Store,
  Table2,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Volume2,
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

type QuickStats = {
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
  totalTables: number;
  menuItems: number;
  attendanceRate: number;
  totalGuests: number;
  totalRevenue: number;
};

type BookingItem = {
  id: string;
  customer_name: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  guests_count: number;
  table_name?: string;
  status: string;
  type?: "online" | "offline";
};

type StaffItem = {
  id?: string;
  name: string;
  role: "Waiter" | "Hostess" | "Chef" | "Manager";
  phone: string;
  status: "Active" | "Off-duty";
};

type GuestRecord = {
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string;
  vipStatus: boolean;
};

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();

  // Active Menu Branch matching the flowchart diagram
  const [activeBranch, setActiveBranch] = useState<
    "home" | "floormap_menu" | "guest_staff" | "analytics" | "settings" | "help_feedback"
  >("home");

  const [activeSubTab, setActiveSubTab] = useState<string>("recent_online");
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("My Restaurant");

  // Stats & Collections
  const [stats, setStats] = useState<QuickStats>({
    totalBookings: 0,
    pendingBookings: 0,
    todayBookings: 0,
    totalTables: 0,
    menuItems: 0,
    attendanceRate: 94,
    totalGuests: 0,
    totalRevenue: 0,
  });

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([
    { name: "Alexey V.", role: "Manager", phone: "+998 90 123 45 67", status: "Active" },
    { name: "Malika K.", role: "Hostess", phone: "+998 90 987 65 43", status: "Active" },
    { name: "Javohir T.", role: "Chef", phone: "+998 91 555 44 33", status: "Active" },
  ]);
  const [guestBook, setGuestBook] = useState<GuestRecord[]>([
    { name: "Farangiz E.", phone: "+998 90 111 22 33", totalVisits: 8, lastVisit: "2026-08-08", vipStatus: true },
    { name: "Rustam M.", phone: "+998 93 444 55 66", totalVisits: 4, lastVisit: "2026-08-07", vipStatus: false },
  ]);

  // Offline Booking Modal
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineName, setOfflineName] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineDate, setOfflineDate] = useState(new Date().toISOString().split("T")[0]);
  const [offlineTime, setOfflineTime] = useState("19:00");
  const [offlineGuests, setOfflineGuests] = useState(2);
  const [offlineTable, setOfflineTable] = useState("T1");

  // Feedback Form State
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

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
          router.push("/register/partner");
          return;
        }

        const rDoc = rSnap.docs[0];
        const rData = rDoc.data();
        const rId = rDoc.id;

        setRestaurantId(rId);
        setRestaurantName(rData.name || "My Restaurant");

        const todayStr = new Date().toISOString().split("T")[0];

        // Real-time Firestore Listeners
        const unsubBookings = onSnapshot(
          query(collection(db, "bookings"), where("restaurant_id", "==", rId)),
          (bSnap) => {
            const bList: BookingItem[] = bSnap.docs.map((d) => ({
              id: d.id,
              customer_name: d.data().customer_name || "Guest",
              customer_phone: d.data().customer_phone || "",
              booking_date: d.data().booking_date || "",
              booking_time: d.data().booking_time || "",
              guests_count: d.data().guests_count || 1,
              table_name: d.data().table_name || "T1",
              status: d.data().status || "pending",
              type: d.data().type || "online",
            }));

            setBookings(bList);
            const totalG = bList.reduce((acc, b) => acc + (b.guests_count || 1), 0);

            setStats((prev) => ({
              ...prev,
              totalBookings: bList.length,
              pendingBookings: bList.filter((b) => b.status === "pending").length,
              todayBookings: bList.filter((b) => b.booking_date === todayStr).length,
              totalGuests: totalG,
              totalRevenue: totalG * 25,
            }));
            setIsLoading(false);
          }
        );

        return () => unsubBookings();
      } catch (err) {
        console.error("Partner dashboard load error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleCreateOfflineBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!offlineName || !restaurantId) return;

    try {
      await addDoc(collection(db, "bookings"), {
        restaurant_id: restaurantId,
        customer_name: offlineName,
        customer_phone: offlinePhone,
        booking_date: offlineDate,
        booking_time: offlineTime,
        guests_count: offlineGuests,
        table_name: offlineTable,
        status: "approved",
        type: "offline",
        created_at: new Date().toISOString(),
      });

      setShowOfflineModal(false);
      setOfflineName("");
      setOfflinePhone("");
    } catch (err) {
      console.error("Error creating offline booking:", err);
    }
  }

  async function handleSendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    try {
      await addDoc(collection(db, "partner_feedbacks"), {
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        feedback: feedbackText,
        created_at: new Date().toISOString(),
      });
      setFeedbackText("");
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      console.error("Error sending feedback:", err);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-gray-800 border border-white/10 p-8 shadow-xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Partner Workspace...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070e17] text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation - Flowchart Branches */}
      <aside className="w-full md:w-72 border-r border-white/10 bg-[#0a1320] p-6 space-y-8 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
              <Utensils size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">{restaurantName}</span>
              <span className="block text-[10px] font-bold text-orange-400 uppercase">Partner Workspace</span>
            </div>
          </div>
        </div>

        {/* 6 Core Flowchart Menu Branches */}
        <nav className="space-y-2">
          {[
            { id: "home", label: "Home", icon: LayoutDashboard },
            { id: "floormap_menu", label: "Floor Map & Menu List", icon: Table2 },
            { id: "guest_staff", label: "Guest & Staff List", icon: Users },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "settings", label: "Settings", icon: Settings },
            { id: "help_feedback", label: "Get Help & Feedback", icon: HelpCircle },
          ].map((branch) => {
            const isActive = activeBranch === branch.id;
            return (
              <button
                key={branch.id}
                onClick={() => {
                  setActiveBranch(branch.id as any);
                  if (branch.id === "home") setActiveSubTab("recent_online");
                  if (branch.id === "floormap_menu") setActiveSubTab("table_map");
                  if (branch.id === "guest_staff") setActiveSubTab("guest_book");
                  if (branch.id === "analytics") setActiveSubTab("attendance");
                  if (branch.id === "settings") setActiveSubTab("user_mgmt");
                  if (branch.id === "help_feedback") setActiveSubTab("get_help");
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-black transition ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <branch.icon size={18} />
                  <span>{branch.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <Link
            href="/partner/profile"
            className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-white/10"
          >
            <UserCheck size={16} className="text-orange-400" /> Founder Profile
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/20"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <section className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Top Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-orange-400 tracking-wider">
              <Sparkles size={14} /> Restaurant Operations Hub
            </div>
            <h1 className="text-3xl font-black text-white capitalize">{activeBranch.replace("_", " & ")}</h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button
              onClick={() => setShowOfflineModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition"
            >
              <Plus size={16} /> Add Offline Booking
            </button>
          </div>
        </div>

        {/* BRANCH 1: HOME (Recent Online Bookings, Time Line, Offline Bookings) */}
        {activeBranch === "home" && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-white/10 pb-3">
              {[
                { id: "recent_online", label: "Recent Online Bookings" },
                { id: "timeline", label: "Time Line" },
                { id: "offline_list", label: "Offline Bookings" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                    activeSubTab === sub.id
                      ? "bg-white/10 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {activeSubTab === "recent_online" && (
              <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-4">
                <h3 className="text-xl font-black text-white">Recent Customer Online Reservations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                      <tr>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Guests</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.filter((b) => b.type !== "offline").map((b) => (
                        <tr key={b.id} className="hover:bg-white/5">
                          <td className="py-4 px-4 font-black text-white">{b.customer_name}</td>
                          <td className="py-4 px-4 font-bold text-orange-400">{b.table_name || "T1"}</td>
                          <td className="py-4 px-4 text-xs">{b.booking_date} at {b.booking_time}</td>
                          <td className="py-4 px-4">{b.guests_count} guests</td>
                          <td className="py-4 px-4">
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 capitalize">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === "timeline" && (
              <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-4">
                <h3 className="text-xl font-black text-white">Today's Reservation Timeline</h3>
                <div className="grid gap-3 sm:grid-cols-4">
                  {["12:00 PM", "02:00 PM", "06:00 PM", "08:00 PM"].map((slot, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <span className="text-xs font-bold text-orange-400">{slot}</span>
                      <p className="text-sm font-black text-white">2 Tables Reserved</p>
                      <p className="text-xs text-gray-400">4 Guests Expected</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === "offline_list" && (
              <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">Manual & Phone Offline Bookings</h3>
                  <button
                    onClick={() => setShowOfflineModal(true)}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white"
                  >
                    + New Walk-in
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                      <tr>
                        <th className="py-3 px-4">Guest Name</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.filter((b) => b.type === "offline").map((b) => (
                        <tr key={b.id} className="hover:bg-white/5">
                          <td className="py-4 px-4 font-black text-white">{b.customer_name}</td>
                          <td className="py-4 px-4 text-xs font-mono">{b.customer_phone || "Walk-in"}</td>
                          <td className="py-4 px-4 font-bold text-orange-400">{b.table_name || "T1"}</td>
                          <td className="py-4 px-4 text-xs">{b.booking_date} at {b.booking_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BRANCH 2: FLOOR MAP & MENU LIST */}
        {activeBranch === "floormap_menu" && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-white/10 pb-3">
              <Link
                href="/partner/floor-plan"
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-orange-500/20"
              >
                Open 2D Drag & Drop Table Builder →
              </Link>
              <Link
                href="/partner/menu"
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/20"
              >
                Manage Menu Catalog →
              </Link>
            </div>
          </div>
        )}

        {/* BRANCH 3: GUEST & STAFF LIST */}
        {activeBranch === "guest_staff" && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-white/10 pb-3">
              {[
                { id: "guest_book", label: "Guest Book (CRM)" },
                { id: "staff_book", label: "Staff Book" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                    activeSubTab === sub.id
                      ? "bg-white/10 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {activeSubTab === "guest_book" && (
              <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-4">
                <h3 className="text-xl font-black text-white">Guest Book Directory</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {guestBook.map((g, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-white">{g.name}</h4>
                        {g.vipStatus && (
                          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
                            ★ VIP Guest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{g.phone}</p>
                      <p className="text-xs font-bold text-orange-400">Total Visits: {g.totalVisits} times</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === "staff_book" && (
              <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-4">
                <h3 className="text-xl font-black text-white">Restaurant Staff Book</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {staffList.map((s, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-black text-white">{s.name}</h4>
                      <p className="text-xs font-bold text-orange-400">{s.role}</p>
                      <p className="text-xs font-mono text-gray-400">{s.phone}</p>
                      <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BRANCH 4: ANALYTICS (Attendance, Quantity of Guests, Guests Payment) */}
        {activeBranch === "analytics" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-6">
                <p className="text-xs font-bold text-gray-400 uppercase">Guest Attendance Rate</p>
                <p className="text-4xl font-black text-emerald-400 mt-2">{stats.attendanceRate}%</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-6">
                <p className="text-xs font-bold text-gray-400 uppercase">Quantity of Guests</p>
                <p className="text-4xl font-black text-orange-400 mt-2">{stats.totalGuests}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-6">
                <p className="text-xs font-bold text-gray-400 uppercase">Guests Payment & Revenue</p>
                <p className="text-4xl font-black text-sky-400 mt-2">${stats.totalRevenue}</p>
              </div>
            </div>
          </div>
        )}

        {/* BRANCH 5: SETTINGS (User Management, Chit Printing, Notification) */}
        {activeBranch === "settings" && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-6">
              <h3 className="text-xl font-black text-white">Restaurant Operational Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <h4 className="font-black text-white flex items-center gap-2">
                      <Printer size={16} className="text-orange-400" /> Chit Printing Preferences
                    </h4>
                    <p className="text-xs text-gray-400">Auto-print kitchen chits upon new pre-order booking.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 accent-orange-500" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <h4 className="font-black text-white flex items-center gap-2">
                      <Volume2 size={16} className="text-orange-400" /> Instant Notification Alerts
                    </h4>
                    <p className="text-xs text-gray-400">Play sound alert on new online reservation.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 accent-orange-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BRANCH 6: GET HELP & FEEDBACK */}
        {activeBranch === "help_feedback" && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-gray-900/80 p-6 shadow-xl space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <MessageSquarePlus size={20} className="text-orange-400" /> Platform Help & Feedback
              </h3>

              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Submit Feedback to DineFlow Core Team
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe any suggestions, issues, or feature requests..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                {feedbackSuccess && (
                  <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-400">
                    Thank you! Your feedback has been sent directly to the DineFlow team.
                  </div>
                )}

                <button
                  type="submit"
                  className="rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                >
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Offline Booking Creator Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Add Walk-in / Offline Booking</h3>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="rounded-full bg-white/10 p-2 text-gray-400 hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfflineBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={offlineName}
                  onChange={(e) => setOfflineName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={offlinePhone}
                  onChange={(e) => setOfflinePhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Time</label>
                  <input
                    type="time"
                    value={offlineTime}
                    onChange={(e) => setOfflineTime(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    value={offlineGuests}
                    onChange={(e) => setOfflineGuests(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-orange-500 py-3 text-sm font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
              >
                Create Offline Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}