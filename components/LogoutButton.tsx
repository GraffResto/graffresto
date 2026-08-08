"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, signOut } from "@/lib/firebase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}