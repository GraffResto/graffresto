"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  Phone,
  Table2,
  Utensils,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PartnerBookingActions from "@/components/PartnerBookingActions";
import { useLanguage } from "@/components/LanguageProvider";
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

type Restaurant = {
  id: string;
  name: string;
  city: string | null;
  cuisine_type: string | null;
};

type Booking = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  booking_date: string;
  booking_time: string;
  guests_count: number;
  status: string;
  notes: string | null;
  table_name?: string | null;
};

const pageText = {
  en: {
    back: "Back to Partner Panel",
    label: "Partner Bookings",
    title: "Incoming customer bookings",
    subtitle:
      "Review table reservations, customer information, and booking status.",
    loginRequired: "Login required",
    loginText: "Please login as an approved partner to view bookings.",
    login: "Login",
    noRestaurant: "No restaurant found",
    noRestaurantText:
      "This partner account does not have a restaurant yet, or your restaurant is not connected.",
    noBookings: "No bookings yet",
    noBookingsText:
      "When customers book tables, their reservations will appear here.",
    customer: "Customer",
    guests: "guests",
    table: "Table",
    notes: "Notes",
    loading: "Loading bookings...",
  },

  uz: {
    back: "Partner panelga qaytish",
    label: "Partner bronlari",
    title: "Mijozlardan kelgan bronlar",
    subtitle:
      "Stol bronlari, mijoz ma’lumotlari va bron statuslarini ko‘ring.",
    loginRequired: "Login kerak",
    loginText: "Bronlarni ko‘rish uchun approved partner sifatida login qiling.",
    login: "Kirish",
    noRestaurant: "Restoran topilmadi",
    noRestaurantText:
      "Bu partner akkauntiga restoran biriktirilmagan yoki restoran ulanmagan.",
    noBookings: "Hali bron yo‘q",
    noBookingsText:
      "Mijozlar stol bron qilganda, ularning bronlari shu yerda ko‘rinadi.",
    customer: "Mijoz",
    guests: "mehmon",
    table: "Stol",
    notes: "Izoh",
    loading: "Bronlar yuklanmoqda...",
  },

  ru: {
    back: "Назад в партнёрский кабинет",
    label: "Бронирования партнёра",
    title: "Входящие бронирования клиентов",
    subtitle:
      "Просматривайте бронирования столов, данные клиентов и статус.",
    loginRequired: "Требуется вход",
    loginText:
      "Войдите как одобренный партнёр, чтобы увидеть бронирования.",
    login: "Войти",
    noRestaurant: "Ресторан не найден",
    noRestaurantText:
      "К этому партнёрскому аккаунту ресторан не привязан или ресторан не подключён.",
    noBookings: "Бронирований пока нет",
    noBookingsText:
      "Когда клиенты забронируют столы, их бронирования появятся здесь.",
    customer: "Клиент",
    guests: "гостей",
    table: "Стол",
    notes: "Заметки",
    loading: "Загрузка бронирований...",
  },
};

function getStatusStyle(status: string) {
  if (status === "approved") {
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

export default function PartnerBookingsPage() {
  const { language } = useLanguage();
  const text = pageText[language];

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoggedIn(false);
        setRestaurant(null);
        setBookings([]);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setRestaurant(null);
          setBookings([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        const rData = { id: rDoc.id, ...rDoc.data() } as Restaurant;
        setRestaurant(rData);

        const bQuery = query(
          collection(db, "bookings"),
          where("restaurant_id", "==", rData.id)
        );

        const unsubBookings = onSnapshot(bQuery, (bSnap) => {
          const bookingList: Booking[] = bSnap.docs.map((d) => ({
            id: d.id,
            customer_name: d.data().customer_name || null,
            customer_phone: d.data().customer_phone || null,
            customer_email: d.data().customer_email || null,
            booking_date: d.data().booking_date || "",
            booking_time: d.data().booking_time || "",
            guests_count: d.data().guests_count || 1,
            status: d.data().status || "pending",
            notes: d.data().notes || null,
            table_name: d.data().table_name || null,
          }));

          setBookings(bookingList);
          setIsLoading(false);
        });

        return () => unsubBookings();
      } catch (error) {
        console.error("Error loading partner bookings:", error);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-orange-500" />
          <span className="font-bold text-gray-700">{text.loading}</span>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6">
        <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black text-gray-950">
            {text.loginRequired}
          </h1>

          <p className="mt-3 text-gray-600">{text.loginText}</p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
          >
            {text.login}
          </Link>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#fffaf5]">
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/partner" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Utensils size={18} />
              </div>

              <span className="text-xl font-black text-gray-950">
                DineFlow Partner
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-black text-gray-950">
              {text.noRestaurant}
            </h1>

            <p className="mt-3 text-gray-600">{text.noRestaurantText}</p>

            <Link
              href="/partner"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
            >
              {text.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5]">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/partner" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={18} />
            </div>

            <span className="text-xl font-black text-gray-950">
              DineFlow Partner
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
          href="/partner"
          className="mb-8 inline-flex items-center gap-2 font-bold text-gray-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          {text.back}
        </Link>

        <div className="mb-8">
          <p className="font-bold text-orange-600">
            {text.label} • {restaurant.name}
          </p>

          <h1 className="mt-2 text-4xl font-black text-gray-950">
            {text.title}
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">{text.subtitle}</p>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <CalendarDays className="mx-auto text-orange-500" size={46} />

            <h2 className="mt-4 text-2xl font-black text-gray-950">
              {text.noBookings}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              {text.noBookingsText}
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {bookings.map((booking) => {
              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-gray-950">
                          {booking.customer_name || text.customer}
                        </h2>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-black ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-4">
                        <span className="flex items-center gap-2">
                          <Phone size={17} />
                          {booking.customer_phone || "No phone"}
                        </span>

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

                      {booking.customer_email && (
                        <p className="mt-3 text-sm text-gray-500">
                          Email: {booking.customer_email}
                        </p>
                      )}

                      {booking.notes && (
                        <p className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-700">
                          {text.notes}: {booking.notes}
                        </p>
                      )}
                    </div>

                    <PartnerBookingActions
                      bookingId={booking.id}
                      currentStatus={booking.status}
                    />
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