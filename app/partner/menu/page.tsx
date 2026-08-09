"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Plus,
  Search,
  Table,
  Trash2,
  Utensils,
  UtensilsCrossed,
  X,
  BarChart3,
  ChefHat,
  Boxes,
  DollarSign,
  Gift,
  Settings,
  Store,
  LayoutDashboard,
  Users,
  User,
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
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  onAuthStateChanged,
  signOut,
} from "@/lib/firebase";

type DishItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  is_available: boolean;
};

export default function MenuManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  // Category State
  const [activeCategory, setActiveCategory] = useState("Lunch");
  const [searchQuery, setSearchQuery] = useState("");

  const [dishes, setDishes] = useState<DishItem[]>([]);

  // Drawer Form State
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishCategory, setDishCategory] = useState("Lunch");
  const [dishPrice, setDishPrice] = useState("12.50");
  const [dishDescription, setDishDescription] = useState("");
  const [dishImageUrl, setDishImageUrl] = useState("https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800");
  const [dishAvailable, setDishAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (!rSnap.empty) {
          const rDoc = rSnap.docs[0];
          setRestaurantId(rDoc.id);
          setRestaurantName(rDoc.data().name || "Afsona Restaurant");
        }

        // Real-time Firestore Listeners
        const unsub = onSnapshot(collection(db, "dishes"), (snap) => {
          const list: DishItem[] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Dish",
            category: d.data().category || "Lunch",
            price: Number(d.data().price) || 12.5,
            description: d.data().description || "",
            image_url: d.data().image_url || "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800",
            is_available: d.data().is_available !== false,
          }));

          if (list.length > 0) {
            setDishes(list);
          } else {
            // Mock dataset matching Mockup 3
            setDishes([
              { id: "d1", name: "Pasta Bologna", category: "Lunch", price: 12.5, description: "Classic pasta with rich bolognese sauce and parmesan.", image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800", is_available: true },
              { id: "d2", name: "Spicy Fried Chicken", category: "Lunch", price: 10.9, description: "Crispy fried chicken with house spicy sauce.", image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800", is_available: true },
              { id: "d3", name: "Grilled Steak", category: "Lunch", price: 18.0, description: "Premium grilled steak with seasonal vegetables.", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800", is_available: true },
              { id: "d4", name: "Fish And Chips", category: "Lunch", price: 14.5, description: "Crispy fish fillet with fries and tartar sauce.", image_url: "https://images.unsplash.com/photo-1579208030886-b937da0925dc?q=80&w=800", is_available: false },
              { id: "d5", name: "Beef Bourguignon", category: "Lunch", price: 16.8, description: "Slow-cooked beef in red wine with vegetables.", image_url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800", is_available: true },
              { id: "d6", name: "Spaghetti Carbonara", category: "Lunch", price: 11.2, description: "Creamy spaghetti with egg, cheese and pancetta.", image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=800", is_available: true },
              { id: "d7", name: "Ratatouille", category: "Lunch", price: 9.5, description: "French-style stewed vegetables with herbs.", image_url: "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?q=80&w=800", is_available: true },
              { id: "d8", name: "Kimchi Jjigae", category: "Lunch", price: 10.9, description: "Korean kimchi stew with tofu and pork.", image_url: "https://images.unsplash.com/photo-1583032015879-e502275d0f62?q=80&w=800", is_available: false },
              { id: "d9", name: "Tofu Scramble", category: "Lunch", price: 8.9, description: "Tofu scramble with veggies and sourdough.", image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800", is_available: true },
            ]);
          }
          setIsLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("Menu load error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleToggleAvailable(id: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, "dishes", id), { is_available: !currentStatus });
    } catch (err) {
      setDishes((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_available: !currentStatus } : d))
      );
    }
  }

  async function handleDeleteDish(id: string) {
    try {
      await deleteDoc(doc(db, "dishes", id));
    } catch (err) {
      setDishes((prev) => prev.filter((d) => d.id !== id));
    }
  }

  function handleOpenEdit(dish: DishItem) {
    setEditingId(dish.id);
    setDishName(dish.name);
    setDishCategory(dish.category);
    setDishPrice(String(dish.price));
    setDishDescription(dish.description);
    setDishImageUrl(dish.image_url);
    setDishAvailable(dish.is_available);
    setShowDrawer(true);
  }

  function handleOpenCreate() {
    setEditingId(null);
    setDishName("");
    setDishCategory(activeCategory);
    setDishPrice("12.50");
    setDishDescription("");
    setDishImageUrl("https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800");
    setDishAvailable(true);
    setShowDrawer(true);
  }

  async function handleSaveDish(e: React.FormEvent) {
    e.preventDefault();
    if (!dishName) return;

    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "dishes", editingId), {
          name: dishName,
          category: dishCategory,
          price: Number(dishPrice),
          description: dishDescription,
          image_url: dishImageUrl,
          is_available: dishAvailable,
        });
      } else {
        await addDoc(collection(db, "dishes"), {
          restaurant_id: restaurantId,
          name: dishName,
          category: dishCategory,
          price: Number(dishPrice),
          description: dishDescription,
          image_url: dishImageUrl,
          is_available: dishAvailable,
          created_at: new Date().toISOString(),
        });
      }

      setShowDrawer(false);
    } catch (err) {
      console.error("Error saving dish:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const categoriesList = [
    { name: "Breakfast", count: 6 },
    { name: "Lunch", count: 8 },
    { name: "Dinner", count: 7 },
    { name: "Soup", count: 4 },
    { name: "Desserts", count: 5 },
    { name: "Side Dish", count: 6 },
    { name: "Appetizer", count: 5 },
    { name: "Beverages", count: 7 },
  ];

  const filteredDishes = dishes.filter((d) => {
    const matchesCat = activeCategory ? d.category === activeCategory : true;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Menu...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Mockup 3 */}
      <aside className="w-64 border-r border-slate-800 bg-[#080e1a] text-white flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Utensils size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">DineFlow</span>
          </div>

          <nav className="space-y-1 text-sm font-semibold">
            <Link
              href="/partner"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/partner/bookings"
              className="flex items-center justify-between rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} />
                <span>Bookings</span>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                3
              </span>
            </Link>

            <Link
              href="/partner/floor-plan"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Table size={18} />
              <span>Floor Map</span>
            </Link>

            <Link
              href="/partner/menu"
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-3 text-white font-bold shadow-md shadow-orange-500/20"
            >
              <UtensilsCrossed size={18} />
              <span>Menu</span>
            </Link>

            <Link
              href="/partner/analytics"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </Link>

            <Link
              href="/partner/crm"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Users size={18} />
              <span>CRM</span>
            </Link>

            <Link
              href="/partner/promotions"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Gift size={18} />
              <span>Promotions</span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-800 space-y-1">
            <p className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              ERP Modules
            </p>
            <Link
              href="/partner/kitchen"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <ChefHat size={16} /> Kitchen
            </Link>
            <Link
              href="/partner/inventory"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <Boxes size={16} /> Inventory
            </Link>
            <Link
              href="/partner/finance"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <DollarSign size={16} /> Finance
            </Link>
            <Link
              href="/partner/staff"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <User size={16} /> Staff
            </Link>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <Link
            href="/partner/settings"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <Settings size={16} /> Settings
          </Link>

          <Link
            href="/partner/profile"
            className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 p-3 hover:bg-slate-800/80 transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-orange-400 font-bold border border-slate-700">
              <Store size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{restaurantName}</p>
              <p className="text-[10px] text-slate-400">Restaurant Owner</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace Area matching Mockup 3 */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Menu Management</h1>
            <p className="text-xs font-medium text-slate-500">48 dishes across 8 categories</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 w-64"
              />
            </div>

            <LanguageSwitcher />

            <div className="relative">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                <Bell size={18} />
              </button>
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white">
                3
              </span>
            </div>

            <Link
              href="/partner/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-500/20 hover:scale-105 transition"
            >
              A
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-6">
          {/* Category Pills matching Mockup 3 */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {categoriesList.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`rounded-2xl px-5 py-2.5 text-xs font-black transition flex-shrink-0 flex items-center gap-2 ${
                  activeCategory === cat.name
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] font-bold ${
                    activeCategory === cat.name ? "text-orange-100" : "text-slate-400"
                  }`}
                >
                  ({cat.count})
                </span>
              </button>
            ))}
          </div>

          <h2 className="text-xl font-black text-slate-900">{activeCategory} Menu</h2>

          {/* Dish Cards Grid matching Mockup 3 */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Top Action Icons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(dish)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 backdrop-blur-md shadow-sm hover:bg-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteDish(dish.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 backdrop-blur-md shadow-sm hover:bg-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{dish.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">{dish.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-base font-black text-slate-900">${dish.price.toFixed(2)}</span>

                    {/* Toggle Switch matching Mockup 3 */}
                    <button
                      onClick={() => handleToggleAvailable(dish.id, dish.is_available)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dish.is_available ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dish.is_available ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Dashed Add New Dish Card matching Mockup 3 */}
            <div
              onClick={handleOpenCreate}
              className="rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50/20 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-orange-50/50 hover:border-orange-400 transition min-h-[280px]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 mb-3 shadow-inner">
                <Plus size={24} />
              </div>
              <span className="text-sm font-black text-orange-600">Add New Dish</span>
            </div>
          </div>
        </div>
      </section>

      {/* Slide-over Drawer Form matching Mockup 3 */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-8 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">
                  {editingId ? "Edit Dish" : "Add New Dish"}
                </h3>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveDish} className="space-y-5">
                {/* Upload Photo Area */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Upload photo</label>
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center space-y-2 bg-slate-50/50">
                    <Camera className="mx-auto text-slate-400" size={32} />
                    <p className="text-xs font-bold text-slate-600">Upload photo</p>
                    <p className="text-[10px] text-slate-400">JPG, PNG or WEBP. Max 5MB</p>
                  </div>
                </div>

                {/* Dish Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Enter dish name"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Soup">Soup</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Side Dish">Side Dish</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-200 pl-8 pr-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    placeholder="Enter dish description..."
                    className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>

                {/* Available Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700">Available</span>
                  <button
                    type="button"
                    onClick={() => setDishAvailable(!dishAvailable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      dishAvailable ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        dishAvailable ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Drawer Footer Buttons matching Mockup 3 */}
                <div className="space-y-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-orange-500 py-3.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Dish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="w-full rounded-2xl bg-slate-100 py-3 text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}