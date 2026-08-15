"use client";

import { AlertTriangle } from "lucide-react";
import { isUsingFallbackFirebaseConfig } from "@/lib/firebase";

/**
 * Shown on the sign-in screens when no Firebase config has been supplied.
 * Without it, every login fails with a raw "api-key-not-valid" error that
 * looks like a wrong password.
 */
export default function FirebaseConfigNotice({ dark = false }: { dark?: boolean }) {
  if (!isUsingFallbackFirebaseConfig) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 text-xs font-bold leading-relaxed ${
        dark
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
      <span>
        Firebase is not configured, so sign-in and registration cannot work yet. Copy{" "}
        <code className="font-mono">.env.example</code> to{" "}
        <code className="font-mono">.env.local</code>, paste your Firebase web config, and
        restart the dev server.
      </span>
    </div>
  );
}
