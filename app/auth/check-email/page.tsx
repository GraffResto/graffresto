"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, MailCheck, RefreshCw, Utensils } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { auth, sendEmailVerification, formatAuthError } from "@/lib/firebase";

const checkEmailText = {
  en: {
    title: "Verify Your Email Address",
    subtitle: "We sent a confirmation link to your email inbox. Open it to activate your account.",
    instructions:
      "Click the link in the email, then come back here and continue. If you cannot find it, check your spam folder or send the link again.",
    continueButton: "I verified — continue",
    checking: "Checking...",
    resendButton: "Resend link",
    successMsg: "Email verified successfully! Redirecting...",
    notVerifiedMsg: "This email is not confirmed yet. Open the link we sent, then try again.",
    resentMsg: "A fresh verification link is on its way to your inbox.",
    noSessionMsg: "Your session expired. Please log in again to resend the verification link.",
    login: "Back to Login",
    home: "Back to Home",
  },
  uz: {
    title: "Emailingizni tasdiqlang",
    subtitle: "Email inbox'ingizga tasdiqlash havolasini yubordik. Akkauntni faollashtirish uchun uni oching.",
    instructions:
      "Emaildagi havolani bosing, so'ng shu sahifaga qaytib davom eting. Xat ko'rinmasa, spam papkasini tekshiring yoki havolani qayta yuboring.",
    continueButton: "Tasdiqladim — davom etish",
    checking: "Tekshirilmoqda...",
    resendButton: "Havolani qayta yuborish",
    successMsg: "Email muvaffaqiyatli tasdiqlandi! Yo'naltirilmoqda...",
    notVerifiedMsg: "Email hali tasdiqlanmagan. Yuborilgan havolani oching va qayta urinib ko'ring.",
    resentMsg: "Yangi tasdiqlash havolasi emailingizga yuborildi.",
    noSessionMsg: "Sessiya tugadi. Havolani qayta yuborish uchun qaytadan kiring.",
    login: "Login sahifasiga o'tish",
    home: "Bosh sahifaga qaytish",
  },
  ru: {
    title: "Подтвердите ваш Email",
    subtitle: "Мы отправили ссылку подтверждения на вашу почту. Откройте её, чтобы активировать аккаунт.",
    instructions:
      "Перейдите по ссылке из письма, затем вернитесь сюда и продолжите. Если письма нет, проверьте папку спам или отправьте ссылку повторно.",
    continueButton: "Я подтвердил — продолжить",
    checking: "Проверка...",
    resendButton: "Отправить ссылку повторно",
    successMsg: "Email успешно подтвержден! Перенаправление...",
    notVerifiedMsg: "Email ещё не подтверждён. Откройте отправленную ссылку и попробуйте снова.",
    resentMsg: "Новая ссылка подтверждения отправлена на вашу почту.",
    noSessionMsg: "Сессия истекла. Войдите снова, чтобы отправить ссылку повторно.",
    login: "Вернуться к входу",
    home: "Назад на главную",
  },
};

// Only in-app destinations are accepted, so the redirect cannot be pointed at
// an external site through the query string.
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/user";
  }
  return value;
}

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const text = checkEmailText[language];

  const emailParam = searchParams.get("email") || "";
  const nextParam = safeNextPath(searchParams.get("next"));

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Verification is owned by Firebase: we re-read the account and trust only
  // its emailVerified flag. There is no client-side code to guess or bypass.
  async function handleContinue() {
    setMessage("");
    setLoading(true);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setIsSuccess(false);
        setMessage(text.noSessionMsg);
        return;
      }

      await currentUser.reload();

      if (auth.currentUser?.emailVerified) {
        setIsSuccess(true);
        setMessage(text.successMsg);
        router.push(nextParam);
        router.refresh();
      } else {
        setIsSuccess(false);
        setMessage(text.notVerifiedMsg);
      }
    } catch (err: any) {
      console.error("Verification check error:", err);
      setIsSuccess(false);
      setMessage(formatAuthError(err, text.notVerifiedMsg));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    setResending(true);
    setMessage("");

    try {
      if (!auth.currentUser) {
        setIsSuccess(false);
        setMessage(text.noSessionMsg);
        return;
      }

      await sendEmailVerification(auth.currentUser);
      setIsSuccess(true);
      setMessage(text.resentMsg);
    } catch (err: any) {
      console.error("Resend error:", err);
      setIsSuccess(false);
      setMessage(formatAuthError(err, "Could not send the verification email. Please try again shortly."));
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

      <p className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-xs font-medium leading-relaxed text-gray-700">
        {text.instructions}
      </p>

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
          type="button"
          onClick={handleContinue}
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
          {loading ? text.checking : text.continueButton}
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
