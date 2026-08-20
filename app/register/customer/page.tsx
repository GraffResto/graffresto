"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Phone, User, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  auth,
  db,
  doc,
  setDoc,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  createUserProfile,
  formatAuthError,
} from "@/lib/firebase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FirebaseConfigNotice from "@/components/FirebaseConfigNotice";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { isValidPhoneNumber } from "@/lib/translations";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!fullName || !email || !password) {
      setMessage("Please fill in full name, email and password.");
      return;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      setMessage(t.invalidPhoneError);
      return;
    }

    if (password.length < 6) {
      setMessage(t.weakPasswordError);
      return;
    }

    setIsLoading(true);

    try {
      let uid = "";
      try {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uid = res.user.uid;
      } catch (signUpErr: any) {
        if (signUpErr?.code === "auth/email-already-in-use") {
          const signInRes = await signInWithEmailAndPassword(auth, email.trim(), password);
          uid = signInRes.user.uid;
        } else {
          throw signUpErr;
        }
      }

      await createUserProfile(uid, {
        email: email.trim(),
        full_name: fullName,
        phone,
        role: "customer",
      });

      try {
        await setDoc(doc(db, "users", uid), {
          uid,
          email: email.trim(),
          full_name: fullName,
          phone,
          role: "customer",
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Secondary users collection sync notice:", e);
      }

      if (auth.currentUser) {
        try {
          await sendEmailVerification(auth.currentUser);
        } catch (e) {
          console.warn("Email verification send warning:", e);
        }
      }

      router.push(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
      router.refresh();
    } catch (error: any) {
      console.error("Registration error:", error);
      setMessage(formatAuthError(error, "Registration failed."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      await createUserProfile(res.user.uid, {
        email: res.user.email || "",
        full_name: res.user.displayName || "Customer",
        role: "customer",
      });

      router.push("/user");
      router.refresh();
    } catch (error: any) {
      console.error("Google registration error:", error);
      setMessage(formatAuthError(error, "Google registration failed."));
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
            <h1 className="text-3xl font-black text-gray-950">{t.customerSignUp}</h1>
            <p className="text-sm text-gray-500">Create your DineFlow customer account</p>
          </div>

          <FirebaseConfigNotice />

          {message && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 font-bold text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 font-bold text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

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
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                Password
              </label>
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
              {isLoading ? "Creating Account..." : t.customerSignUp}
            </button>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isGoogleLoading}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 font-bold text-gray-800 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition"
            >
              {isGoogleLoading ? "Connecting..." : "Sign Up with Google"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-orange-600 hover:underline">
              {t.login}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}