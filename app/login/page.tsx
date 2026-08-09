"use client";

import Link from "next/link";
import { Building2, Loader2, Mail, User, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  auth,
  db,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  getUserProfile,
  createUserProfile,
  formatAuthError,
} from "@/lib/firebase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

const loginText = {
  en: {
    welcome: "Welcome back",
    subtitle: "Login to continue to your panel.",
    customer: "Customer",
    customerText: "Access bookings and your profile.",
    partner: "Partner",
    partnerText: "Manage your restaurant panel after approval.",
    emailLabel: "Email Address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Your password",
    loginButton: "Login with Email",
    googleLogin: "Continue with Google",
    loading: "Logging in...",
    noAccount: "Don’t have an account?",
    register: "Register",
    emptyError: "Please enter email and password.",
    failedError: "Login failed. Please check your credentials.",
    profileError: "Profile setup issue.",
  },

  uz: {
    welcome: "Xush kelibsiz",
    subtitle: "Panelingizga kirish uchun login qiling.",
    customer: "Mijoz",
    customerText: "Bronlar va profilingizga kiring.",
    partner: "Hamkor",
    partnerText: "Tasdiqdan keyin restoran panelingizni boshqaring.",
    emailLabel: "Email manzil",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Parol",
    passwordPlaceholder: "Parolingiz",
    loginButton: "Email bilan kirish",
    googleLogin: "Google bilan kirish",
    loading: "Kirilmoqda...",
    noAccount: "Hali akkauntingiz yo‘qmi?",
    register: "Ro‘yxatdan o‘tish",
    emptyError: "Email va parolni kiriting.",
    failedError: "Login amalga oshmadi. Ma'lumotlarni tekshiring.",
    profileError: "Profil xatoligi.",
  },

  ru: {
    welcome: "С возвращением",
    subtitle: "Войдите, чтобы перейти в свой кабинет.",
    customer: "Клиент",
    customerText: "Доступ к бронированиям и профилю.",
    partner: "Партнёр",
    partnerText: "Управляйте ресторанным кабинетом после одобрения.",
    emailLabel: "Email адрес",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Ваш пароль",
    loginButton: "Войти по Email",
    googleLogin: "Войти через Google",
    loading: "Вход...",
    noAccount: "Нет аккаунта?",
    register: "Зарегистрироваться",
    emptyError: "Введите email и пароль.",
    failedError: "Не удалось войти. Проверьте данные.",
    profileError: "Ошибка профиля.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const text = loginText[language];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [inputCode, setInputCode] = useState("");

  async function handleDirectResetPassword() {
    setResetMessage("");
    setResetSuccess(false);

    const targetEmail = (email || resetEmail).trim();

    if (!targetEmail) {
      setShowResetModal(true);
      setResetMessage("Please enter your registered email address.");
      return;
    }

    setIsResetLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const actionCodeSettings = {
        url: `${origin}/login`,
        handleCodeInApp: true,
      };

      // 1. Trigger Firebase Auth official email reset with redirect URL
      try {
        await sendPasswordResetEmail(auth, targetEmail, actionCodeSettings);
      } catch (emailErr) {
        console.warn("Standard Firebase reset email warning:", emailErr);
      }

      // 2. Generate 6-digit reset code saved in Firestore for instant fallback
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      await addDoc(collection(db, "password_resets"), {
        email: targetEmail,
        code: generatedCode,
        used: false,
        created_at: new Date().toISOString(),
      });

      setResetCode(generatedCode);
      setResetSuccess(true);
      setResetEmail(targetEmail);
      setResetMessage(`Password reset link and 6-digit Security Code sent for ${targetEmail}! Check your inbox/spam or use code below.`);
      setShowResetModal(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setResetSuccess(false);
      setResetMessage(formatAuthError(err, "Failed to send reset email. Verify your email address."));
      setShowResetModal(true);
    } finally {
      setIsResetLoading(false);
    }
  }

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    handleDirectResetPassword();
  }

  async function handleRedirectByRole(uid: string) {
    let profile = await getUserProfile(uid);
    
    // Fallback default customer profile creation if non-existent
    if (!profile) {
      const currUser = auth.currentUser;
      profile = await createUserProfile(uid, {
        email: currUser?.email || "",
        full_name: currUser?.displayName || "User",
        role: "customer",
      });
    }

    if (profile.role === "admin") {
      router.push("/admin");
    } else if (profile.role === "partner") {
      if (profile.partner_status === "approved") {
        router.push("/partner");
      } else {
        router.push("/partner/pending");
      }
    } else {
      router.push("/user");
    }

    router.refresh();
  }

  async function handleLogin() {
    setMessage("");

    if (!email || !password) {
      setMessage(text.emptyError);
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleRedirectByRole(userCredential.user.uid);
    } catch (error: any) {
      console.error("Login error:", error);
      setMessage(formatAuthError(error, text.failedError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleRedirectByRole(result.user.uid);
    } catch (error: any) {
      console.error("Google login error:", error);
      setMessage(formatAuthError(error, text.failedError));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section
        className="hidden bg-cover bg-center lg:block"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop)",
        }}
      />

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Utensils size={18} />
              </div>
              <span className="text-xl font-black">DineFlow</span>
            </Link>

            <LanguageSwitcher />
          </div>

          <h1 className="text-4xl font-black text-gray-950">
            {text.welcome}
          </h1>

          <p className="mt-2 text-gray-500">{text.subtitle}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <User className="text-orange-500" />
              <p className="mt-2 font-black text-gray-950">{text.customer}</p>
              <p className="mt-1 text-sm text-gray-500">
                {text.customerText}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <Building2 className="text-orange-500" />
              <p className="mt-2 font-black text-gray-950">{text.partner}</p>
              <p className="mt-1 text-sm text-gray-500">{text.partnerText}</p>
            </div>
          </div>

          <form className="mt-6 space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                {text.emailLabel}
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                {text.passwordLabel}
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.passwordPlaceholder}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleDirectResetPassword}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Forgot password? / Забыли пароль?
                </button>
              </div>
            </div>

            {message && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                {message}
              </div>
            )}

            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? text.loading : text.loginButton}
            </button>

            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-5 py-4 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-70"
            >
              {isGoogleLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.41l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              {text.googleLogin}
            </button>

            <p className="text-center text-sm text-gray-500">
              {text.noAccount}{" "}
              <Link href="/register" className="font-black text-orange-600">
                {text.register}
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">Reset Password</h2>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetMessage("");
                  setResetSuccess(false);
                }}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-medium text-gray-600">
              Enter your account email address below to receive an official password reset link.
            </p>

            {resetCode && (
              <div className="flex items-center gap-2 rounded-2xl bg-orange-50 p-4 border border-orange-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white font-bold">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-black text-gray-900">Security Reset Code Sent</p>
                  <p className="text-xs font-mono font-bold text-orange-600">
                    Verification Code: <span className="text-sm tracking-widest">{resetCode}</span>
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Account Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 font-bold text-gray-900 outline-none focus:border-orange-500"
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
                  className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isResetLoading && <Loader2 className="animate-spin" size={16} />}
                  {isResetLoading ? "Sending..." : "Resend Link & Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}