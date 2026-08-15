"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { getIdToken, User } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Public routes accessible without authentication.
// /admin is deliberately NOT here: only its login screen is reachable signed out.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth/check-email",
  "/admin/login",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Check if current route is protected
      const isPublic = PUBLIC_PATHS.some((path) =>
        path === "/" ? pathname === "/" : pathname?.startsWith(path)
      );

      if (!currentUser && !isPublic) {
        // Send unauthenticated visitors to the sign-in screen for the area
        // they tried to reach, so admins do not land on the customer login.
        router.push(pathname?.startsWith("/admin") ? "/admin/login" : "/login");
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Silent Background Token Refresh (Runs every 5 minutes / 300,000 ms)
  useEffect(() => {
    if (!user) return;

    const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    const intervalId = setInterval(async () => {
      try {
        if (auth.currentUser) {
          // Force silent refresh of access token
          await getIdToken(auth.currentUser, true);
        }
      } catch (err) {
        console.warn("Silent background token refresh notice:", err);
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
