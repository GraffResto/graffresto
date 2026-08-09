"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
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
  doc,
  updateDoc,
  onAuthStateChanged,
  signOut,
  getUserProfile,
  sendPasswordResetEmail,
} from "@/lib/firebase";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  // Profile Form States
  const [uid, setUid] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Tashkent");
  const [address, setAddress] = useState("");

  // Loyalty & Stats
  const [points, setPoints] = useState(120);
  const [tier, setTier] = useState("Bronze");
  const [docId, setDocId] = useState("");
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
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setFullName(profile.full_name || user.displayName || "Customer");
          setPhone(profile.phone || "");
          setDocId((profile as any).id || user.uid);
        } else {
          setFullName(user.displayName || "Customer");
        }
      } catch (err) {
        console.error("Error loading customer profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      if (docId) {
        await updateDoc(doc(db, "profiles", docId), {
          full_name: fullName,
          phone,
          city,
          address,
        });
      }
      setMessageType("success");
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setMessageType("error");
      setMessage("Failed to save profile changes.");
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex items-center gap-3 rounded-3xl bg-white p-8 shadow-xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-700">Loading Customer Profile...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20 text-gray-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/user"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition"
          >
            <ArrowLeft size={18} /> Back to Portal
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Profile Container */}
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Header Identity Card */}
        <div className="rounded-[2.5rem] bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-8 text-white shadow-xl shadow-orange-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-white font-black text-3xl shadow-inner border border-white/30 backdrop-blur-md">
              {fullName.charAt(0) || "C"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{fullName}</h1>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-black uppercase text-amber-200 border border-white/30">
                  Customer
                </span>
              </div>
              <p className="text-sm font-medium text-orange-100">{email}</p>
              <p className="text-xs font-mono text-orange-200">ID: {uid.slice(0, 12)}...</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/20 flex items-center gap-4">
            <Award size={32} className="text-amber-300" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-200">Loyalty Tier</p>
              <p className="text-lg font-black text-white">{tier} Member ({points} pts)</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2 ${
              messageType === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <User className="text-orange-500" size={24} />
            <div>
              <h2 className="text-xl font-black text-gray-900">Personal Account Details</h2>
              <p className="text-xs font-medium text-gray-500">
                Update your contact information for table reservations.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Preferred City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                Default Delivery / Address Note
              </label>
              <input
                type="text"
                placeholder="Amir Temur Street, House 15, Tashkent"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSendResetPassword}
                disabled={resetSending}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {resetSending ? <Loader2 className="animate-spin" size={14} /> : <KeyRound size={14} />}
                Reset Password Link
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
