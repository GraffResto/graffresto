"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Compass,
  Filter,
  Heart,
  Home,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  ShoppingBag,
  User,
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
  onSnapshot,
} from "@/lib/firebase";

type RestaurantItem = {
  id: string;
  name: string;
  image_url?: string;
  cuisine_type?: string;
  city?: string;
  rating?: number;
  price?: string;
  is_open?: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  category?: string;
  price: number;
  image_url?: string;
  restaurant_id: string;
  restaurant_name?: string;
};

type UserBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  restaurant_id: string;
  table_name?: string;
};

const categories = [
  { name: "Burger", icon: "🍔", tag: "burger" },
  { name: "Biryani", icon: "🍛", tag: "asian" },
  { name: "Asian", icon: "🍱", tag: "asian" },
  { name: "Cake", icon: "🍰", tag: "dessert" },
  { name: "Coffee", icon: "☕", tag: "drinks" },
  { name: "Chinese", icon: "🥢", tag: "chinese" },
  { name: "Pizza", icon: "🍕", tag: "pizza" },
  { name: "Seafood", icon: "🦐", tag: "seafood" },
];

export default function CustomerPortalPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userUid, setUserUid] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("Tashkent");

  // Collections
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [myBookings, setMyBookings] = useState<UserBooking[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Redirect unauthenticated user to login
        router.push("/login");
        return;
      }

      setUserUid(user.uid);
      setUserEmail(user.email || "");

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (user.displayName) {
          setUserName(user.displayName);
        }

        // 1. Fetch Approved Restaurants
        const rQuery = query(
          collection(db, "restaurants"),
          where("approval_status", "==", "approved")
        );

        const unsubRestaurants = onSnapshot(rQuery, (snap) => {
          const list: RestaurantItem[] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Restaurant",
            image_url:
              d.data().image_url ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
            cuisine_type: d.data().cuisine_type || "Fine Dining",
            city: d.data().city || "Tashkent",
            rating: d.data().rating || 4.8,
            price: d.data().price || "$$",
            is_open: d.data().is_open ?? true,
          }));
          setRestaurants(list);
        });

        // 2. Fetch User Bookings
        const bQuery = query(
          collection(db, "bookings"),
          where("customer_id", "==", user.uid)
        );

        const unsubBookings = onSnapshot(bQuery, (snap) => {
          const bList: UserBooking[] = snap.docs.map((d) => ({
            id: d.id,
            booking_date: d.data().booking_date || "",
            booking_time: d.data().booking_time || "",
            status: d.data().status || "pending",
            restaurant_id: d.data().restaurant_id || "",
            table_name: d.data().table_name || "T1",
          }));
          setMyBookings(bList);
        });

        // 3. Fetch Featured Menu Items
        const mQuery = query(collection(db, "menu_items"));
        const unsubMenu = onSnapshot(mQuery, (snap) => {
          const mList: MenuItem[] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Special Dish",
            category: d.data().category || "Main",
            price: d.data().price || 12,
            image_url:
              d.data().image_url ||
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
            restaurant_id: d.data().restaurant_id || "",
          }));
          setMenuItems(mList);
        });

        setLoading(false);

        return () => {
          unsubRestaurants();
          unsubBookings();
          unsubMenu();
        };
      } catch (err) {
        console.error("Customer portal load error:", err);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  // Filtered lists
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory
      ? r.cuisine_type?.toLowerCase().includes(selectedCategory)
      : true;

    return matchesSearch && matchesCategory;
  });

  const filteredDishes = menuItems.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex items-center gap-3 rounded-3xl bg-white border border-gray-100 p-8 shadow-xl">
          <Loader2 className="animate-spin text-orange-500" size={26} />
          <span className="font-bold text-gray-700">Loading DineFlow Portal...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 pb-24 text-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-4">
            <Link href="/user" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20">
                <Utensils size={20} />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">DineFlow</span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-bold text-gray-700 border border-gray-200/60">
              <MapPin size={14} className="text-orange-500" />
              <span>{selectedCity}, Uzbekistan</span>
            </div>
          </div>

          {/* User Menu & Language */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              href="/user/bookings"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              <CalendarDays size={18} />
              {myBookings.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white shadow-sm">
                  {myBookings.length}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-8">
        {/* Welcome & Location Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-orange-500 tracking-wider">
              <Sparkles size={14} /> Customer Portal
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Welcome, {userName}!
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Find nearby top restaurants, select your exact table & pre-order meals.
            </p>
          </div>

          <div className="flex sm:hidden items-center gap-1.5 self-start rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 border border-orange-200">
            <MapPin size={14} />
            <span>{selectedCity}, Uzbekistan</span>
          </div>
        </div>

        {/* Global Search Input Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your desired foods or restaurants..."
              className="w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 py-3.5 text-sm font-bold text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>

          <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Hero Promo Banner Carousel */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-8 text-white shadow-xl shadow-orange-500/10">
          <div className="relative z-10 max-w-md space-y-4">
            <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-black backdrop-blur-md uppercase tracking-wider">
              FAVORITE FOOD & TABLES
            </span>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              Always Delicious & Ready For You
            </h2>
            <p className="text-sm font-medium text-orange-100">
              Book your favorite table in advance and pre-order your meals without waiting in line.
            </p>
            <Link
              href="/user/explore"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-orange-600 shadow-lg hover:bg-orange-50 transition"
            >
              See Locations & Book <ArrowRight size={16} />
            </Link>
          </div>

          <div
            className="absolute -right-8 -bottom-10 hidden md:block h-64 w-80 rounded-full bg-cover bg-center border-4 border-white/20 shadow-2xl opacity-90"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop')",
            }}
          />
        </div>

        {/* Categories Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900">Categories</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.tag;
              return (
                <button
                  key={cat.name}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : cat.tag)
                  }
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-5 py-4 min-w-[90px] font-bold text-xs transition border ${
                    isSelected
                      ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                      : "bg-white text-gray-700 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 shadow-sm"
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Restaurants Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900">Popular Restaurants</h3>
              <p className="text-xs font-medium text-gray-500">
                Top rated dining spots with available interactive floor maps.
              </p>
            </div>
            <Link
              href="/user/restaurants"
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              View All ({restaurants.length})
            </Link>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
              <Utensils className="mx-auto mb-3 text-orange-400" size={36} />
              <p className="font-bold">No restaurants found matching your search.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map((res) => (
                <div
                  key={res.id}
                  className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="h-44 w-full bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${res.image_url})` }}
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-gray-900 shadow-md backdrop-blur-md">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>{res.rating || 4.8}</span>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                      <Clock size={12} className="text-orange-400" />
                      <span>15-20 min booking</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition">
                          {res.name}
                        </h4>
                        <span className="text-xs font-bold text-gray-500">{res.price}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-500 mt-1">
                        {res.cuisine_type} • {res.city}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Tables Available
                      </span>

                      <Link
                        href={`/user/restaurants/${res.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 transition"
                      >
                        Book Table <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Pre-order Menu Items */}
        {menuItems.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">Trending Pre-order Dishes</h3>
                <p className="text-xs font-medium text-gray-500">
                  Pre-order your favorite meal alongside table reservation.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {filteredDishes.slice(0, 4).map((dish) => (
                <div
                  key={dish.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div
                      className="h-32 w-full rounded-xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${dish.image_url})` }}
                    />
                    <div>
                      <h5 className="font-black text-sm text-gray-900 line-clamp-1">
                        {dish.name}
                      </h5>
                      <span className="text-xs font-bold text-gray-400">{dish.category}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-base font-black text-orange-600">${dish.price}</span>
                    <Link
                      href={`/user/restaurants/${dish.restaurant_id || restaurants[0]?.id || ""}`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition"
                    >
                      <Plus size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation for Mobile & Quick Access */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-6 py-3 shadow-2xl backdrop-blur-xl">
        <Link
          href="/user"
          className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-orange-500/20"
        >
          <Home size={16} /> <span>Home</span>
        </Link>
        <Link
          href="/user/explore"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
        >
          <Compass size={16} /> <span>Explore</span>
        </Link>
        <Link
          href="/user/bookings"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
        >
          <CalendarDays size={16} /> <span>Bookings</span>
        </Link>
      </nav>
    </main>
  );
}