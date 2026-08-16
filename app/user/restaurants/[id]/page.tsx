"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Loader2, MapPin, Phone, Star, Utensils } from "lucide-react";
import { use, useEffect, useState } from "react";
import { db, doc, getDoc, collection, query, where, getDocs } from "@/lib/firebase";
import BookingSection from "@/components/BookingSection";
import LogoutButton from "@/components/LogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Restaurant3DViewer from "@/components/spatial/Restaurant3DViewer";

type RestaurantPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function UserRestaurantBookingPage({
  params,
}: RestaurantPageProps) {
  const { id } = use(params);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const rDoc = await getDoc(doc(db, "restaurants", id));
        if (rDoc.exists()) {
          setRestaurant({ id: rDoc.id, ...rDoc.data() });
        } else {
          setRestaurant(null);
        }

        const tQuery = query(collection(db, "tables"), where("restaurant_id", "==", id));
        const tSnap = await getDocs(tQuery);
        setTables(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const mQuery = query(collection(db, "menu_items"), where("restaurant_id", "==", id));
        const mSnap = await getDocs(mQuery);
        setMenuItems(mSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error loading restaurant details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-orange-500" />
          <span className="font-bold text-gray-700">Loading restaurant...</span>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6">
        <div className="max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-gray-950">
            Restaurant not found
          </h1>

          <p className="mt-3 text-gray-500">
            This restaurant is not available or has not been approved yet.
          </p>

          <Link
            href="/user/restaurants"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
          >
            Back to Restaurants
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5]">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/user" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={18} />
            </div>

            <span className="text-xl font-black text-gray-950">
              DineFlow User
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/user/restaurants"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-gray-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          Back to restaurants
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
          <div
            className="h-[360px] bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                restaurant.image_url ||
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
              })`,
            }}
          />

          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                  {restaurant.cuisine_type || "Restaurant"}
                </span>

                <h1 className="mt-4 text-4xl font-black text-gray-950">
                  {restaurant.name}
                </h1>

                <p className="mt-3 max-w-2xl text-gray-600">
                  {restaurant.description ||
                    "Enjoy a comfortable dining experience with easy table booking and meal pre-order."}
                </p>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <MapPin size={17} />
                    {restaurant.address || restaurant.city || "Tashkent"}
                  </span>

                  <span className="flex items-center gap-2">
                    <Phone size={17} />
                    {restaurant.phone || "No phone"}
                  </span>

                  <span className="flex items-center gap-2">
                    <Clock size={17} />
                    {restaurant.opening_time || "10:00"} -{" "}
                    {restaurant.closing_time || "23:00"}
                  </span>

                  <span className="flex items-center gap-2">
                    <Star
                      size={17}
                      className="fill-orange-400 text-orange-400"
                    />
                    4.8 rating
                  </span>
                </div>
              </div>

              <div className="rounded-3xl bg-orange-50 p-5 text-center">
                <p className="text-sm font-semibold text-gray-500">Status</p>

                <p
                  className={`mt-2 text-xl font-black ${
                    restaurant.is_open ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {restaurant.is_open ? "Open Now" : "Closed"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Spatial Digital Twin Interactive Experience */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>3D Spatial Digital Twin</span>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                Interactive WebGL Floor Map
              </span>
            </h2>
          </div>

          <Restaurant3DViewer
            restaurantId={id}
            restaurantName={restaurant.name || "Restaurant"}
            spatialModelUrl={restaurant.spatial_model_url}
          />
        </div>

        <div className="mt-12">
          <BookingSection
            restaurantId={id}
            tables={tables || []}
            menuItems={menuItems || []}
          />
        </div>
      </section>
    </main>
  );
}