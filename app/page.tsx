"use client";

import { useEffect, useState } from "react";
import LandingContent from "@/components/LandingContent";
import { db, collection, query, where, getDocs } from "@/lib/firebase";

export type RestaurantPreview = {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number | null;
  price: string;
  status: string;
  image: string;
};

export const SAMPLE_RESTAURANTS: RestaurantPreview[] = [
  {
    id: "rest_la_dolce_vita",
    name: "La Dolce Vita",
    type: "Fine Italian Dining",
    location: "Tashkent, Mirabad",
    rating: 4.9,
    price: "$$$",
    status: "Open",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "rest_sakura_lounge",
    name: "Sakura Sushi Lounge",
    type: "Japanese Fusion",
    location: "Tashkent, Yakkasaray",
    rating: 4.8,
    price: "$$$$",
    status: "Open",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "rest_grand_choyhona",
    name: "Grand Choyhona",
    type: "Traditional Uzbek",
    location: "Samarkand, Center",
    rating: 4.9,
    price: "$$",
    status: "Open",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "rest_le_petit_paris",
    name: "Le Petit Paris",
    type: "French Bistro",
    location: "Tashkent, Shaykhantahur",
    rating: 4.7,
    price: "$$$",
    status: "Open",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function HomePage() {
  const [restaurantList, setRestaurantList] = useState<RestaurantPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurants() {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "restaurants"),
          where("approval_status", "==", "approved")
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const list: RestaurantPreview[] = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || "Restaurant",
              type: data.cuisine_type || "Restaurant",
              location: data.city || "Tashkent",
              rating: typeof data.rating === "number" ? data.rating : 4.8,
              price: data.price || "$$",
              status: data.is_open ? "Open" : "Closed",
              image:
                data.image_url ||
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
            };
          });
          setRestaurantList(list);
        } else {
          // If no approved restaurants exist in DB yet, use distinct curated sample restaurants
          setRestaurantList(SAMPLE_RESTAURANTS);
        }
      } catch (error) {
        console.error("Home page restaurants loading error:", error);
        setRestaurantList(SAMPLE_RESTAURANTS);
      } finally {
        setIsLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  return <LandingContent restaurantList={restaurantList} isLoading={isLoading} />;
}