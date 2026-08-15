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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import PartnerSidebar from "@/components/PartnerSidebar";
import PartnerHeaderActions from "@/components/PartnerHeaderActions";
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
  const [restaurantName, setRestaurantName] = useState("");

  // Held in a ref because the async auth callback cannot return a cleanup
  const dishesListenerRef = useRef<(() => void) | null>(null);

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
    const detachDishes = () => {
      dishesListenerRef.current?.();
      dishesListenerRef.current = null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      detachDishes();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setDishes([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        setRestaurantId(rDoc.id);
        setRestaurantName(rDoc.data().name || "Your restaurant");

        // Real-time dishes for this restaurant only
        dishesListenerRef.current = onSnapshot(
          query(collection(db, "dishes"), where("restaurant_id", "==", rDoc.id)),
          (snap) => {
            const list: DishItem[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: data.name || "Dish",
                category: data.category || "Lunch",
                price: Number(data.price) || 0,
                description: data.description || "",
                image_url: data.image_url || "",
                is_available: data.is_available !== false,
              };
            });

            setDishes(list);
            setIsLoading(false);
          },
          (err) => {
            console.error("Menu listener error:", err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("Menu load error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detachDishes();
    };
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

  // Counts come from the real menu, not from fixed placeholders
  const categoriesList = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Soup",
    "Desserts",
    "Side Dish",
    "Appetizer",
    "Beverages",
  ].map((name) => ({
    name,
    count: dishes.filter((d) => d.category === name).length,
  }));

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
      <PartnerSidebar active="menu" />

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
            <PartnerHeaderActions />

            
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