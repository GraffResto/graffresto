"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Table2,
  Utensils,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import {
  auth,
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onAuthStateChanged,
} from "@/lib/firebase";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  guests_count: number;
  status: string;
  notes: string | null;
  restaurant_name?: string | null;
  table_name?: string | null;
};

const bookingsText = {
  en: {
    title: "My Bookings",
    subtitle: "See your restaurant reservations and booking status.",
    back: "Back to User Panel",
    noBookings: "No bookings yet",
    noBookingsText:
      "When you book a restaurant, your reservation will appear here.",
    browse: "Browse Restaurants",
    guests: "guests",
    table: "Table",
    status: "Status",
    preorder: "Pre-order",
    loading: "Loading...",
  },
  uz: {
    title: "Mening bronlarim",
    subtitle: "Restoran bronlaringiz va statuslarini ko‘ring.",
    back: "User panelga qaytish",
    noBookings: "Hali bron yo‘q",
    noBookingsText:
      "Restoran bron qilganingizdan keyin bronlaringiz shu yerda chiqadi.",
    browse: "Restoranlarni ko‘rish",
    guests: "mehmon",
    table: "Stol",
    status: "Status",
    preorder: "Oldindan buyurtma",
    loading: "Yuklanmoqda...",
  },
  ru: {
    title: "Мои бронирования",
    subtitle: "Смотрите свои бронирования и их статус.",
    back: "Назад в кабинет",
    noBookings: "Бронирований пока нет",
    noBookingsText:
      "Когда вы забронируете ресторан, запись появится здесь.",
    browse: "Посмотреть рестораны",
    guests: "гостей",
    table: "Стол",
    status: "Статус",
    preorder: "Предзаказ",
    loading: "Загрузка...",
  },
};

function getStatusStyle(status: string) {
  if (status === "approved" || status === "confirmed") {
    return "bg-green-50 text-green-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "completed") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-orange-50 text-orange-700";
}

export default function UserBookingsPage() {
  const { language } = useLanguage();
  const text = bookingsText[language];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setBookings([]);
        setIsLoading(false);
        return;
      }

      try {
        const bQuery = query(
          collection(db, "bookings"),
          where("customer_id", "==", user.uid)
        );
        const bSnap = await getDocs(bQuery);

        // Bookings only store restaurant_id, so resolve each name once
        const restaurantIds = Array.from(
          new Set(bSnap.docs.map((d) => d.data().restaurant_id).filter(Boolean))
        );

        const restaurantNames = new Map<string, string>();
        await Promise.all(
          restaurantIds.map(async (restaurantId: string) => {
            try {
              const rDoc = await getDoc(doc(db, "restaurants", restaurantId));
              if (rDoc.exists()) {
                restaurantNames.set(restaurantId, rDoc.data().name || "Restaurant");
              }
            } catch (err) {
              console.warn("Could not resolve restaurant name:", err);
            }
          })
        );

        const list: Booking[] = bSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            booking_date: data.booking_date || "",
            booking_time: data.booking_time || "",
            guests_count: data.guests_count || 1,
            status: data.status || "pending",
            notes: data.notes || null,
            restaurant_name:
              data.restaurant_name ||
              restaurantNames.get(data.restaurant_id) ||
              "Restaurant",
            table_name: data.table_name || "",
          };
        });

        setBookings(list);
      } catch (error) {
        console.error("Bookings error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/user"
          className="mb-8 inline-flex items-center gap-2 font-bold text-gray-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          {text.back}
        </Link>

        <div className="mb-8">
          <p className="font-bold text-orange-600">DineFlow</p>

          <h1 className="mt-2 text-4xl font-black text-gray-950">
            {text.title}
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">{text.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-gray-500">{text.loading}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <CalendarDays className="mx-auto text-orange-500" size={42} />

            <h2 className="mt-4 text-2xl font-black text-gray-950">
              {text.noBookings}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              {text.noBookingsText}
            </p>

            <Link
              href="/user/restaurants"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
            >
              {text.browse}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {bookings.map((booking) => {
              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-gray-950">
                          {booking.restaurant_name || "Restaurant"}
                        </h2>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-black ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={17} />
                          {booking.booking_date}
                        </span>

                        <span className="flex items-center gap-2">
                          <Clock size={17} />
                          {booking.booking_time}
                        </span>

                        <span className="flex items-center gap-2">
                          <Users size={17} />
                          {booking.guests_count} {text.guests}
                        </span>

                        <span className="flex items-center gap-2">
                          <Table2 size={17} />
                          {text.table}: {booking.table_name || "N/A"}
                        </span>
                      </div>

                      {booking.notes && (
                        <p className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-700">
                          {text.preorder}: {booking.notes}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-orange-50 px-5 py-4 text-center">
                      <p className="text-sm font-bold text-gray-500">
                        {text.status}
                      </p>

                      <p className="mt-1 text-lg font-black text-orange-600">
                        {booking.status}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}