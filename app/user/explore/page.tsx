"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChartLine,
  Clock,
  Compass,
  Loader2,
  LogOut,
  MapPin,
  Percent,
  UserRound,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import {
  auth,
  db,
  collection,
  query,
  where,
  getDocs,
  onAuthStateChanged,
  signOut,
  getUserProfile,
} from "@/lib/firebase";

type Restaurant = {
  id: string;
  name: string;
  cuisine_type: string | null;
  city: string | null;
  image_url: string | null;
  is_open: boolean | null;
  opening_time: string | null;
  closing_time: string | null;
};

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  ends_at: string | null;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_image: string | null;
};

const t = {
  en: {
    title: "Explore",
    subtitle: "Discover restaurants nearby and active deals.",
    dashboard: "Dashboard", explore: "Explore", bookings: "My Bookings",
    profile: "My Profile", logout: "Logout",
    nearbyTitle: "Restaurants in Tashkent",
    dealsTitle: "Active Deals & Discounts",
    noDeals: "No active promotions right now.",
    noRestaurants: "No restaurants found.",
    loading: "Loading...", open: "Open", closed: "Closed",
    off: "off", until: "Until", bookNow: "Book Now", viewAll: "View all restaurants",
    customer: "Customer",
  },
  uz: {
    title: "Kashf etish",
    subtitle: "Yaqin atrofdagi restoranlar va hozirgi aksiyalar.",
    dashboard: "Dashboard", explore: "Kashf etish", bookings: "Bronlarim",
    profile: "Profilim", logout: "Chiqish",
    nearbyTitle: "Toshkentdagi restoranlar",
    dealsTitle: "Faol aksiyalar va chegirmalar",
    noDeals: "Hozirda faol aksiyalar yo'q.",
    noRestaurants: "Restoranlar topilmadi.",
    loading: "Yuklanmoqda...", open: "Ochiq", closed: "Yopiq",
    off: "chegirma", until: "Gacha", bookNow: "Bron qilish", viewAll: "Barcha restoranlar",
    customer: "Mijoz",
  },
  ru: {
    title: "Исследовать",
    subtitle: "Рестораны рядом и актуальные акции.",
    dashboard: "Дэшборд", explore: "Исследовать", bookings: "Мои брони",
    profile: "Мой профиль", logout: "Выйти",
    nearbyTitle: "Рестораны в Ташкенте",
    dealsTitle: "Активные акции и скидки",
    noDeals: "Активных акций пока нет.",
    noRestaurants: "Ресторан не найдены.",
    loading: "Загрузка...", open: "Открыто", closed: "Закрыто",
    off: "скидка", until: "До", bookNow: "Забронировать", viewAll: "Все рестораны",
    customer: "Клиент",
  },
};

export default function UserExplorePage() {
  const { language } = useLanguage();
  const text = t[language];
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        setFullName(profile?.full_name || user.displayName || "Customer");

        const restSnap = await getDocs(
          query(collection(db, "restaurants"), where("approval_status", "==", "approved"))
        );
        const restList: Restaurant[] = restSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name || "Restaurant",
          cuisine_type: docSnap.data().cuisine_type || null,
          city: docSnap.data().city || null,
          image_url: docSnap.data().image_url || null,
          is_open: docSnap.data().is_open ?? true,
          opening_time: docSnap.data().opening_time || null,
          closing_time: docSnap.data().closing_time || null,
        }));
        setRestaurants(restList);

        const promoSnap = await getDocs(
          query(collection(db, "promotions"), where("is_active", "==", true))
        );
        const promoList: Promotion[] = promoSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "Special Offer",
            description: data.description || null,
            discount_percent: Number(data.discount_percent) || 0,
            ends_at: data.ends_at || null,
            restaurant_id: data.restaurant_id || "",
            restaurant_name: data.restaurant_name || "Restaurant",
            restaurant_image: data.restaurant_image || null,
          };
        });
        setPromotions(promoList);
      } catch (error) {
        console.error("Error loading explore data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const navItems = [
    { label: text.dashboard, icon: ChartLine, href: "/user" },
    { label: text.explore, icon: Compass, href: "/user/explore", active: true },
    { label: text.bookings, icon: CalendarDays, href: "/user/bookings" },
    { label: text.profile, icon: UserRound, href: "/user/profile" },
  ];

  return (
    <main className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 flex-col bg-[#07111f] p-6 text-white lg:flex">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500"><Utensils size={18} /></div>
          <span className="text-lg font-black">DineFlow</span>
        </Link>
        <nav className="flex-1 space-y-1 text-sm font-semibold">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                (item as { active?: boolean }).active ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}>
              <item.icon size={18} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-2">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-sm font-black text-white">{fullName || "..."}</p>
            <p className="mt-0.5 text-xs text-gray-400">{text.customer}</p>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white">
            <LogOut size={16} />{text.logout}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950">{text.title}</h1>
            <p className="text-sm text-gray-500">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-600">
              {fullName?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <section className="flex-1 p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="animate-spin text-orange-500" />{text.loading}
            </div>
          ) : (
            <>
              {/* Active Deals */}
              {promotions.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-black text-gray-950">{text.dealsTitle}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {promotions.map((promo) => (
                      <Link key={promo.id} href={`/user/restaurants/${promo.restaurant_id}`}
                        className="group rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                            <Percent size={18} className="text-orange-600" />
                          </div>
                          {promo.discount_percent > 0 && (
                            <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-black text-white">
                              {promo.discount_percent}% {text.off}
                            </span>
                          )}
                        </div>
                        <p className="font-black text-gray-950">{promo.title}</p>
                        <p className="mt-1 text-sm font-bold text-orange-600">{promo.restaurant_name}</p>
                        {promo.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{promo.description}</p>}
                        {promo.ends_at && (
                          <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {text.until} {new Date(promo.ends_at).toLocaleDateString()}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurants */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-950">{text.nearbyTitle}</h2>
                <Link href="/user/restaurants" className="text-sm font-bold text-orange-600 hover:underline">
                  {text.viewAll}
                </Link>
              </div>

              {restaurants.length === 0 ? (
                <p className="text-sm text-gray-400">{text.noRestaurants}</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {restaurants.map((r) => (
                    <Link key={r.id} href={`/user/restaurants/${r.id}`}
                      className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div
                        className="h-44 bg-cover bg-center bg-gray-100"
                        style={{ backgroundImage: r.image_url ? `url(${r.image_url})` : undefined }}
                      >
                        {!r.image_url && (
                          <div className="flex h-full items-center justify-center">
                            <Utensils size={32} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-gray-950">{r.name}</p>
                            <p className="mt-0.5 text-sm text-gray-500">{r.cuisine_type || "Restaurant"}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${r.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {r.is_open ? text.open : text.closed}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                          {r.city && <span className="flex items-center gap-1"><MapPin size={12} />{r.city}</span>}
                          {r.opening_time && <span className="flex items-center gap-1"><Clock size={12} />{r.opening_time}–{r.closing_time}</span>}
                        </div>
                        <span className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 py-2.5 text-sm font-black text-white">
                          {text.bookNow}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}