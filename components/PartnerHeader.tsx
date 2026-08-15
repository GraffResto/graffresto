"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Bell } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePartnerRestaurant } from "@/components/usePartnerRestaurant";

type PartnerHeaderProps = {
  title: string;
  subtitle?: string;
  /** Page-specific controls rendered to the left of the language switcher. */
  actions?: ReactNode;
};

/**
 * Top bar for the partner panel. The notification badge counts real pending
 * bookings and the avatar uses the restaurant's own initial.
 */
export default function PartnerHeader({ title, subtitle, actions }: PartnerHeaderProps) {
  const { restaurantName, pendingCount } = usePartnerRestaurant();
  const initial = restaurantName.trim().charAt(0).toUpperCase() || "R";

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}

        <LanguageSwitcher />

        <Link
          href="/partner/bookings"
          aria-label={
            pendingCount > 0
              ? `${pendingCount} bookings awaiting your decision`
              : "No bookings awaiting your decision"
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
              {pendingCount}
            </span>
          )}
        </Link>

        <Link
          href="/partner/profile"
          title={restaurantName || "Your restaurant"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-500/20 hover:scale-105 transition"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
