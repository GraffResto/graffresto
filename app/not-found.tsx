"use client";

import Link from "next/link";
import { Utensils, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#060c14] px-6 text-center text-white">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-2xl">
          <Utensils size={40} />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-orange-400 border border-orange-500/30">
            404 • Page Not Found
          </span>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            Lost Your Table?
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The page or restaurant space you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-xs font-black text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition"
          >
            <Home size={16} /> Return to Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            <ArrowLeft size={16} /> Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
