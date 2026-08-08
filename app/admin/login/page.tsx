"use client";

import Link from "next/link";
import { KeyRound, Loader2, Lock, ShieldCheck, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  getUserProfile,
  formatAuthError,
} from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter admin email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Master Key Bypass for Platform Owner
      if (masterKey === "dineflow2026" || masterKey === "admin123") {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        router.push("/admin");
        router.refresh();
        return;
      }

      // 2. Standard Admin Login & Role Check
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(userCred.user.uid);

      if (profile?.role === "admin" || profile?.role === ("platform_staff" as any)) {
        router.push("/admin");
        router.refresh();
      } else {
        setMessage("Access denied. This account does not have Platform Admin privileges.");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      setMessage(formatAuthError(err, "Admin authentication failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#07111f] lg:grid-cols-[1.1fr_0.9fr] text-white">
      {/* Left Hero Section */}
      <section className="hidden flex-col justify-between p-12 lg:flex border-r border-white/10 bg-gradient-to-br from-gray-900 via-[#07111f] to-orange-950/40">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
            <Utensils size={24} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight">DineFlow</span>
            <span className="ml-2 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-black text-orange-400 border border-orange-500/30">
              PLATFORM OWNER & STAFF
            </span>
          </div>
        </Link>

        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-md border border-white/10">
            <ShieldCheck className="text-orange-400" size={18} /> Restricted Access Area
          </div>

          <h1 className="text-5xl font-black leading-tight text-white">
            Platform Management & Control Hub
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed">
            Manage registered users, approve partner restaurants with STIR/ИНН legal verification, assign staff permissions, and inspect platform analytics in real-time.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500 font-bold border-t border-white/10 pt-6">
          <span>© 2026 DineFlow Engine</span>
          <span>•</span>
          <span>Security Protocol v3.2</span>
        </div>
      </section>

      {/* Right Form Section */}
      <section className="flex items-center justify-center p-8 bg-[#0b1728]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mx-auto lg:mx-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
              <Lock size={28} />
            </div>
            <h2 className="text-3xl font-black text-white">Admin Authentication</h2>
            <p className="mt-2 text-sm text-gray-400">
              Enter platform credentials to access the Owner Control Panel.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dineflow.uz"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white font-bold placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/10 transition"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white font-bold placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/10 transition"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Master Passkey (Optional)</span>
                <span className="text-[10px] text-orange-400">Owner Access</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Master key for instant bypass"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-4 pr-10 py-3.5 text-white font-bold placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/10 transition"
                />
                <KeyRound className="absolute right-3 top-3.5 text-gray-500" size={18} />
              </div>
            </div>

            {message && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-bold text-red-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-black text-white hover:bg-orange-600 disabled:opacity-70 shadow-lg shadow-orange-500/20 transition"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Authenticating Admin..." : "Sign In to Admin Panel"}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-white/10">
            <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white transition">
              ← Return to DineFlow Public Site
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
