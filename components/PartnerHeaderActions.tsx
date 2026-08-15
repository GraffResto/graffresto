"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { usePartnerRestaurant } from "@/components/usePartnerRestaurant";

/**
 * Notification bell and owner avatar shown in every partner header. Both were
 * previously hardcoded ("3" pending, "A" avatar) on each page; these reflect
 * the signed-in owner's real restaurant and pending bookings.
 */
export default function PartnerHeaderActions() {
  const { restaurantName, pendingCount } = usePartnerRestaurant();
  const initial = restaurantName.trim().charAt(0).toUpperCase() || "R";

  return (
    <>
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
    </>
  );
}
