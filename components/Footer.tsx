"use client";

import Link from "next/link";
import { Utensils, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-800 bg-[#060c14] text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30">
                <Utensils size={20} />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">DineFlow</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footerDesc}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">
              {t.quickLinks}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition">
                  {t.navHome}
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">
                  {t.navHowItWorks}
                </a>
              </li>
              <li>
                <a href="#restaurants" className="hover:text-white transition">
                  {t.navRestaurants}
                </a>
              </li>
              <li>
                <a href="#customers" className="hover:text-white transition">
                  {t.navCustomers}
                </a>
              </li>
              <li>
                <a href="#partners" className="hover:text-white transition">
                  {t.navPartners}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">
              {t.contactUs}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-orange-500" />
                <span>support@dineflow.app</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-orange-500" />
                <span>+998 71 200 00 00</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-orange-500" />
                <span>Tashkent, Uzbekistan</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">
              {t.legal}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#" className="hover:text-white transition">
                  {t.privacyPolicy}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  {t.termsOfService}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800/80 pt-6 text-center text-xs font-medium text-slate-500">
          © {new Date().getFullYear()} DineFlow Inc. {t.allRightsReserved}
        </div>
      </div>
    </footer>
  );
}
