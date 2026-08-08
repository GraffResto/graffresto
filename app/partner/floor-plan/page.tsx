"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Armchair,
  Loader2,
  Plus,
  Save,
  Trash2,
  Utensils,
} from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";
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
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  onAuthStateChanged,
} from "@/lib/firebase";

type Restaurant = {
  id: string;
  name: string;
  city: string | null;
  cuisine_type: string | null;
};

type EditableTable = {
  id: string;
  restaurant_id: string;
  table_name: string;
  seats: number;
  zone: string | null;
  status: string;
  shape: string | null;
  position_x: number | null;
  position_y: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  color: string | null;
};

const floorPlanText = {
  en: {
    back: "Back to Partner Panel",
    title: "Editable Floor Map",
    subtitle:
      "Create and edit your restaurant table layout. Customers will see this map when booking.",
    noRestaurant: "No restaurant found",
    noRestaurantText:
      "Your partner account does not have a restaurant yet, or it has not been created.",
    addTable: "Add Table",
    saveLayout: "Save Layout",
    saving: "Saving...",
    saved: "Floor map saved successfully.",
    selectTable: "Select a table to edit",
    selectedTable: "Selected Table",
    tableName: "Table Name",
    seats: "Seats",
    zone: "Zone",
    status: "Status",
    shape: "Shape",
    color: "Color",
    width: "Width",
    height: "Height",
    rotation: "Rotation",
    positionX: "Position X",
    positionY: "Position Y",
    deleteTable: "Delete Table",
    available: "available",
    booked: "booked",
    reserved: "reserved",
    blocked: "blocked",
    square: "square",
    rectangle: "rectangle",
    circle: "circle",
    diamond: "diamond",
    hint: "Drag tables on the map to move them.",
  },
  uz: {
    back: "Partner panelga qaytish",
    title: "Tahrirlanadigan Floor Map",
    subtitle:
      "Restoraningiz stol joylashuvini yarating va tahrirlang. Mijozlar bron qilganda shu xaritani ko‘radi.",
    noRestaurant: "Restoran topilmadi",
    noRestaurantText:
      "Partner akkauntingizda hali restoran yo‘q yoki restoran yaratilmagan.",
    addTable: "Stol qo‘shish",
    saveLayout: "Layout saqlash",
    saving: "Saqlanmoqda...",
    saved: "Floor map muvaffaqiyatli saqlandi.",
    selectTable: "Tahrirlash uchun stol tanlang",
    selectedTable: "Tanlangan stol",
    tableName: "Stol nomi",
    seats: "O‘rinlar",
    zone: "Zona",
    status: "Status",
    shape: "Shakl",
    color: "Rang",
    width: "Kenglik",
    height: "Balandlik",
    rotation: "Aylantirish",
    positionX: "Position X",
    positionY: "Position Y",
    deleteTable: "Stolni o‘chirish",
    available: "available",
    booked: "booked",
    reserved: "reserved",
    blocked: "blocked",
    square: "square",
    rectangle: "rectangle",
    circle: "circle",
    diamond: "diamond",
    hint: "Stollarni joyini o‘zgartirish uchun map ustida sudrang.",
  },
  ru: {
    back: "Назад в партнёрский кабинет",
    title: "Редактируемый план зала",
    subtitle:
      "Создавайте и редактируйте расположение столов. Клиенты увидят эту карту при бронировании.",
    noRestaurant: "Ресторан не найден",
    noRestaurantText:
      "У вашего партнёрского аккаунта пока нет ресторана или он не создан.",
    addTable: "Добавить стол",
    saveLayout: "Сохранить",
    saving: "Сохранение...",
    saved: "План зала успешно сохранён.",
    selectTable: "Выберите стол для редактирования",
    selectedTable: "Выбранный стол",
    tableName: "Название стола",
    seats: "Места",
    zone: "Зона",
    status: "Статус",
    shape: "Форма",
    color: "Цвет",
    width: "Ширина",
    height: "Высота",
    rotation: "Поворот",
    positionX: "Position X",
    positionY: "Position Y",
    deleteTable: "Удалить стол",
    available: "available",
    booked: "booked",
    reserved: "reserved",
    blocked: "blocked",
    square: "square",
    rectangle: "rectangle",
    circle: "circle",
    diamond: "diamond",
    hint: "Перетаскивайте столы на карте, чтобы изменить их место.",
  },
};

export default function PartnerFloorPlanPage() {
  const { language } = useLanguage();
  const text = floorPlanText[language];

  const floorRef = useRef<HTMLDivElement | null>(null);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<EditableTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [draggingTableId, setDraggingTableId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRestaurant(null);
        setTables([]);
        setIsLoading(false);
        return;
      }

      try {
        const rQuery = query(
          collection(db, "restaurants"),
          where("owner_id", "==", user.uid)
        );
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setRestaurant(null);
          setTables([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        const rData = { id: rDoc.id, ...rDoc.data() } as Restaurant;
        setRestaurant(rData);

        const tQuery = query(
          collection(db, "tables"),
          where("restaurant_id", "==", rData.id)
        );

        const unsubTables = onSnapshot(tQuery, (tSnap) => {
          const tableList: EditableTable[] = tSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as EditableTable[];

          setTables(tableList);
          setIsLoading(false);
        });

        return () => unsubTables();
      } catch (error: any) {
        console.error("Error loading floor plan:", error);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  function getTableShape(table: EditableTable) {
    if (table.shape === "circle") {
      return "rounded-full";
    }
    return "rounded-2xl";
  }

  function getTableStatusColor(table: EditableTable) {
    if (table.id === selectedTableId) {
      return "#f97316";
    }

    if (table.status === "reserved") {
      return "#a855f7";
    }

    if (table.status === "booked") {
      return "#6b7280";
    }

    if (table.status === "blocked") {
      return "#94a3b8";
    }

    return table.color || "#38bdf8";
  }

  function updateSelectedTable<K extends keyof EditableTable>(
    key: K,
    value: EditableTable[K]
  ) {
    if (!selectedTableId) {
      return;
    }

    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === selectedTableId
          ? {
              ...table,
              [key]: value,
            }
          : table
      )
    );
  }

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    tableId: string
  ) {
    event.preventDefault();
    setSelectedTableId(tableId);
    setDraggingTableId(tableId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingTableId || !floorRef.current) {
      return;
    }

    const floorRect = floorRef.current.getBoundingClientRect();
    const table = tables.find((item) => item.id === draggingTableId);

    if (!table) {
      return;
    }

    const tableWidth = table.width || 100;
    const tableHeight = table.height || 100;

    const nextX = Math.max(
      0,
      Math.min(event.clientX - floorRect.left - tableWidth / 2, floorRect.width - tableWidth)
    );

    const nextY = Math.max(
      0,
      Math.min(event.clientY - floorRect.top - tableHeight / 2, floorRect.height - tableHeight)
    );

    setTables((currentTables) =>
      currentTables.map((item) =>
        item.id === draggingTableId
          ? {
              ...item,
              position_x: Math.round(nextX),
              position_y: Math.round(nextY),
            }
          : item
      )
    );
  }

  function handlePointerUp() {
    setDraggingTableId("");
  }

  async function handleAddTable() {
    if (!restaurant) {
      return;
    }

    const nextNumber = tables.length + 1;
    const newTableData = {
      restaurant_id: restaurant.id,
      table_name: `T${nextNumber}`,
      seats: 2,
      zone: "Zone 1",
      status: "available",
      shape: "square",
      position_x: 80 + (tables.length % 4) * 130,
      position_y: 90 + Math.floor(tables.length / 4) * 130,
      width: 100,
      height: 100,
      rotation: 0,
      color: "#38bdf8",
    };

    try {
      const docRef = await addDoc(collection(db, "tables"), newTableData);
      const createdTable: EditableTable = { id: docRef.id, ...newTableData };

      setTables((currentTables) => [...currentTables, createdTable]);
      setSelectedTableId(createdTable.id);
      setMessage("");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error adding table.");
    }
  }

  async function handleSaveLayout() {
    setIsSaving(true);
    setMessage("");

    try {
      for (const table of tables) {
        const tableRef = doc(db, "tables", table.id);
        await updateDoc(tableRef, {
          table_name: table.table_name,
          seats: Number(table.seats),
          zone: table.zone || "Zone 1",
          status: table.status,
          shape: table.shape || "square",
          position_x: Number(table.position_x || 0),
          position_y: Number(table.position_y || 0),
          width: Number(table.width || 100),
          height: Number(table.height || 100),
          rotation: Number(table.rotation || 0),
          color: table.color || "#38bdf8",
        });
      }
      setMessage(text.saved);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error saving floor map.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTable() {
    if (!selectedTable) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tables", selectedTable.id));
      setTables((currentTables) =>
        currentTables.filter((table) => table.id !== selectedTable.id)
      );
      setSelectedTableId("");
      setMessage("");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error deleting table.");
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5]">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-orange-500" />
          <span className="font-bold text-gray-700">Loading...</span>
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
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white"
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

      <section className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/partner"
          className="mb-6 inline-flex items-center gap-2 font-bold text-gray-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          {text.back}
        </Link>

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-bold text-orange-600">
              {restaurant.name} • {restaurant.city || "City"}
            </p>

            <h1 className="mt-2 text-4xl font-black text-gray-950">
              {text.title}
            </h1>

            <p className="mt-3 max-w-2xl text-gray-600">{text.subtitle}</p>

            <p className="mt-3 text-sm font-bold text-gray-500">
              {text.hint}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddTable}
              className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-5 py-3 font-black text-orange-600 hover:bg-orange-50"
            >
              <Plus size={18} />
              {text.addTable}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveLayout}
              className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? text.saving : text.saveLayout}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-bold ${
              message === text.saved
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.75fr]">
          <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-sky-100 bg-white p-4">
              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl bg-sky-500 px-5 py-3 font-black text-white">
                  Main Hall
                </button>
              </div>
            </div>

            <div
              ref={floorRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative h-[700px] overflow-hidden bg-[#f8fbff]"
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage:
                    "linear-gradient(#e5edf7 1px, transparent 1px), linear-gradient(90deg, #e5edf7 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />

              <div className="absolute left-10 top-20 h-[470px] w-[88%] rounded-[2rem] border-[10px] border-gray-200 opacity-70" />

              {tables.map((table) => {
                const width = table.width || 100;
                const height = table.height || 100;
                const positionX = table.position_x || 80;
                const positionY = table.position_y || 80;
                const rotation =
                  table.shape === "diamond" ? 45 : table.rotation || 0;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onPointerDown={(event) =>
                      handlePointerDown(event, table.id)
                    }
                    style={{
                      left: positionX,
                      top: positionY,
                      width,
                      height,
                      backgroundColor: getTableStatusColor(table),
                      transform: `rotate(${rotation}deg)`,
                    }}
                    className={`absolute flex cursor-move flex-col items-center justify-center border-[6px] border-white text-white shadow-lg transition hover:scale-105 ${getTableShape(
                      table
                    )}`}
                  >
                    <span
                      className={`flex flex-col items-center justify-center ${
                        table.shape === "diamond" ? "-rotate-45" : ""
                      }`}
                    >
                      <Armchair size={22} />
                      <span className="mt-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-black">
                        {table.seats}
                      </span>
                      <span className="mt-1 text-xl font-black">
                        {table.table_name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-8">
            {selectedTable ? (
              <div>
                <h2 className="text-2xl font-black text-gray-950">
                  {text.selectedTable}
                </h2>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.tableName}
                    </label>
                    <input
                      value={selectedTable.table_name}
                      onChange={(event) =>
                        updateSelectedTable("table_name", event.target.value)
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        {text.seats}
                      </label>
                      <input
                        type="number"
                        value={selectedTable.seats}
                        onChange={(event) =>
                          updateSelectedTable(
                            "seats",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        {text.zone}
                      </label>
                      <input
                        value={selectedTable.zone || ""}
                        onChange={(event) =>
                          updateSelectedTable("zone", event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.status}
                    </label>
                    <select
                      value={selectedTable.status}
                      onChange={(event) =>
                        updateSelectedTable("status", event.target.value)
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    >
                      <option value="available">{text.available}</option>
                      <option value="booked">{text.booked}</option>
                      <option value="reserved">{text.reserved}</option>
                      <option value="blocked">{text.blocked}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.shape}
                    </label>
                    <select
                      value={selectedTable.shape || "square"}
                      onChange={(event) =>
                        updateSelectedTable("shape", event.target.value)
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    >
                      <option value="square">{text.square}</option>
                      <option value="rectangle">{text.rectangle}</option>
                      <option value="circle">{text.circle}</option>
                      <option value="diamond">{text.diamond}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.color}
                    </label>
                    <input
                      type="color"
                      value={selectedTable.color || "#38bdf8"}
                      onChange={(event) =>
                        updateSelectedTable("color", event.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-gray-200 p-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        {text.width}
                      </label>
                      <input
                        type="number"
                        value={selectedTable.width || 100}
                        onChange={(event) =>
                          updateSelectedTable(
                            "width",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        {text.height}
                      </label>
                      <input
                        type="number"
                        value={selectedTable.height || 100}
                        onChange={(event) =>
                          updateSelectedTable(
                            "height",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteTable}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 font-bold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                    {text.deleteTable}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">{text.selectTable}</p>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}