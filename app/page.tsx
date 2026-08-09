"use client";

import { useEffect, useState } from "react";
import LandingContent from "@/components/LandingContent";
import { db, collection, query, where, getDocs } from "@/lib/firebase";

type RestaurantPreview = {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number;
  price: string;
  status: string;
  image: string;
};

export default function HomePage() {
  const [restaurantList, setRestaurantList] = useState<RestaurantPreview[]>([]);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const q = query(
          collection(db, "restaurants"),
          where("approval_status", "==", "approved")
        );
        const snap = await getDocs(q);

        const list: RestaurantPreview[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || "Restaurant",
            type: data.cuisine_type || "Restaurant",
            location: data.city || "Tashkent",
            rating: data.rating || 4.8,
            price: data.price || "$$",
            status: data.is_open ? "Open" : "Closed",
            image:
              data.image_url ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
          };
        });

        setRestaurantList(list);
      } catch (error) {
        console.error("Home page restaurants error:", error);
      }
    }

    loadRestaurants();
  }, []);

  return <LandingContent restaurantList={restaurantList} />;
}