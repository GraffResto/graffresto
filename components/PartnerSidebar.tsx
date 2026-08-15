"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Calendar,
  ChefHat,
  DollarSign,
  Gift,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Table,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import { auth, signOut } from "@/lib/firebase";
import { usePartnerRestaurant } from "@/components/usePartnerRestaurant";

export type PartnerNavKey =
  | "dashboard"
  | "bookings"
  | "floor-plan"
  | "menu"
  | "analytics"
  | "crm"
  | "promotions"
  | "kitchen"
  | "inventory"
  | "finance"
  | "staff"
  | "settings"
  | "profile";

const PRIMARY_NAV: { key: PartnerNavKey; href: string; label: string; icon: typeof Calendar }[] = [
  { key: "dashboard", href: "/partner", label: "Dashboard", icon: LayoutDashboard },
  { key: "bookings", href: "/partner/bookings", label: "Bookings", icon: Calendar },
  { key: "floor-plan", href: "/partner/floor-plan", label: "Floor Map", icon: Table },
  { key: "menu", href: "/partner/menu", label: "Menu", icon: UtensilsCrossed },
  { key: "analytics", href: "/partner/analytics", label: "Analytics", icon: BarChart3 },
  { key: "crm", href: "/partner/crm", label: "CRM", icon: Users },
  { key: "promotions", href: "/partner/promotions", label: "Promotions", icon: Gift },
];

const ERP_NAV: { key: PartnerNavKey; href: string; label: string; icon: typeof Calendar }[] = [
  { key: "kitchen", href: "/partner/kitchen", label: "Kitchen", icon: ChefHat },
  { key: "inventory", href: "/partner/inventory", label: "Inventory", icon: Boxes },
  { key: "finance", href: "/partner/finance", label: "Finance", icon: DollarSign },
  { key: "staff", href: "/partner/staff", label: "Staff", icon: User },
];

/**
 * The partner panel's left navigation. It used to be copy-pasted into every
 * page, each with a hardcoded "3" badge and an "A" avatar; this version shows
 * the owner's real restaurant and their real pending booking count.
 */
export default function PartnerSidebar({ active }: { active: PartnerNavKey }) {
  const router = useRouter();
  const { restaurantName, pendingCount } = usePartnerRestaurant();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#080e1a] text-white flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
            <Utensils size={20} />
          </div>
          <span className="text-xl font-black tracking-tight text-white">DineFlow</span>
        </div>

        <nav className="space-y-1 text-sm font-semibold">
          {PRIMARY_NAV.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between rounded-xl px-3.5 py-3 transition ${
                  isActive
                    ? "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>

                {item.key === "bookings" && pendingCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800 space-y-1">
          <p className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            ERP Modules
          </p>

          {ERP_NAV.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-orange-500 text-white font-bold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-800">
        <Link
          href="/partner/settings"
          aria-current={active === "settings" ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
            active === "settings"
              ? "bg-orange-500 text-white font-bold"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={16} /> Settings
        </Link>

        <Link
          href="/partner/profile"
          aria-current={active === "profile" ? "page" : undefined}
          className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 p-3 hover:bg-slate-800/80 transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-orange-400 font-bold border border-slate-700">
            <Store size={18} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">
              {restaurantName || "Your restaurant"}
            </p>
            <p className="text-[10px] text-slate-400">Restaurant Owner</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
