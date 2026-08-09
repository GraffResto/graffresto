"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Globe,
  Layers,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Shield,
  Star,
  Store,
  Table,
  Trash2,
  Users,
  Utensils,
  BarChart3,
  ChefHat,
  Boxes,
  DollarSign,
  Gift,
  LayoutDashboard,
  UtensilsCrossed,
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
  doc,
  getDoc,
  updateDoc,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

export default function PartnerSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [activeSubnav, setActiveSubnav] = useState<
    "general" | "profile" | "hours" | "team" | "notifications" | "billing" | "integrations" | "danger"
  >("general");

  // Form State matching General Settings Mockup
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");
  const [cuisineType, setCuisineType] = useState("Uzbek, European");
  const [phoneNumber, setPhoneNumber] = useState("+998 90 123 45 67");
  const [emailAddress, setEmailAddress] = useState("info@afsonarestaurant.uz");
  const [address, setAddress] = useState("123 Amir Temur Street, Chilonzor District");
  const [city, setCity] = useState("Tashkent");
  const [district, setDistrict] = useState("Chilonzor");

  // Regional
  const [currency, setCurrency] = useState("UZS");
  const [timezone, setTimezone] = useState("Asia/Tashkent");

  // Booking Preferences
  const [autoApprove, setAutoApprove] = useState(false);
  const [requirePrepayment, setRequirePrepayment] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState("90");
  const [cancellationWindow, setCancellationWindow] = useState("2");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (!rSnap.empty) {
          const rDoc = rSnap.docs[0];
          setRestaurantId(rDoc.id);
          const d = rDoc.data();
          setRestaurantName(d.name || "Afsona Restaurant");
          setCuisineType(Array.isArray(d.cuisine_type) ? d.cuisine_type.join(", ") : d.cuisine_type || "Uzbek, European");
          setPhoneNumber(d.phone || "+998 90 123 45 67");
          setEmailAddress(d.email || "info@afsonarestaurant.uz");
          setAddress(d.address || "123 Amir Temur Street, Chilonzor District");
          setCity(d.city || "Tashkent");
          setDistrict(d.district || "Chilonzor");
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), {
        name: restaurantName,
        cuisine_type: cuisineType.split(",").map((s) => s.trim()),
        phone: phoneNumber,
        email: emailAddress,
        address: address,
        city: city,
        district: district,
        updated_at: new Date().toISOString(),
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
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
          <span className="font-bold text-gray-300">Loading Settings...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Settings Mockup */}
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
            className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20"
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

      {/* Main Workspace Area matching Settings Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Settings</h1>
            <p className="text-xs font-medium text-slate-500">Manage your restaurant profile and preferences</p>
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

            <Link
              href="/partner/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-500/20 hover:scale-105 transition"
            >
              A
            </Link>
          </div>
        </header>

        {/* Settings Grid matching Settings Mockup */}
        <div className="p-8 grid gap-8 lg:grid-cols-4">
          {/* Left Settings Sub-Nav Bar matching Settings Mockup */}
          <div className="lg:col-span-1 rounded-[2.5rem] border border-slate-200 bg-white p-4 space-y-1.5 shadow-sm h-fit">
            {[
              { id: "general", label: "General", icon: Building2 },
              { id: "profile", label: "Restaurant Profile", icon: Store },
              { id: "hours", label: "Business Hours", icon: Clock },
              { id: "team", label: "Team & Roles", icon: Users },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "billing", label: "Payments & Billing", icon: CreditCard },
              { id: "integrations", label: "Integrations", icon: Layers },
              { id: "danger", label: "Danger Zone", icon: AlertTriangle, color: "text-red-500" },
            ].map((sub) => {
              const Icon = sub.icon;
              const isActive = activeSubnav === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubnav(sub.id as any)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black transition ${
                    isActive
                      ? "bg-orange-50 text-orange-600 border border-orange-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} className={sub.color || (isActive ? "text-orange-600" : "text-slate-400")} />
                  <span className={sub.color || ""}>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Main Form Workspace matching Settings Mockup */}
          <div className="lg:col-span-3">
            {activeSubnav === "general" && (
              <form onSubmit={handleSaveSettings} className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-8">
                {/* Section 1: Restaurant Information */}
                <div className="space-y-6">
                  <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                    Restaurant Information
                  </h3>

                  {/* Logo Upload Circle */}
                  <div className="flex items-center gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-white font-black text-2xl shadow-lg ring-4 ring-orange-100">
                      <Utensils size={32} />
                    </div>
                    <div>
                      <button type="button" className="text-xs font-black text-orange-600 hover:underline">
                        Change Logo
                      </button>
                      <p className="text-[10px] text-slate-400">JPG, PNG or SVG. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        required
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cuisine Type</label>
                      <input
                        type="text"
                        required
                        value={cuisineType}
                        onChange={(e) => setCuisineType(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Regional Settings */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Regional Settings</h3>

                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Language</label>
                      <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none">
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                        <option value="uz">O'zbekcha</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="UZS">UZS</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="Asia/Tashkent">Asia/Tashkent</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Booking Preferences matching General Settings Mockup */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Booking Preferences</h3>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Auto-approve bookings</span>
                      <button
                        type="button"
                        onClick={() => setAutoApprove(!autoApprove)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoApprove ? "bg-orange-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoApprove ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Require prepayment for parties 6+</span>
                      <button
                        type="button"
                        onClick={() => setRequirePrepayment(!requirePrepayment)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          requirePrepayment ? "bg-orange-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            requirePrepayment ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        Default booking duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={defaultDuration}
                        onChange={(e) => setDefaultDuration(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        Cancellation window (hours)
                      </label>
                      <input
                        type="number"
                        value={cancellationWindow}
                        onChange={(e) => setCancellationWindow(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Buttons matching General Settings Mockup */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-2xl bg-orange-500 px-8 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {activeSubnav === "integrations" && (
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <h3 className="text-base font-black text-slate-900">Integrations</h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { name: "Payme Gateway", status: "Connected", desc: "Process card payments via Payme" },
                    { name: "Click Gateway", status: "Connected", desc: "Process payments via Click.uz" },
                    { name: "Google Calendar", status: "Connected", desc: "Sync bookings with Google Calendar" },
                    { name: "Telegram Bot", status: "Connected", desc: "Receive instant Telegram alerts" },
                  ].map((integ) => (
                    <div key={integ.name} className="flex items-center justify-between p-5 rounded-3xl border border-slate-200 bg-slate-50/50">
                      <div>
                        <p className="text-sm font-black text-slate-900">{integ.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{integ.desc}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-black text-emerald-600">
                        {integ.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubnav === "danger" && (
              <div className="rounded-[2.5rem] border border-red-200 bg-red-50/30 p-8 shadow-sm space-y-6">
                <h3 className="text-base font-black text-red-600">Danger Zone</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-red-200">
                    <div>
                      <p className="text-xs font-black text-slate-900">Deactivate Restaurant Profile</p>
                      <p className="text-[11px] text-slate-500">Temporarily hide your restaurant from public search</p>
                    </div>
                    <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                      Deactivate
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-red-200">
                    <div>
                      <p className="text-xs font-black text-slate-900">Delete Restaurant Account</p>
                      <p className="text-[11px] text-slate-500">Permanently delete all bookings, menu, and financial data</p>
                    </div>
                    <button className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md shadow-red-600/20">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}