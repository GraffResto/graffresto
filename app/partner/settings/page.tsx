"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Save,
  Utensils,
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
  updateDoc,
  onAuthStateChanged,
} from "@/lib/firebase";

type Restaurant = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  image_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  is_open: boolean;
  approval_status: string | null;
};

const settingsText = {
  en: {
    back: "Back to Partner Panel",
    label: "Restaurant Settings",
    title: "Edit restaurant profile",
    subtitle:
      "Update your restaurant information. Customers will see this information on the booking page.",
    noRestaurant: "No restaurant found",
    noRestaurantText:
      "This partner account does not have a restaurant yet, or the restaurant is not connected.",
    loading: "Loading restaurant...",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Restaurant settings saved successfully.",
    basicInfo: "Basic Information",
    restaurantName: "Restaurant Name",
    description: "Description",
    cuisineType: "Cuisine Type",
    city: "City",
    address: "Address",
    phone: "Phone Number",
    imageUrl: "Image URL",
    workingHours: "Working Hours",
    openingTime: "Opening Time",
    closingTime: "Closing Time",
    status: "Restaurant Status",
    open: "Open",
    closed: "Closed",
    preview: "Preview",
    previewText:
      "This is how your restaurant image and main information may appear to customers.",
    namePlaceholder: "Bella Vista",
    descriptionPlaceholder: "Write a short description about your restaurant",
    cuisinePlaceholder: "Italian, Uzbek, Korean...",
    cityPlaceholder: "Tashkent",
    addressPlaceholder: "Full restaurant address",
    phonePlaceholder: "+998 90 123 45 67",
    imagePlaceholder: "https://...",
  },

  uz: {
    back: "Partner panelga qaytish",
    label: "Restoran sozlamalari",
    title: "Restoran profilini tahrirlash",
    subtitle:
      "Restoran ma’lumotlarini yangilang. Mijozlar bu ma’lumotlarni booking sahifasida ko‘radi.",
    noRestaurant: "Restoran topilmadi",
    noRestaurantText:
      "Bu partner akkauntiga restoran biriktirilmagan yoki restoran ulanmagan.",
    loading: "Restoran yuklanmoqda...",
    save: "O‘zgarishlarni saqlash",
    saving: "Saqlanmoqda...",
    saved: "Restoran sozlamalari muvaffaqiyatli saqlandi.",
    basicInfo: "Asosiy ma’lumotlar",
    restaurantName: "Restoran nomi",
    description: "Tavsif",
    cuisineType: "Oshxona turi",
    city: "Shahar",
    address: "Manzil",
    phone: "Telefon raqam",
    imageUrl: "Rasm URL",
    workingHours: "Ish vaqti",
    openingTime: "Ochilgan vaqti",
    closingTime: "Yopilgan vaqti",
    status: "Restoran holati",
    open: "Ochiq",
    closed: "Yopiq",
    preview: "Ko‘rinish",
    previewText:
      "Mijozlarga restoran rasmi va asosiy ma’lumotlar taxminan shunday ko‘rinadi.",
    namePlaceholder: "Bella Vista",
    descriptionPlaceholder: "Restoraningiz haqida qisqa tavsif yozing",
    cuisinePlaceholder: "Italyan, O‘zbek, Koreys...",
    cityPlaceholder: "Toshkent",
    addressPlaceholder: "Restoranning to‘liq manzili",
    phonePlaceholder: "+998 90 123 45 67",
    imagePlaceholder: "https://...",
  },

  ru: {
    back: "Назад в партнёрский кабинет",
    label: "Настройки ресторана",
    title: "Редактировать профиль ресторана",
    subtitle:
      "Обновите информацию о ресторане. Клиенты увидят эти данные на странице бронирования.",
    noRestaurant: "Ресторан не найден",
    noRestaurantText:
      "К этому партнёрскому аккаунту ресторан не привязан или ресторан не подключён.",
    loading: "Загрузка ресторана...",
    save: "Сохранить изменения",
    saving: "Сохранение...",
    saved: "Настройки ресторана успешно сохранены.",
    basicInfo: "Основная информация",
    restaurantName: "Название ресторана",
    description: "Описание",
    cuisineType: "Тип кухни",
    city: "Город",
    address: "Адрес",
    phone: "Номер телефона",
    imageUrl: "URL изображения",
    workingHours: "Рабочие часы",
    openingTime: "Время открытия",
    closingTime: "Время закрытия",
    status: "Статус ресторана",
    open: "Открыто",
    closed: "Закрыто",
    preview: "Предпросмотр",
    previewText:
      "Так изображение и основная информация ресторана могут выглядеть для клиентов.",
    namePlaceholder: "Bella Vista",
    descriptionPlaceholder: "Напишите короткое описание ресторана",
    cuisinePlaceholder: "Итальянская, Узбекская, Корейская...",
    cityPlaceholder: "Ташкент",
    addressPlaceholder: "Полный адрес ресторана",
    phonePlaceholder: "+998 90 123 45 67",
    imagePlaceholder: "https://...",
  },
};

export default function PartnerSettingsPage() {
  const { language } = useLanguage();
  const text = settingsText[language];

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("23:00");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRestaurant(null);
        setIsLoading(false);
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setRestaurant(null);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        const rData = { id: rDoc.id, ...rDoc.data() } as Restaurant;

        setRestaurant(rData);
        setName(rData.name || "");
        setDescription(rData.description || "");
        setCuisineType(rData.cuisine_type || "");
        setCity(rData.city || "");
        setAddress(rData.address || "");
        setPhone(rData.phone || "");
        setImageUrl(rData.image_url || "");
        setOpeningTime(rData.opening_time || "09:00");
        setClosingTime(rData.closing_time || "23:00");
        setIsOpen(Boolean(rData.is_open ?? true));
      } catch (error) {
        console.error("Settings load error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleSave() {
    if (!restaurant) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "restaurants", restaurant.id), {
        name,
        description,
        cuisine_type: cuisineType,
        city,
        address,
        phone,
        image_url: imageUrl,
        opening_time: openingTime,
        closing_time: closingTime,
        is_open: isOpen,
      });

      setRestaurant({
        ...restaurant,
        name,
        description,
        cuisine_type: cuisineType,
        city,
        address,
        phone,
        image_url: imageUrl,
        opening_time: openingTime,
        closing_time: closingTime,
        is_open: isOpen,
      });

      setMessage(text.saved);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error saving restaurant settings.");
    } finally {
      setIsSaving(false);
    }
  }

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
            <Building2 className="mx-auto text-orange-500" size={46} />

            <h1 className="mt-4 text-3xl font-black text-gray-950">
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

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-bold text-orange-600">{text.label}</p>

            <h1 className="mt-2 text-4xl font-black text-gray-950">
              {text.title}
            </h1>

            <p className="mt-3 max-w-2xl text-gray-600">{text.subtitle}</p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}

            {isSaving ? text.saving : text.save}
          </button>
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

        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <section className="space-y-8">
            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Building2 className="text-orange-500" />
                <h2 className="text-2xl font-black text-gray-950">
                  {text.basicInfo}
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.restaurantName}
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={text.namePlaceholder}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.cuisineType}
                  </label>
                  <input
                    value={cuisineType}
                    onChange={(event) => setCuisineType(event.target.value)}
                    placeholder={text.cuisinePlaceholder}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={text.descriptionPlaceholder}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.city}
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-3.5 text-gray-400"
                      size={18}
                    />
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder={text.cityPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 pl-11 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.phone}
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-3.5 text-gray-400"
                      size={18}
                    />
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder={text.phonePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 pl-11 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.address}
                  </label>
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder={text.addressPlaceholder}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.imageUrl}
                  </label>
                  <div className="relative">
                    <ImageIcon
                      className="absolute left-4 top-3.5 text-gray-400"
                      size={18}
                    />
                    <input
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder={text.imagePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 pl-11 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Clock className="text-orange-500" />
                <h2 className="text-2xl font-black text-gray-950">
                  {text.workingHours}
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.openingTime}
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(event) => setOpeningTime(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.closingTime}
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(event) => setClosingTime(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    {text.status}
                  </label>
                  <select
                    value={isOpen ? "open" : "closed"}
                    onChange={(event) => setIsOpen(event.target.value === "open")}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                  >
                    <option value="open">{text.open}</option>
                    <option value="closed">{text.closed}</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-8">
            <h2 className="text-2xl font-black text-gray-950">
              {text.preview}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {text.previewText}
            </p>

            <div className="mt-6 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
              <div
                className="h-56 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    imageUrl ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
                  })`,
                }}
              />

              <div className="p-5">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-black ${
                    isOpen
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {isOpen ? text.open : text.closed}
                </span>

                <h3 className="mt-4 text-2xl font-black text-gray-950">
                  {name || text.restaurantName}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {cuisineType || text.cuisineType} • {city || text.city}
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {description || text.descriptionPlaceholder}
                </p>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>{address || text.addressPlaceholder}</p>
                  <p>{phone || text.phonePlaceholder}</p>
                  <p>
                    {openingTime} - {closingTime}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}

              {isSaving ? text.saving : text.save}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}