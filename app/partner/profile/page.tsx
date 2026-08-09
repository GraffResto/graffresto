"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Key,
  Loader2,
  LogOut,
  MapPin,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  User,
  Utensils,
  Table,
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

export default function OwnerProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("Afsona");
  const [lastName, setLastName] = useState("Yusupova");
  const [email, setEmail] = useState("afsona@graffresto.uz");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [city, setCity] = useState("Tashkent");
  const [district, setDistrict] = useState("Chilonzor");
  const [twoFactor, setTwoFactor] = useState(true);

  const [activeTab, setActiveTab] = useState<"account" | "security" | "activity">("account");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);
      try {
        const pSnap = await getDoc(doc(db, "profiles", user.uid));
        if (pSnap.exists()) {
          const d = pSnap.data();
          const parts = (d.full_name || "Afsona Yusupova").split(" ");
          setFirstName(parts[0] || "Afsona");
          setLastName(parts[1] || "Yusupova");
          setEmail(user.email || d.email || "afsona@graffresto.uz");
          setPhone(d.phone || "+998 90 123 45 67");
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function handleCopyLink() {
    navigator.clipboard.writeText("graffresto.uz/afsona-restaurant");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "profiles", userId), {
        full_name: `${firstName} ${lastName}`,
        phone: phone,
        city: city,
        district: district,
        updated_at: new Date().toISOString(),
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Profile...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Profile Mockup */}
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
            className="flex items-center gap-3 rounded-2xl bg-orange-500 p-3 text-white font-bold shadow-md shadow-orange-500/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400 text-white font-bold border border-orange-300">
              <Store size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Afsona Restaurant</p>
              <p className="text-[10px] text-orange-100">Restaurant Owner</p>
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

      {/* Main Workspace Area matching Profile Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
            <p className="text-xs font-medium text-slate-500">Manage your personal details and owner profile</p>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <div className="relative">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                <Bell size={18} />
              </button>
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white">
                3
              </span>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-500/20">
              A
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-8">
          {/* Cover & Floating Card Header matching Profile Mockup B */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Cover Banner */}
            <div className="relative h-48 w-full bg-gradient-to-r from-slate-900 to-orange-950">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200"
                alt="Cover"
                className="h-full w-full object-cover opacity-60"
              />
              <button className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-2xl bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-bold text-white hover:bg-black/80 transition">
                <Camera size={14} /> Change Cover
              </button>
            </div>

            {/* Floating Profile Info Card */}
            <div className="p-8 relative -mt-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-end gap-5">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-500 text-white font-black text-4xl shadow-2xl ring-4 ring-white">
                  A
                  <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white border-2 border-white">
                    <Camera size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900">{firstName} {lastName}</h2>
                    <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-black text-orange-600">
                      Restaurant Owner
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Afsona Restaurant • Tashkent, Uzbekistan</p>
                </div>
              </div>

              {/* Stats & Short URL */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold">
                  <span>248 Bookings</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-500 flex items-center gap-1">4.8 <Star size={12} fill="currentColor" /></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">8 mo partner</span>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Copy size={14} /> {copied ? "Copied!" : "graffresto.uz/afsona-restaurant"}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 px-8 border-t border-slate-100 text-xs font-black">
              <button
                onClick={() => setActiveTab("account")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "account"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Account Settings
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "security"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Security & 2FA
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "activity"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Recent Activity
              </button>
            </div>
          </div>

          {/* Form / Content Section */}
          {activeTab === "account" && (
            <form onSubmit={handleSaveProfile} className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900">Personal Information</h3>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  >
                    <option value="Tashkent">Tashkent</option>
                    <option value="Samarkand">Samarkand</option>
                    <option value="Bukhara">Bukhara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  >
                    <option value="Chilonzor">Chilonzor</option>
                    <option value="Yunusabad">Yunusabad</option>
                    <option value="Mirzo Ulugbek">Mirzo Ulugbek</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-orange-500 px-8 py-3.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900">Security & Authentication</h3>

              <div className="space-y-4 divide-y divide-slate-100">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-black text-slate-900">Password</p>
                    <p className="text-[11px] text-slate-500">Last changed 2 months ago</p>
                  </div>
                  <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    Change Password
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-black text-slate-900">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-slate-500">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      twoFactor ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactor ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-black text-slate-900">Active Sessions</p>
                    <p className="text-[11px] text-slate-500">2 active devices logged in</p>
                  </div>
                  <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    Manage Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900">Recent Account Activity</h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {[
                  { title: "Logged in from Chrome, Tashkent", time: "2 hours ago" },
                  { title: "Updated restaurant business hours", time: "Yesterday" },
                  { title: "Approved 3 new bookings", time: "2 days ago" },
                  { title: "Changed profile cover photo", time: "1 week ago" },
                ].map((act, i) => (
                  <div key={i} className="relative flex items-center justify-between text-xs font-bold">
                    <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                    <span className="text-slate-900">{act.title}</span>
                    <span className="text-slate-400 font-normal">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
