"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Boxes,
  Calendar,
  ChevronRight,
  Edit2,
  Loader2,
  LogOut,
  Plus,
  Search,
  Table,
  Trash2,
  Truck,
  Utensils,
  BarChart3,
  ChefHat,
  DollarSign,
  Gift,
  Settings,
  Store,
  LayoutDashboard,
  UtensilsCrossed,
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

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  pct: number;
  min_threshold: number;
  supplier: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  image_url: string;
};

export default function InventoryManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Afsona Restaurant");

  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
          const list: InventoryItem[] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Item",
            category: d.data().category || "Meat",
            current_stock: d.data().current_stock || 10,
            unit: d.data().unit || "kg",
            pct: d.data().pct || 60,
            min_threshold: d.data().min_threshold || 5,
            supplier: d.data().supplier || "Toshkent Meat Co.",
            status: d.data().status || "in_stock",
            image_url: d.data().image_url || "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=200",
          }));

          if (list.length > 0) {
            setInventory(list);
          } else {
            // Mock dataset matching Inventory Mockup
            setInventory([
              { id: "i1", name: "Chicken Breast", category: "Meat", current_stock: 12, unit: "kg", pct: 60, min_threshold: 5, supplier: "Toshkent Meat Co.", status: "in_stock", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=200" },
              { id: "i2", name: "Beef Fillet", category: "Meat", current_stock: 3, unit: "kg", pct: 15, min_threshold: 8, supplier: "Toshkent Meat Co.", status: "low_stock", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200" },
              { id: "i3", name: "Tomatoes", category: "Vegetables", current_stock: 25, unit: "kg", pct: 80, min_threshold: 10, supplier: "Fresh Farm Ltd", status: "in_stock", image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200" },
              { id: "i4", name: "Onions", category: "Vegetables", current_stock: 0, unit: "kg", pct: 0, min_threshold: 5, supplier: "Fresh Farm Ltd", status: "out_of_stock", image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=200" },
              { id: "i5", name: "Mozzarella Cheese", category: "Dairy", current_stock: 8, unit: "kg", pct: 40, min_threshold: 6, supplier: "DairyPro", status: "low_stock", image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=200" },
              { id: "i6", name: "Olive Oil", category: "Spices & Sauces", current_stock: 18, unit: "L", pct: 90, min_threshold: 5, supplier: "Mediterra Supply", status: "in_stock", image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200" },
              { id: "i7", name: "Basmati Rice", category: "Dry Goods", current_stock: 45, unit: "kg", pct: 75, min_threshold: 15, supplier: "Grain House", status: "in_stock", image_url: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=200" },
              { id: "i8", name: "Cola Syrup", category: "Beverages", current_stock: 6, unit: "L", pct: 30, min_threshold: 4, supplier: "BevCo", status: "low_stock", image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=200" },
            ]);
          }
          setIsLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("Inventory load error:", err);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleDeleteItem(id: string) {
    try {
      await deleteDoc(doc(db, "inventory", id));
    } catch (err) {
      setInventory((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const categoriesList = ["All Categories", "Meat & Poultry", "Vegetables", "Dairy", "Spices & Sauces", "Beverages", "Dry Goods"];

  const filteredInventory = inventory.filter((item) => {
    const matchesCat = activeCategory === "All Categories" ? true : item.category.includes(activeCategory.split(" ")[0]);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070e17] text-white">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0f172a] border border-white/10 p-8 shadow-2xl">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="font-bold text-gray-300">Loading Inventory...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar matching Inventory Mockup */}
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
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition"
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
              className="flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20"
            >
              <Boxes size={16} /> Inventory
            </Link>
            <Link
              href="/partner/finance"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <DollarSign size={16} /> Finance
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

      {/* Main Workspace Area matching Inventory Mockup */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Inventory</h1>
            <p className="text-xs font-medium text-slate-500">86 ingredients • 6 low stock alerts</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 transition">
              <Plus size={16} /> + Add Ingredient
            </button>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search ingredients..."
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
        <div className="p-8 space-y-8">
          {/* Summary KPI Cards Row matching Inventory Mockup */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Items */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</p>
                <p className="text-3xl font-black text-slate-900 mt-2">86</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Boxes size={24} />
              </div>
            </div>

            {/* Card 2: Low Stock (Orange Active) */}
            <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-100">Low Stock</p>
                <p className="text-3xl font-black mt-2">6</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/40 text-white">
                <AlertTriangle size={24} />
              </div>
            </div>

            {/* Card 3: Out of Stock */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Out of Stock</p>
                <p className="text-3xl font-black text-slate-900 mt-2">2</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Boxes size={24} />
              </div>
            </div>

            {/* Card 4: Suppliers */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Suppliers</p>
                <p className="text-3xl font-black text-slate-900 mt-2">12</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Truck size={24} />
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-2xl px-5 py-2.5 text-xs font-black transition ${
                  activeCategory === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Layout Grid: Table + Right Suppliers Overview */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Inventory Data Table */}
            <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-slate-700">
                  <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="py-4 px-6">Ingredient</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Current Stock</th>
                      <th className="py-4 px-6">Stock Level</th>
                      <th className="py-4 px-6">Min Threshold</th>
                      <th className="py-4 px-6">Supplier</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        {/* Ingredient Name & Image */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={item.image_url} alt={item.name} className="h-9 w-9 rounded-xl object-cover" />
                            <span className="font-black text-slate-900 flex items-center gap-1.5">
                              {item.name}
                              {item.status !== "in_stock" && (
                                <AlertTriangle size={14} className="text-orange-500" />
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6 text-slate-500">{item.category}</td>

                        {/* Current Stock */}
                        <td className="py-4 px-6 font-black text-slate-900">
                          {item.current_stock} {item.unit}
                        </td>

                        {/* Stock Level Progress Bar */}
                        <td className="py-4 px-6 w-36">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.status === "in_stock"
                                    ? "bg-emerald-500"
                                    : item.status === "low_stock"
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 w-7">{item.pct}%</span>
                          </div>
                        </td>

                        {/* Min Threshold */}
                        <td className="py-4 px-6 text-slate-500">
                          {item.min_threshold} {item.unit}
                        </td>

                        {/* Supplier */}
                        <td className="py-4 px-6 text-slate-700">{item.supplier}</td>

                        {/* Status Badge */}
                        <td className="py-4 px-6">
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black ${
                              item.status === "in_stock"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : item.status === "low_stock"
                                ? "bg-orange-50 text-orange-600 border border-orange-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}
                          >
                            {item.status === "in_stock"
                              ? "In Stock"
                              : item.status === "low_stock"
                              ? "Low Stock"
                              : "Out of Stock"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="rounded-xl p-1.5 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 Col: Suppliers Overview Sidebar */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Suppliers Overview</h3>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Toshkent Meat Co.", phone: "+998 90 123 45 67", items: 18, img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=200" },
                  { name: "Fresh Farm Ltd", phone: "+998 91 234 56 78", items: 16, img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200" },
                  { name: "DairyPro", phone: "+998 93 345 67 89", items: 10, img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=200" },
                  { name: "Mediterra Supply", phone: "+998 94 456 78 90", items: 14, img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200" },
                ].map((sup) => (
                  <div key={sup.name} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <img src={sup.img} alt={sup.name} className="h-10 w-10 rounded-2xl object-cover" />
                      <div>
                        <p className="text-xs font-black text-slate-900">{sup.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{sup.phone}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">Items Supplied: {sup.items}</p>
                      </div>
                    </div>
                    <button className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-600 hover:bg-orange-100">
                      Contact
                    </button>
                  </div>
                ))}
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                View all suppliers <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
