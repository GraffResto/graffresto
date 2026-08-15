"use client";

import Link from "next/link";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Code,
  Copy,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  Save,
  Send,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
  Users,
  Utensils,
  Volume2,
} from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";
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
  onAuthStateChanged,
} from "@/lib/firebase";

type Restaurant = {
  id: string;
  name: string;
  city: string | null;
  cuisine_type: string | null;
  address: string | null;
  opening_hours?: string;
  zones?: string[];
};

type TableItem = {
  id: string;
  table_name: string;
  seats: number;
  zone: string;
  status: string;
  shape: "square" | "rectangle" | "circle" | "diamond";
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
};

// Starter layout used when a restaurant has no tables saved yet. Defined at
// module scope so the load effect can call it without a use-before-declare.
function buildDefaultTables(zone: string, seed: number): TableItem[] {
  return Array.from({ length: 6 }, (_, index) => {
    const i = index + 1;
    return {
      id: `temp_${i}_${seed}`,
      table_name: `T${i}`,
      seats: i % 2 === 0 ? 4 : 2,
      zone,
      status: "available",
      shape: i % 3 === 0 ? "circle" : "square",
      position_x: 60 + ((i - 1) % 3) * 160,
      position_y: 60 + Math.floor((i - 1) / 3) * 160,
      width: i % 3 === 0 ? 100 : 90,
      height: i % 3 === 0 ? 100 : 90,
      rotation: 0,
      color: "#f97316",
    } satisfies TableItem;
  });
}

type MenuItem = {
  id?: string;
  name: string;
  category: string;
  price: string;
  description: string;
  image: string;
};

type StaffMember = {
  id?: string;
  full_name: string;
  role: "Waiter" | "Hostess" | "Manager";
  phone: string;
};

const stepsInfo = [
  { id: 1, title: "Restaurant Settings", label: "Work Time & Zones" },
  { id: 2, title: "Table Setup", label: "Drag & Drop Floor Map" },
  { id: 3, title: "Menu", label: "Dishes & Categories" },
  { id: 4, title: "Staff Setup", label: "Roles & Team" },
  { id: 5, title: "Widget & Links", label: "QR & iFrame Code" },
  { id: 6, title: "Notifications", label: "SMS & Telegram Alerts" },
];

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const floorRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Step 1 State: Settings
  const [openingHours, setOpeningHours] = useState("09:00 - 23:00");
  const [zones, setZones] = useState<string[]>(["Main Hall", "Terrace", "VIP Room"]);
  const [newZoneName, setNewZoneName] = useState("");
  const [initialTableCount, setInitialTableCount] = useState(6);

  // Step 2 State: Tables Drag & Drop
  const [tables, setTables] = useState<TableItem[]>([]);
  const [activeZone, setActiveZone] = useState("Main Hall");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [draggingTableId, setDraggingTableId] = useState<string>("");

  // Step 3 State: Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      name: "Tenderloin Steak",
      category: "Main Dishes",
      price: "185,000 UZS",
      description: "Grilled premium beef with thyme & garlic butter.",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400",
    },
    {
      name: "Truffle Pasta",
      category: "Pasta",
      price: "120,000 UZS",
      description: "Fresh tagliatelle with creamy truffle sauce.",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=400",
    },
  ]);
  const [newDishName, setNewDishName] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("Main Dishes");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishDesc, setNewDishDesc] = useState("");

  // Step 4 State: Staff
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { full_name: "Aziz Rahimov", role: "Manager", phone: "+998 90 123 45 67" },
    { full_name: "Malika Alimova", role: "Hostess", phone: "+998 91 234 56 78" },
  ]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"Waiter" | "Hostess" | "Manager">("Waiter");
  const [newStaffPhone, setNewStaffPhone] = useState("");

  // Step 6 State: Notifications
  const [smsNotify, setSmsNotify] = useState(true);
  const [telegramNotify, setTelegramNotify] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        const rQuery = query(
          collection(db, "restaurants"),
          where("owner_id", "==", user.uid)
        );
        const rSnap = await getDocs(rQuery);

        if (!rSnap.empty) {
          const docItem = rSnap.docs[0];
          const data = { id: docItem.id, ...docItem.data() } as Restaurant;
          setRestaurant(data);

          if (data.opening_hours) {
            setOpeningHours(data.opening_hours);
          }
          if (data.zones && data.zones.length > 0) {
            setZones(data.zones);
            setActiveZone(data.zones[0]);
          }

          // Fetch existing tables
          const tQuery = query(
            collection(db, "tables"),
            where("restaurant_id", "==", data.id)
          );
          const tSnap = await getDocs(tQuery);

          if (!tSnap.empty) {
            const loadedTables: TableItem[] = tSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as TableItem[];
            setTables(loadedTables);
          } else {
            // Seed a starter layout the owner can drag around
            const mainZone = data.zones?.[0] || "Main Hall";
            setTables(buildDefaultTables(mainZone, Date.now()));
          }
        }
      } catch (err: any) {
        console.error("Onboarding load error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function handleAddZone() {
    if (!newZoneName.trim()) return;
    if (zones.includes(newZoneName.trim())) return;
    setZones((prev) => [...prev, newZoneName.trim()]);
    setNewZoneName("");
  }

  function handleAddTable() {
    const newId = `tbl_${Date.now()}`;
    const nextNum = tables.length + 1;
    const newTbl: TableItem = {
      id: newId,
      table_name: `T${nextNum}`,
      seats: 4,
      zone: activeZone,
      status: "available",
      shape: "square",
      position_x: 80 + (tables.length % 3) * 140,
      position_y: 80 + Math.floor(tables.length / 3) * 140,
      width: 90,
      height: 90,
      rotation: 0,
      color: "#f97316",
    };

    setTables((prev) => [...prev, newTbl]);
    setSelectedTableId(newId);
  }

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>, tableId: string) {
    e.preventDefault();
    setSelectedTableId(tableId);
    setDraggingTableId(tableId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingTableId || !floorRef.current) return;

    const rect = floorRef.current.getBoundingClientRect();
    const table = tables.find((t) => t.id === draggingTableId);
    if (!table) return;

    const width = table.width || 90;
    const height = table.height || 90;

    const nextX = Math.max(
      0,
      Math.min(e.clientX - rect.left - width / 2, rect.width - width)
    );
    const nextY = Math.max(
      0,
      Math.min(e.clientY - rect.top - height / 2, rect.height - height)
    );

    setTables((prev) =>
      prev.map((t) =>
        t.id === draggingTableId
          ? { ...t, position_x: Math.round(nextX), position_y: Math.round(nextY) }
          : t
      )
    );
  }

  function handlePointerUp() {
    setDraggingTableId("");
  }

  function updateSelectedTable<K extends keyof TableItem>(key: K, val: TableItem[K]) {
    if (!selectedTableId) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTableId ? { ...t, [key]: val } : t))
    );
  }

  function handleDeleteSelectedTable() {
    if (!selectedTableId) return;
    setTables((prev) => prev.filter((t) => t.id !== selectedTableId));
    setSelectedTableId("");
  }

  function handleAddDish() {
    if (!newDishName.trim() || !newDishPrice.trim()) return;
    setMenuItems((prev) => [
      ...prev,
      {
        name: newDishName,
        category: newDishCategory,
        price: newDishPrice,
        description: newDishDesc,
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400",
      },
    ]);
    setNewDishName("");
    setNewDishPrice("");
    setNewDishDesc("");
  }

  function handleAddStaff() {
    if (!newStaffName.trim() || !newStaffPhone.trim()) return;
    setStaffList((prev) => [
      ...prev,
      { full_name: newStaffName, role: newStaffRole, phone: newStaffPhone },
    ]);
    setNewStaffName("");
    setNewStaffPhone("");
  }

  async function handleCompleteOnboarding() {
    if (!restaurant) return;
    setSaving(true);
    setMessage("");

    try {
      // 1. Update restaurant settings
      const rRef = doc(db, "restaurants", restaurant.id);
      await updateDoc(rRef, {
        opening_hours: openingHours,
        zones: zones,
        status: "active",
        onboarding_completed: true,
      });

      // 2. Save/Update tables
      for (const table of tables) {
        if (table.id.startsWith("temp_") || table.id.startsWith("tbl_")) {
          await addDoc(collection(db, "tables"), {
            restaurant_id: restaurant.id,
            table_name: table.table_name,
            seats: Number(table.seats),
            zone: table.zone || "Main Hall",
            status: table.status || "available",
            shape: table.shape || "square",
            position_x: Number(table.position_x),
            position_y: Number(table.position_y),
            width: Number(table.width || 90),
            height: Number(table.height || 90),
            rotation: Number(table.rotation || 0),
            color: table.color || "#f97316",
          });
        } else {
          const tRef = doc(db, "tables", table.id);
          await updateDoc(tRef, {
            table_name: table.table_name,
            seats: Number(table.seats),
            zone: table.zone,
            shape: table.shape,
            position_x: Number(table.position_x),
            position_y: Number(table.position_y),
            width: Number(table.width),
            height: Number(table.height),
            color: table.color,
          });
        }
      }

      // 3. Save Menu Items
      for (const item of menuItems) {
        await addDoc(collection(db, "menu_items"), {
          restaurant_id: restaurant.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          image: item.image,
        });
      }

      // 4. Save Staff
      for (const staff of staffList) {
        await addDoc(collection(db, "staff"), {
          restaurant_id: restaurant.id,
          full_name: staff.full_name,
          role: staff.role,
          phone: staff.phone,
        });
      }

      // Done -> Redirect to partner dashboard
      router.push("/partner");
    } catch (err: any) {
      console.error("Complete onboarding error:", err);
      setMessage(err?.message || "Error saving onboarding configuration.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5]">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-orange-500" />
          <span className="font-bold text-gray-700">Loading Onboarding Wizard...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/partner" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={18} />
            </div>
            <span className="text-xl font-black text-gray-950">DineFlow Onboarding</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Progress Bar / Steps Bar */}
      <div className="border-b border-orange-100 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {stepsInfo.map((step) => {
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col rounded-2xl p-3 text-left transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : isDone
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        isActive
                          ? "bg-white text-orange-600"
                          : isDone
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isDone ? <Check size={12} /> : step.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Step {step.id}
                    </span>
                  </div>
                  <span className="mt-2 text-sm font-black truncate">{step.title}</span>
                  <span className="text-[11px] opacity-75 truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        {message && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        {/* ================= STEP 1: RESTAURANT SETTINGS ================= */}
        {currentStep === 1 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xs">
              <div className="flex items-center gap-3 text-orange-500">
                <Store size={24} />
                <h2 className="text-2xl font-black text-gray-950">Restaurant Operating Setup</h2>
              </div>
              <p className="mt-1 text-gray-500">
                Configure work time, default halls/zones, and capacity for{" "}
                <span className="font-bold text-gray-950">{restaurant?.name}</span>.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Clock size={16} className="text-orange-500" /> Operating Hours (Work Time)
                  </label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="e.g. 09:00 - 23:00"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 font-bold text-gray-900 outline-none focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Specify working hours displayed to guests when choosing booking slots.
                  </p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Layers size={16} className="text-orange-500" /> Restaurant Halls & Zones
                  </label>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {zones.map((z, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 border border-orange-200"
                      >
                        <span>{z}</span>
                        {zones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setZones((prev) => prev.filter((item) => item !== z))}
                            className="text-orange-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      placeholder="Add new zone name (e.g. Summer Terrace, VIP)"
                      className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddZone}
                      className="rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Armchair size={16} className="text-orange-500" /> Default Number of Tables
                  </label>
                  <input
                    type="number"
                    value={initialTableCount}
                    onChange={(e) => setInitialTableCount(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    You can customize table coordinates, shapes, and places in the next step.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Side Box */}
            <div className="rounded-[2.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6 text-gray-900 shadow-xs">
              <Sparkles className="text-orange-500" size={28} />
              <h3 className="mt-3 text-xl font-black">Why set up zones?</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Dividing your floor plan into zones (Main Hall, Terrace, VIP) allows guests to pick their preferred seating spot during online table booking.
              </p>
              <div className="mt-6 rounded-2xl bg-white p-4 border border-orange-100 shadow-xs">
                <p className="text-xs font-bold text-orange-600">PRO TIP</p>
                <p className="mt-1 text-xs text-gray-500">
                  You can edit table positions anytime in the interactive 2D Drag & Drop builder.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20"
              >
                Proceed to Table Setup <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: TABLE SETUP (DRAG & DROP FLOOR BUILDER) ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xs">
              <div>
                <h2 className="text-2xl font-black text-gray-950">Drag & Drop Floor Builder</h2>
                <p className="text-sm text-gray-500">
                  Drag tables around on the canvas, add new seating, change shapes (square, circle, diamond) or seats.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddTable}
                  className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-black text-orange-600 hover:bg-orange-50"
                >
                  <Plus size={16} /> Add Table
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white hover:bg-orange-600 shadow-xs"
                >
                  Continue to Menu <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Canvas + Inspector Grid */}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Floor Canvas */}
              <div className="overflow-hidden rounded-[2.5rem] border border-sky-100 bg-white shadow-xs">
                {/* Zone Switcher Tabs */}
                <div className="flex items-center gap-2 border-b border-sky-100 bg-sky-50/50 p-3">
                  <span className="px-3 text-xs font-black text-sky-800 uppercase">Zones:</span>
                  {zones.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setActiveZone(z)}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                        activeZone === z
                          ? "bg-sky-500 text-white shadow-xs"
                          : "bg-white text-gray-600 hover:bg-sky-100"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>

                <div
                  ref={floorRef}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="relative h-[600px] overflow-hidden bg-[#f4f8fe] cursor-crosshair"
                >
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-60 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(#e1ebf7 1px, transparent 1px), linear-gradient(90deg, #e1ebf7 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                    }}
                  />

                  {/* Zone boundary visual representation */}
                  <div className="absolute left-8 top-8 bottom-8 right-8 rounded-[2rem] border-2 border-dashed border-sky-200 pointer-events-none flex items-start justify-end p-4">
                    <span className="rounded-xl bg-sky-100 px-3 py-1 text-xs font-black text-sky-600">
                      {activeZone} Area
                    </span>
                  </div>

                  {/* Render Tables filtered by active zone */}
                  {tables
                    .filter((t) => t.zone === activeZone)
                    .map((table) => {
                      const isSel = table.id === selectedTableId;
                      const width = table.width || 90;
                      const height = table.height || 90;
                      const shapeClass =
                        table.shape === "circle"
                          ? "rounded-full"
                          : table.shape === "rectangle"
                          ? "rounded-2xl"
                          : table.shape === "diamond"
                          ? "rounded-xl rotate-45"
                          : "rounded-2xl";

                      return (
                        <button
                          key={table.id}
                          type="button"
                          onPointerDown={(e) => handlePointerDown(e, table.id)}
                          style={{
                            left: table.position_x,
                            top: table.position_y,
                            width,
                            height,
                            backgroundColor: isSel ? "#f97316" : table.color || "#f97316",
                          }}
                          className={`absolute flex cursor-move flex-col items-center justify-center border-4 border-white text-white shadow-md transition hover:scale-105 ${shapeClass}`}
                        >
                          <span
                            className={`flex flex-col items-center justify-center ${
                              table.shape === "diamond" ? "-rotate-45" : ""
                            }`}
                          >
                            <Armchair size={18} />
                            <span className="text-xs font-black">{table.table_name}</span>
                            <span className="text-[10px] font-bold opacity-80">
                              {table.seats} seats
                            </span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Table Properties Inspector */}
              <div className="rounded-[2.5rem] border border-orange-100 bg-white p-6 shadow-xs">
                {selectedTable ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="text-lg font-black text-gray-950">Table Properties</h3>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedTable}
                        className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">Table Name</label>
                      <input
                        type="text"
                        value={selectedTable.table_name}
                        onChange={(e) => updateSelectedTable("table_name", e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Seats (Places)</label>
                        <input
                          type="number"
                          value={selectedTable.seats}
                          onChange={(e) => updateSelectedTable("seats", Number(e.target.value))}
                          min={1}
                          max={20}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500">Zone / Hall</label>
                        <select
                          value={selectedTable.zone}
                          onChange={(e) => updateSelectedTable("zone", e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                        >
                          {zones.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">Shape</label>
                      <select
                        value={selectedTable.shape || "square"}
                        onChange={(e) =>
                          updateSelectedTable(
                            "shape",
                            e.target.value as TableItem["shape"]
                          )
                        }
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                      >
                        <option value="square">Square</option>
                        <option value="rectangle">Rectangle</option>
                        <option value="circle">Circle (Round)</option>
                        <option value="diamond">Diamond</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">Table Color</label>
                      <input
                        type="color"
                        value={selectedTable.color || "#f97316"}
                        onChange={(e) => updateSelectedTable("color", e.target.value)}
                        className="h-10 w-full rounded-xl border p-1 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-gray-400">
                    <Armchair size={36} className="mb-2 opacity-50" />
                    <p className="text-sm font-bold">Click any table on the canvas to edit seats, shape, or position.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: MENU SETUP ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-950">Add Menu & Dishes (Optional)</h2>
                  <p className="text-sm text-gray-500">
                    Create categories and items so guests can preview your restaurant menu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 shadow-xs"
                >
                  Continue to Staff <ArrowRight size={16} />
                </button>
              </div>

              {/* Add dish form */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                <h3 className="text-sm font-black text-gray-900">Add New Dish</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Dish Name (e.g. Ribeye Steak)"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                  />
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                  >
                    <option value="Main Dishes">Main Dishes</option>
                    <option value="Pasta & Pizza">Pasta & Pizza</option>
                    <option value="Drinks & Coffee">Drinks & Coffee</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Price (e.g. 120,000 UZS)"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Short Description (ingredients, details)"
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddDish}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-600"
                >
                  <Plus size={16} /> Add Dish
                </button>
              </div>

              {/* Menu Items List */}
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {menuItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-orange-600 uppercase">
                          {item.category}
                        </span>
                        <span className="text-sm font-black text-gray-950">{item.price}</span>
                      </div>
                      <h4 className="font-black text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: STAFF SETUP ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-950">Staff & Team Roles (Optional)</h2>
                  <p className="text-sm text-gray-500">
                    Add managers, hostesses, and waiters to manage table bookings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 shadow-xs"
                >
                  Continue to Widgets <ArrowRight size={16} />
                </button>
              </div>

              {/* Form */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                <h3 className="text-sm font-black text-gray-900">Add Staff Member</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) =>
                      setNewStaffRole(e.target.value as StaffMember["role"])
                    }
                    className="rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Hostess">Hostess</option>
                    <option value="Waiter">Waiter</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-600"
                >
                  <Plus size={16} /> Add Team Member
                </button>
              </div>

              {/* Staff cards */}
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {staffList.map((st, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-black">
                        {st.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{st.full_name}</p>
                        <p className="text-xs font-bold text-orange-600">{st.role}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 font-bold">{st.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: WIDGET SETUP ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-950">Website Widget & QR Code</h2>
                  <p className="text-sm text-gray-500">
                    Embed booking widget on your website or share QR code with guests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 shadow-xs"
                >
                  Continue to Notifications <ArrowRight size={16} />
                </button>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {/* iFrame Code */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-orange-600 font-black">
                    <Code size={20} /> iFrame Embed Code
                  </div>
                  <p className="text-xs text-gray-500">
                    Copy and paste this snippet into your website or Instagram link.
                  </p>
                  <pre className="rounded-xl bg-gray-900 p-3 text-[11px] text-green-400 overflow-x-auto">
                    {`<iframe src="https://dineflow.uz/widget/${restaurant?.id || "demo"}" width="100%" height="600px"></iframe>`}
                  </pre>
                </div>

                {/* QR Code Preview */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-orange-600 font-black">
                    <QrCode size={20} /> Booking QR Code
                  </div>
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-white p-2 border shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://dineflow.uz/restaurants/${restaurant?.id || "demo"}`}
                      alt="Booking QR"
                      className="h-full w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-bold">Scan to open table booking</p>
                </div>

                {/* Direct Link */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-orange-600 font-black">
                    <Send size={20} /> Direct Mini-App Link
                  </div>
                  <p className="text-xs text-gray-500">
                    Share this direct booking link in Telegram or social media.
                  </p>
                  <input
                    readOnly
                    value={`https://dineflow.uz/restaurants/${restaurant?.id || "demo"}`}
                    className="w-full rounded-xl border bg-white px-3 py-2 text-xs font-bold text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: NOTIFICATIONS & FINISH ================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xs">
              <h2 className="text-2xl font-black text-gray-950">Notification Preferences</h2>
              <p className="text-sm text-gray-500">
                Choose how your team receives instant booking notifications.
              </p>

              <div className="mt-8 max-w-xl space-y-4">
                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="text-orange-500" />
                    <div>
                      <p className="font-black text-gray-900">SMS Booking Alerts</p>
                      <p className="text-xs text-gray-500">Receive SMS whenever a guest books a table.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotify}
                    onChange={(e) => setSmsNotify(e.target.checked)}
                    className="h-5 w-5 accent-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <Send className="text-sky-500" />
                    <div>
                      <p className="font-black text-gray-900">Telegram Bot Notifications</p>
                      <p className="text-xs text-gray-500">Send updates to your manager Telegram group.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={telegramNotify}
                    onChange={(e) => setTelegramNotify(e.target.checked)}
                    className="h-5 w-5 accent-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="text-amber-500" />
                    <div>
                      <p className="font-black text-gray-900">Email Summaries</p>
                      <p className="text-xs text-gray-500">Receive daily booking reports via email.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotify}
                    onChange={(e) => setEmailNotify(e.target.checked)}
                    className="h-5 w-5 accent-orange-500"
                  />
                </div>
              </div>

              {/* Complete Action Button */}
              <div className="mt-10 border-t pt-6 flex justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCompleteOnboarding}
                  className="flex items-center gap-3 rounded-2xl bg-orange-500 px-8 py-4 text-lg font-black text-white hover:bg-orange-600 disabled:opacity-70 shadow-lg shadow-orange-500/20"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <Check size={22} />
                  )}
                  {saving ? "Saving Onboarding Configuration..." : "Complete Setup & Open Dashboard"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
