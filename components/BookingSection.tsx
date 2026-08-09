"use client";

import { useState } from "react";
import {
  Armchair,
  CalendarDays,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import {
  auth,
  db,
  collection,
  addDoc,
} from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageProvider";

type RestaurantTable = {
  id: string;
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

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

type BookingSectionProps = {
  restaurantId: string;
  tables: RestaurantTable[];
  menuItems: MenuItem[];
};

const bookingText = {
  en: {
    floorMap: "Choose Your Table",
    floorMapSubtitle: "Select an available table from the restaurant floor map.",
    available: "Available", booked: "Booked", reserved: "Reserved",
    blocked: "Blocked", selected: "Selected", seats: "seats", table: "Table",
    selectedTable: "Selected table", noTableSelected: "No table selected",
    menu: "Pre-order Menu", menuSubtitle: "Pre-order your meals before arrival.",
    noMenu: "No menu items yet.",
    bookingForm: "Booking Details", bookingFormText: "Fill in your reservation details.",
    name: "Your Name", namePlaceholder: "John Smith",
    phone: "Phone Number", phonePlaceholder: "+998 90 123 45 67",
    arrivalDate: "Date", arrivalTime: "Arrival Time", departureTime: "Departure Time",
    guests: "Number of Guests",
    occasionLabel: "Occasion",
    occasions: { none: "Regular visit", birthday: "🎂 Birthday", anniversary: "💍 Anniversary", business: "💼 Business dinner", graduation: "🎓 Graduation", proposal: "💝 Proposal", other: "Other" },
    seatingLabel: "Seating Preference",
    seatings: { any: "No preference", indoor: "Indoor", outdoor: "Outdoor / Terrace", quiet: "Quiet corner", window: "Window seat" },
    notesLabel: "Special Requests & Allergies",
    notesPlaceholder: "Allergies, dietary requirements, high chair needed, birthday cake...",
    prepaymentLabel: "Prepayment",
    prepaymentNone: "No prepayment",
    prepaymentHalf: "50% deposit (15% penalty if no-show)",
    prepaymentFull: "100% full payment (delivery if no-show)",
    deliveryAddressLabel: "Delivery address (for no-show fallback)",
    deliveryAddressPlaceholder: "Your address in case of no-show...",
    preorder: "Pre-order summary", noMeals: "No meals selected yet.",
    total: "Total", confirm: "Confirm Booking", saving: "Saving...",
    chooseTableError: "Please select an available table first.",
    fillError: "Please fill in name, phone, date and arrival time.",
    loginError: "Please login again before booking.",
    success: "Booking created successfully! Restaurant will confirm soon.",
    bookingError: "Booking error:",
  },
  uz: {
    floorMap: "Stolingizni tanlang",
    floorMapSubtitle: "Restoran floor map'idan bo'sh stol tanlang.",
    available: "Bo'sh", booked: "Band", reserved: "Rezerv",
    blocked: "Bloklangan", selected: "Tanlangan", seats: "o'rin", table: "Stol",
    selectedTable: "Tanlangan stol", noTableSelected: "Stol tanlanmagan",
    menu: "Oldindan buyurtma", menuSubtitle: "Kelishdan oldin ovqatlarni buyurtma qiling.",
    noMenu: "Hali menyu itemlari yo'q.",
    bookingForm: "Bron ma'lumotlari", bookingFormText: "Bron qilish uchun to'ldiring.",
    name: "Ismingiz", namePlaceholder: "Ali Valiyev",
    phone: "Telefon raqam", phonePlaceholder: "+998 90 123 45 67",
    arrivalDate: "Sana", arrivalTime: "Kelish vaqti", departureTime: "Ketish vaqti",
    guests: "Mehmonlar soni",
    occasionLabel: "Tashrif sababi",
    occasions: { none: "Oddiy tashrif", birthday: "🎂 Tug'ilgan kun", anniversary: "💍 Yillik yubiley", business: "💼 Biznes kechlik", graduation: "🎓 Bitirish", proposal: "💝 Sovchilik", other: "Boshqa" },
    seatingLabel: "O'tirish joyi",
    seatings: { any: "Farqi yo'q", indoor: "Ichkarida", outdoor: "Tashqarida / Terassa", quiet: "Tinch burchak", window: "Deraza yonida" },
    notesLabel: "Maxsus so'rovlar va allergiya",
    notesPlaceholder: "Allergiya, vegetarian, bolalar o'rindig'i, tort...",
    prepaymentLabel: "Oldindan to'lov",
    prepaymentNone: "To'lovsiz bron",
    prepaymentHalf: "50% depozit (kelmasa 15% jarima)",
    prepaymentFull: "100% to'liq (kelmasa dastavka)",
    deliveryAddressLabel: "Dastavka manzili (kelmagan taqdirda)",
    deliveryAddressPlaceholder: "Kelmagan taqdirda dastavka manzili...",
    preorder: "Oldindan buyurtma", noMeals: "Hali ovqat tanlanmagan.",
    total: "Jami", confirm: "Bronni tasdiqlash", saving: "Saqlanmoqda...",
    chooseTableError: "Avval bo'sh stol tanlang.",
    fillError: "Ism, telefon, sana va kelish vaqtini to'ldiring.",
    loginError: "Iltimos qayta login qiling.",
    success: "Bron muvaffaqiyatli yaratildi! Restoran tez orada tasdiqlaydi.",
    bookingError: "Bron xatosi:",
  },
  ru: {
    floorMap: "Выберите стол",
    floorMapSubtitle: "Выберите свободный стол на карте зала.",
    available: "Свободен", booked: "Занят", reserved: "Резерв",
    blocked: "Блок", selected: "Выбран", seats: "мест", table: "Стол",
    selectedTable: "Выбранный стол", noTableSelected: "Стол не выбран",
    menu: "Предзаказ", menuSubtitle: "Закажите блюда до прихода.",
    noMenu: "Меню пока не добавлено.",
    bookingForm: "Детали брони", bookingFormText: "Заполните данные бронирования.",
    name: "Ваше имя", namePlaceholder: "Иван Иванов",
    phone: "Телефон", phonePlaceholder: "+998 90 123 45 67",
    arrivalDate: "Дата", arrivalTime: "Время прихода", departureTime: "Время ухода",
    guests: "Количество гостей",
    occasionLabel: "Повод",
    occasions: { none: "Обычный визит", birthday: "🎂 День рождения", anniversary: "💍 Годовщина", business: "💼 Бизнес-ужин", graduation: "🎓 Выпускной", proposal: "💝 Предложение", other: "Другое" },
    seatingLabel: "Предпочтение по месту",
    seatings: { any: "Без предпочтений", indoor: "Внутри", outdoor: "Улица / Терраса", quiet: "Тихий уголок", window: "У окна" },
    notesLabel: "Особые пожелания и аллергии",
    notesPlaceholder: "Аллергии, вегетарианское меню, детский стул, торт...",
    prepaymentLabel: "Предоплата",
    prepaymentNone: "Без предоплаты",
    prepaymentHalf: "50% депозит (штраф 15% при неявке)",
    prepaymentFull: "100% полная оплата (доставка при неявке)",
    deliveryAddressLabel: "Адрес доставки (при неявке)",
    deliveryAddressPlaceholder: "Ваш адрес на случай неявки...",
    preorder: "Предзаказ", noMeals: "Блюда не выбраны.",
    total: "Итого", confirm: "Подтвердить бронь", saving: "Сохранение...",
    chooseTableError: "Сначала выберите свободный стол.",
    fillError: "Заполните имя, телефон, дату и время прихода.",
    loginError: "Пожалуйста, войдите снова.",
    success: "Бронь успешно создана! Ресторан скоро подтвердит.",
    bookingError: "Ошибка бронирования:",
  },
};

function tableColor(status: string, isSelected: boolean) {
  if (isSelected) return "bg-orange-500 text-white border-orange-600";
  if (status === "available") return "bg-green-50 border-green-300 text-green-800 hover:bg-green-100 cursor-pointer";
  if (status === "booked") return "bg-red-50 border-red-200 text-red-400 cursor-not-allowed";
  if (status === "reserved") return "bg-yellow-50 border-yellow-300 text-yellow-600 cursor-not-allowed";
  return "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed";
}

export default function BookingSection({ restaurantId, tables, menuItems }: BookingSectionProps) {
  const { language } = useLanguage();
  const text = bookingText[language];

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [guestsCount, setGuestsCount] = useState("2");
  const [occasion, setOccasion] = useState("none");
  const [seatingPreference, setSeatingPreference] = useState("any");
  const [specialNotes, setSpecialNotes] = useState("");
  const [prepaymentType, setPrepaymentType] = useState("none");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function addMenuItem(id: string) {
    setSelectedItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function removeMenuItem(id: string) {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  }

  const selectedMenuItems = menuItems
    .filter((item) => selectedItems[item.id])
    .map((item) => ({ ...item, quantity: selectedItems[item.id] }));

  const totalAmount = selectedMenuItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );

  async function handleBookingSubmit() {
    if (!selectedTable) { setMessage(text.chooseTableError); return; }
    if (!customerName || !customerPhone || !bookingDate || !arrivalTime) {
      setMessage(text.fillError); return;
    }

    setIsSaving(true);
    setMessage("");

    const currentUser = auth.currentUser;
    if (!currentUser) { setMessage(text.loginError); setIsSaving(false); return; }

    try {
      const prepaymentAmount = prepaymentType === "full"
        ? totalAmount
        : prepaymentType === "half"
        ? Math.round(totalAmount * 0.5)
        : 0;

      const bookingData = {
        customer_id: currentUser.uid,
        restaurant_id: restaurantId,
        table_id: selectedTable.id,
        table_name: selectedTable.table_name,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: currentUser.email || "",
        booking_date: bookingDate,
        booking_time: arrivalTime,
        departure_time: departureTime || null,
        guests_count: parseInt(guestsCount),
        status: "pending",
        occasion,
        seating_preference: seatingPreference,
        notes: specialNotes || null,
        prepayment_type: prepaymentType,
        prepayment_amount: prepaymentAmount,
        total_amount: totalAmount,
        preorder_items: selectedMenuItems.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        delivery_address: prepaymentType === "full" ? deliveryAddress || null : null,
        created_at: new Date().toISOString(),
      };

      await addDoc(collection(db, "bookings"), bookingData);

      setMessage(text.success);
      setSelectedTable(null);
      setSelectedItems({});
      setCustomerName(""); setCustomerPhone(""); setBookingDate("");
      setArrivalTime(""); setDepartureTime(""); setGuestsCount("2");
      setOccasion("none"); setSeatingPreference("any");
      setSpecialNotes(""); setPrepaymentType("none"); setDeliveryAddress("");
    } catch (error: any) {
      console.error("Booking submit error:", error);
      setMessage(`${text.bookingError} ${error?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        {/* Floor Map Section */}
        <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-gray-950">{text.floorMap}</h2>
            <p className="mt-1 text-sm text-gray-500">{text.floorMapSubtitle}</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-400" />{text.available}</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-500" />{text.selected}</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400" />{text.booked}</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-yellow-400" />{text.reserved}</span>
          </div>

          {tables.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">No tables available for this restaurant.</p>
          ) : (
            <div className="relative min-h-[360px] w-full rounded-2xl border border-gray-100 bg-gray-50 p-4">
              {tables.map((tbl) => {
                const isSelected = selectedTable?.id === tbl.id;
                const isAvailable = tbl.status === "available";
                const posX = tbl.position_x ?? 50;
                const posY = tbl.position_y ?? 50;
                const width = tbl.width ?? 90;
                const height = tbl.height ?? 70;

                return (
                  <button
                    key={tbl.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedTable(isAvailable ? tbl : null)}
                    className={`absolute flex flex-col items-center justify-center rounded-2xl border text-xs font-bold transition shadow-sm ${tableColor(tbl.status, isSelected)}`}
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      backgroundColor: isSelected ? undefined : tbl.color || undefined,
                    }}
                  >
                    <span>{tbl.table_name}</span>
                    <span className="text-[10px] opacity-75">{tbl.seats} {text.seats}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Pre-order Menu Section */}
        {menuItems.length > 0 && (
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-black text-gray-950">{text.menu}</h2>
              <p className="mt-1 text-sm text-gray-500">{text.menuSubtitle}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {menuItems.map((item) => {
                const qty = selectedItems[item.id] || 0;
                return (
                  <div key={item.id} className="flex gap-3 rounded-2xl border border-gray-100 p-3 shadow-xs">
                    {item.image_url && (
                      <div
                        className="h-20 w-20 flex-shrink-0 rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      />
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="font-bold text-gray-950 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                        <p className="mt-1 text-sm font-black text-orange-600">{Number(item.price).toLocaleString()} UZS</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {qty > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => removeMenuItem(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-bold"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-black text-gray-950">{qty}</span>
                            <button
                              type="button"
                              onClick={() => addMenuItem(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white font-bold"
                            >
                              <Plus size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addMenuItem(item.id)}
                            className="flex items-center gap-1 rounded-xl bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 hover:bg-orange-100"
                          >
                            <Plus size={12} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Booking Form Sidebar */}
      <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-8">
        <h2 className="text-2xl font-black text-gray-950">{text.bookingForm}</h2>
        <p className="mt-1 text-sm text-gray-500">{text.bookingFormText}</p>

        {selectedTable ? (
          <div className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-700">
            {text.selectedTable}: <strong>{selectedTable.table_name}</strong> ({selectedTable.seats} {text.seats})
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {text.noTableSelected}
          </div>
        )}

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <label className="mb-1 block font-bold text-gray-700">{text.name}</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={text.namePlaceholder}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-700">{text.phone}</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={text.phonePlaceholder}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-gray-700">{text.arrivalDate}</label>
              <input
                type="date"
                min={today}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-3 py-3 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-gray-700">{text.arrivalTime}</label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-3 py-3 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-700">{text.guests}</label>
            <select
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((g) => (
                <option key={g} value={g}>{g} {text.guests}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-700">{text.occasionLabel}</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            >
              {Object.entries(text.occasions).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-700">{text.notesLabel}</label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder={text.notesPlaceholder}
              rows={2}
              className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {selectedMenuItems.length > 0 && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <p className="font-black text-gray-950">{text.preorder}</p>
              <div className="mt-2 space-y-1 text-xs">
                {selectedMenuItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-bold">{(item.price * item.quantity).toLocaleString()} UZS</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-orange-200 pt-2 font-black text-gray-950">
                <span>{text.total}</span>
                <span className="text-orange-600">{totalAmount.toLocaleString()} UZS</span>
              </div>
            </div>
          )}

          {message && (
            <div className={`rounded-2xl p-3 text-xs font-bold ${message === text.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message}
            </div>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={handleBookingSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 font-black text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            {isSaving ? text.saving : text.confirm}
          </button>
        </div>
      </aside>
    </div>
  );
}