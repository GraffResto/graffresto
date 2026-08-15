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
import { usePartnerRestaurant } from "@/components/usePartnerRestaurant";
import PartnerSidebar from "@/components/PartnerSidebar";
import PartnerHeaderActions from "@/components/PartnerHeaderActions";
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
  const { restaurantName, pendingCount } = usePartnerRestaurant();

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State — blank until the profile loads, so nothing invented is saved
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);

  const [activeTab, setActiveTab] = useState<"account" | "security" | "activity">("account");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);
      setEmail(user.email || "");

      try {
        const pSnap = await getDoc(doc(db, "profiles", user.uid));
        if (pSnap.exists()) {
          const d = pSnap.data();
          // Keep multi-word surnames intact instead of dropping everything
          // after the second word.
          const parts = (d.full_name || "").trim().split(/\s+/).filter(Boolean);
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" "));
          setEmail(user.email || d.email || "");
          setPhone(d.phone || "");
          setCity(d.city || "");
          setDistrict(d.district || "");
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleCopyLink() {
    if (typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/partner`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    setSaveMessage("");
    setSaveError(false);

    if (!userId) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "profiles", userId), {
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        city: city.trim(),
        district: district.trim(),
        updated_at: new Date().toISOString(),
      });

      setSaveMessage("Profile updated.");
    } catch (err) {
      console.error("Error saving profile:", err);
      setSaveError(true);
      setSaveMessage("Could not save your profile. Please try again.");
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
      <PartnerSidebar active="profile" />

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
            <PartnerHeaderActions />

            
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
                  {firstName.charAt(0).toUpperCase() || "O"}
                  <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white border-2 border-white">
                    <Camera size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900">
                      {`${firstName} ${lastName}`.trim() || "Restaurant owner"}
                    </h2>
                    <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-black text-orange-600">
                      Restaurant Owner
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    {restaurantName || "Your restaurant"}
                    {city ? ` • ${city}` : ""}
                  </p>
                </div>
              </div>

              {/* Real counts, sourced from this restaurant's bookings */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold">
                  <span>
                    {pendingCount} pending booking{pendingCount === 1 ? "" : "s"}
                  </span>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Copy size={14} /> {copied ? "Copied!" : "Copy panel link"}
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
                    <option value="">Not set</option>
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
                    <option value="">Not set</option>
                    <option value="Chilonzor">Chilonzor</option>
                    <option value="Yunusabad">Yunusabad</option>
                    <option value="Mirzo Ulugbek">Mirzo Ulugbek</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                {saveMessage && (
                  <p
                    className={`mr-auto rounded-2xl px-4 py-2.5 text-xs font-bold ${
                      saveError
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {saveMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSaving || !userId}
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
