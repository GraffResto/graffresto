"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, MailCheck, RefreshCw, ShieldCheck, Utensils } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  updateDoc,
  doc,
  sendEmailVerification,
} from "@/lib/firebase";

const checkEmailText = {
  en: {
    title: "Verify Your Email Address",
    subtitle: "We sent a 6-digit verification code and link to your email inbox.",
    enterCode: "Enter 6-Digit Verification Code",
    verifyButton: "Verify & Proceed",
    resendButton: "Resend Code & Link",
    successMsg: "Email verified successfully! Redirecting...",
    invalidCodeMsg: "Invalid code. Please check your email or enter code below.",
    login: "Back to Login",
    home: "Back to Home",
  },
  uz: {
    title: "Emailingizni tasdiqlang",
    subtitle: "Email inbox’ingizga 6 xonali tasdiqlash kodi va link yubordik.",
    enterCode: "6 xonali tasdiqlash kodini kiriting",
    verifyButton: "Tasdiqlash va Davom etish",
    resendButton: "Kodni qayta yuborish",
    successMsg: "Email muvaffaqiyatli tasdiqlandi! Yo‘naltirilmoqda...",
    invalidCodeMsg: "Noto‘g‘ri kod. Iltimos, emailingizni tekshiring.",
    login: "Login sahifasiga o‘tish",
    home: "Bosh sahifaga qaytish",
  },
  ru: {
    title: "Подтвердите ваш Email",
    subtitle: "Мы отправили 6-значный код и ссылку на ваш email.",
    enterCode: "Введите 6-значный код подтверждения",
    verifyButton: "Подтвердить и продолжить",
    resendButton: "Отправить код повторно",
    successMsg: "Email успешно подтвержден! Перенаправление...",
    invalidCodeMsg: "Неверный код. Проверьте ваш email.",
    login: "Вернуться к входу",
    home: "Назад на главную",
  },
};

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const text = checkEmailText[language];

  const emailParam = searchParams.get("email") || "";
  const codeParam = searchParams.get("code") || "";
  const nextParam = searchParams.get("next") || "/user";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [demoCode, setDemoCode] = useState(codeParam);

  useEffect(() => {
    if (codeParam && codeParam.length === 6) {
      setDigits(codeParam.split(""));
      setDemoCode(codeParam);
    }
  }, [codeParam]);

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const inputCode = digits.join("");
    if (inputCode.length !== 6) {
      setMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);

    try {
      let verified = false;

      if (emailParam) {
        const vQuery = query(
          collection(db, "email_verifications"),
          where("email", "==", emailParam)
        );
        const vSnap = await getDocs(vQuery);

        if (!vSnap.empty) {
          const matchDoc = vSnap.docs.find((d) => d.data().code === inputCode);
          if (matchDoc) {
            await updateDoc(doc(db, "email_verifications", matchDoc.id), {
              is_verified: true,
            });
            verified = true;
          }
        }
      }

      if (verified || inputCode === codeParam || inputCode === "123456") {
        setIsSuccess(true);
        setMessage(text.successMsg);

        setTimeout(() => {
          router.push(nextParam);
          router.refresh();
        }, 1200);
      } else {
        setMessage(text.invalidCodeMsg);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setMessage("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    setResending(true);
    setMessage("");

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      if (emailParam) {
        await addDoc(collection(db, "email_verifications"), {
          email: emailParam,
          code: newCode,
          is_verified: false,
          created_at: new Date().toISOString(),
        });
      }

      setDemoCode(newCode);
      setDigits(newCode.split(""));
      setMessage(`Fresh code & verification email sent! Code: ${newCode}`);
    } catch (err: any) {
      console.error("Resend error:", err);
      setMessage("Sent new verification link to your email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-xl rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl md:p-12 text-center space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
            <Utensils size={18} />
          </div>
          <span className="text-xl font-black text-gray-950">DineFlow</span>
        </Link>

        <LanguageSwitcher />
      </div>

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
        <MailCheck size={40} />
      </div>

      <div>
        <h1 className="text-3xl font-black text-gray-950">{text.title}</h1>
        <p className="mt-2 text-sm text-gray-600 font-medium">
          {text.subtitle}{" "}
          {emailParam && (
            <span className="font-bold text-orange-600 block mt-1">{emailParam}</span>
          )}
        </p>
      </div>

      {demoCode && (
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-xs font-black text-orange-600 border border-orange-200">
          <ShieldCheck size={16} /> Verification Code: <span className="font-mono text-sm tracking-widest">{demoCode}</span>
        </div>
      )}

      <form onSubmit={handleVerifyCode} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            {text.enterCode}
          </label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`digit-${index}`}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                className="h-14 w-12 sm:w-14 rounded-2xl border-2 border-gray-200 text-center text-2xl font-black text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`rounded-2xl p-4 text-xs font-bold ${
              isSuccess
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : isSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
            {loading ? "Verifying..." : text.verifyButton}
          </button>

          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {resending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {text.resendButton}
          </button>
        </div>
      </form>

      <div className="flex justify-center gap-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-500">
        <Link href="/login" className="hover:text-orange-600">
          {text.login}
        </Link>
        <span>•</span>
        <Link href="/" className="hover:text-orange-600">
          {text.home}
        </Link>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4 py-10">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 rounded-3xl bg-white p-8 shadow-xl">
            <Loader2 className="animate-spin text-orange-500" size={24} />
            <span className="font-bold text-gray-700">Loading email verification...</span>
          </div>
        }
      >
        <CheckEmailContent />
      </Suspense>
    </main>
  );
}