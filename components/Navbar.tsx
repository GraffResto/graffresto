"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

export default function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) {
    if (pathname === "/") {
      e.preventDefault();
      const elem = document.getElementById(sectionId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Utensils size={18} />
          </div>
          <span className="text-xl font-black text-gray-950">DineFlow</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-bold text-gray-700 md:flex">
          <Link href="/" className="hover:text-orange-600 transition">
            {t.navHome}
          </Link>

          <a
            href="/#how-it-works"
            onClick={(e) => handleAnchorClick(e, "how-it-works")}
            className="hover:text-orange-600 transition cursor-pointer"
          >
            {t.navHowItWorks}
          </a>

          <a
            href="/#customers"
            onClick={(e) => handleAnchorClick(e, "customers")}
            className="hover:text-orange-600 transition cursor-pointer"
          >
            {t.navCustomers}
          </a>

          <a
            href="/#partners"
            onClick={(e) => handleAnchorClick(e, "partners")}
            className="hover:text-orange-600 transition cursor-pointer"
          >
            {t.navPartners}
          </a>

          <a
            href="/#restaurants"
            onClick={(e) => handleAnchorClick(e, "restaurants")}
            className="hover:text-orange-600 transition cursor-pointer"
          >
            {t.navRestaurants}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/login"
            className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-orange-50 transition md:block"
          >
            {t.login}
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition"
          >
            {t.getStarted}
          </Link>
        </div>
      </nav>
    </header>
  );
}