"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
  Utensils,
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
  updateDoc,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from "@/lib/firebase";

type PartnerProfile = {
  id?: string;
  email: string;
  full_name: string;
  phone?: string;
  partner_status?: string;
};

type RestaurantDetails = {
  id?: string;
  name: string;
  cuisine_type?: string;
  city?: string;
  address?: string;
  phone?: string;
  stir?: string;
  approval_status?: string;
};

export default function PartnerProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  // States
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [partnerStatus, setPartnerStatus] = useState("approved");

  // Restaurant details
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [city, setCity] = useState("Tashkent");
  const [address, setAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [stir, setStir] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      setEmail(user.email || "");

      try {
        // 1. Fetch Profile
        const pQuery = query(collection(db, "profiles"), where("uid", "==", user.uid));
        const pSnap = await getDocs(pQuery);
        if (!pSnap.empty) {
          const pData = pSnap.docs[0].data() as PartnerProfile;
          setFullName(pData.full_name || user.displayName || "Founder");
          setPhone(pData.phone || "");
          setPartnerStatus(pData.partner_status || "approved");
        } else {
          setFullName(user.displayName || "Founder");
        }

        // 2. Fetch Restaurant
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);
        if (!rSnap.empty) {
          const rDoc = rSnap.docs[0];
          const rData = rDoc.data() as RestaurantDetails;
          setRestaurantId(rDoc.id);
          setRestaurantName(rData.name || "My Restaurant");
          setCuisineType(rData.cuisine_type || "Fine Dining");
          setCity(rData.city || "Tashkent");
          setAddress(rData.address || "");
          setRestaurantPhone(rData.phone || "");
          setStir(rData.stir || "784920194");
        }
      } catch (err) {
        console.error("Error loading partner profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSavePartnerProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      // 1. Update profiles doc
      const pSnap = await getDocs(query(collection(db, "profiles"), where("uid", "==", uid)));
      if (!pSnap.empty) {
        await updateDoc(doc(db, "profiles", pSnap.docs[0].id), {
          full_name: fullName,
          phone,
        });
      }

      // 2. Update restaurant doc if present
      if (restaurantId) {
        await updateDoc(doc(db, "restaurants", restaurantId), {
          name: restaurantName,
          cuisine_type: cuisineType,
          city,
          address,
          phone: restaurantPhone,
          stir,
        });
      }

      setMessageType("success");
      setMessage("Founder and Restaurant profile updated successfully!");
    } catch (err: any) {
      console.error("Error saving partner profile:", err);
      setMessageType("error");
      setMessage("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendResetPassword() {
    setResetSending(true);
    setMessage("");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      await sendPasswordResetEmail(auth, email, { url: `${origin}/login` });
      setMessageType("success");
      setMessage(`Password reset email sent to ${email}! Please check your inbox.`);
    } catch (err: any) {
      console.error("Error sending reset link:", err);
      setMessageType("error");
      setMessage("Failed to send reset link.");
    } finally {
      setResetSending(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-gray-800 border border-white/10 p-8 shadow-xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Founder Profile...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09111e] pb-20 text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09111e]/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/partner"
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} /> Back to Partner Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Founder Hero Card */}
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-gray-900 via-[#0b182b] to-orange-950/60 p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 text-white font-black text-3xl shadow-lg shadow-orange-500/30 border border-orange-400/30">
              {fullName.charAt(0) || "F"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{fullName}</h1>
                <span className="rounded-full bg-orange-500/20 px-3 py-0.5 text-xs font-black text-orange-400 border border-orange-500/30">
                  RESTAURANT OWNER / FOUNDER
                </span>
              </div>
              <p className="text-sm font-medium text-gray-400">{email}</p>
              <p className="text-xs font-mono text-gray-500">UID: {uid.slice(0, 12)}...</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-md border border-white/10 flex items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Partner Status</p>
              <p className="text-sm font-black text-emerald-400 capitalize">{partnerStatus}</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2 ${
              messageType === "success"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* Edit Founder & Restaurant Form */}
        <div className="rounded-[2.5rem] border border-white/10 bg-gray-900/80 p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <Store className="text-orange-400" size={24} />
            <div>
              <h2 className="text-xl font-black text-white">Founder & Restaurant Settings</h2>
              <p className="text-xs font-medium text-gray-400">
                Manage founder contact information and legal restaurant credentials.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePartnerProfile} className="space-y-6">
            {/* Founder Personal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                Founder Personal Info
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Founder Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Founder Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Owner Direct Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Legal Info */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                Restaurant Legal & Contact Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Restaurant Brand Name
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    STIR / ИНН Legal Code
                  </label>
                  <input
                    type="text"
                    value={stir}
                    onChange={(e) => setStir(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-orange-400 font-mono outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Restaurant Phone
                  </label>
                  <input
                    type="text"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                  Full Street Address & City
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Navoi Avenue 24, Tashkent"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleSendResetPassword}
                disabled={resetSending}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-gray-300 hover:bg-white/10 disabled:opacity-50"
              >
                {resetSending ? <Loader2 className="animate-spin" size={14} /> : <KeyRound size={14} />}
                Send Reset Password Link
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving ? "Saving..." : "Save All Profile Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
