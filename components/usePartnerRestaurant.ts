"use client";

import { useEffect, useRef, useState } from "react";
import {
  auth,
  db,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  onAuthStateChanged,
} from "@/lib/firebase";

export type PartnerRestaurant = {
  /** Firestore id of the restaurant this owner runs, null until resolved. */
  restaurantId: string | null;
  restaurantName: string;
  /** Bookings still waiting for the owner's decision. */
  pendingCount: number;
  isLoading: boolean;
  /** True once auth resolved and the owner turned out to have no restaurant. */
  hasNoRestaurant: boolean;
};

/**
 * Resolves the signed-in owner's restaurant and keeps its pending booking
 * count live. Every partner screen needs both, and doing it here keeps the
 * numbers in the shell honest instead of hardcoded.
 */
export function usePartnerRestaurant(): PartnerRestaurant {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoRestaurant, setHasNoRestaurant] = useState(false);

  // An async auth callback cannot return a cleanup to React, so keep it here
  const bookingsListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const detach = () => {
      bookingsListenerRef.current?.();
      bookingsListenerRef.current = null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      detach();

      if (!user) {
        setRestaurantId(null);
        setRestaurantName("");
        setPendingCount(0);
        setIsLoading(false);
        return;
      }

      try {
        const rSnap = await getDocs(
          query(collection(db, "restaurants"), where("owner_id", "==", user.uid))
        );

        if (rSnap.empty) {
          setHasNoRestaurant(true);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        setHasNoRestaurant(false);
        setRestaurantId(rDoc.id);
        setRestaurantName(rDoc.data().name || "Your restaurant");

        bookingsListenerRef.current = onSnapshot(
          query(
            collection(db, "bookings"),
            where("restaurant_id", "==", rDoc.id),
            where("status", "==", "pending")
          ),
          (snap) => setPendingCount(snap.size),
          (err) => console.error("Pending bookings listener error:", err)
        );
      } catch (err) {
        console.error("Partner restaurant lookup error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detach();
    };
  }, []);

  return { restaurantId, restaurantName, pendingCount, isLoading, hasNoRestaurant };
}
