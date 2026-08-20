"use client";

import Link from "next/link";
import { Building2, Loader2, User, Utensils, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  getUserProfile,
  createUserProfile,
  formatAuthError,
} from "@/lib/firebase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FirebaseConfigNotice from "@/components/FirebaseConfigNotice";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  function handleOpenResetModal() {
    setResetEmail(email.trim());
    setResetMessage("");
    setResetSuccess(false);
    setShowResetModal(true);
  }

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    setResetMessage("");
    setResetSuccess(false);

    const targetEmail = resetEmail.trim();

    if (!targetEmail) {
      setResetMessage(t.enterEmailForReset);
      return;
    }

    setIsResetLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const actionCodeSettings = {
        url: `${origin}/login`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, targetEmail, actionCodeSettings);

      setResetSuccess(true);
      setResetMessage(
        `If ${targetEmail} belongs to a DineFlow account, a password reset link is on its way. Check your inbox and spam folder.`
      );
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err?.code === "auth/user-not-found") {
        setResetSuccess(true);
        setResetMessage(
          `If ${targetEmail} belongs to a DineFlow account, a password reset link is on its way. Check your inbox and spam folder.`
        );
      } else {
        setResetSuccess(false);
        setResetMessage(formatAuthError(err, t.invalidEmailError));
      }
    } finally {
      setIsResetLoading(false);
    }
  }

  async function routeUserByRole(uid: string) {
    try {
      const profile = await getUserProfile(uid);

      if (profile?.role === "partner") {
        router.push("/partner");
      } else if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
      router.refresh();
    } catch (err) {
      console.error("Route user error:", err);
      router.push("/user");
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage(t.invalidEmailError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      await routeUserByRole(res.user.uid);
    } catch (err: any) {
      console.error("Login error:", err);
      setMessage(formatAuthError(err, t.invalidEmailError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      let profile = await getUserProfile(res.user.uid);

      if (!profile) {
        profile = await createUserProfile(res.user.uid, {
          email: res.user.email || "",
          full_name: res.user.displayName || "User",
          role: "customer",
        });
      }

      await routeUserByRole(res.user.uid);
    } catch (err: any) {
      console.error("Google login error:", err);
      setMessage(formatAuthError(err, t.invalidEmailError));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf5] flex flex-col justify-between">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={18} />
            </div>
            <span className="text-xl font-black text-gray-950">DineFlow</span>
          </Link>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-orange-100 bg-white p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-950">{t.login}</h1>
            <p className="text-sm text-gray-500">Access your DineFlow account</p>
          </div>

          <FirebaseConfigNotice />

          {message && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
              {message}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 font-bold text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-gray-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 font-bold text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50 transition"
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? "Logging in..." : t.login}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 font-bold text-gray-800 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition"
            >
              {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Don't have an account?{" "}
            <Link href="/register/customer" className="font-bold text-orange-600 hover:underline">
              {t.customerSignUp}
            </Link>{" "}
            or{" "}
            <Link href="/register/partner" className="font-bold text-orange-600 hover:underline">
              {t.partnerSignUp}
            </Link>
          </p>
        </div>
      </main>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">{t.resetPasswordTitle}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetMessage("");
                  setResetSuccess(false);
                }}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              {t.resetPasswordDesc}
            </p>

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 font-bold text-gray-900 outline-none focus:border-orange-500"
                />
              </div>

              {resetMessage && (
                <div
                  className={`rounded-2xl p-4 text-xs font-bold leading-relaxed ${
                    resetSuccess
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {resetMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-2xl bg-gray-100 px-5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50 transition"
                >
                  {isResetLoading && <Loader2 className="animate-spin" size={16} />}
                  {isResetLoading ? t.sendingResetLink : t.sendResetLink}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}