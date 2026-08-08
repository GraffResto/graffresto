"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
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
};

type MenuItem = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

const menuText = {
  en: {
    back: "Back to Partner Panel",
    title: "Menu Editor",
    subtitle:
      "Create and manage your restaurant menu. Customers will see available dishes during booking.",
    noRestaurant: "No restaurant found",
    noRestaurantText:
      "Your partner account does not have a restaurant yet, or it has not been created.",
    addItem: "Add Menu Item",
    saveChanges: "Save Changes",
    saving: "Saving...",
    saved: "Menu saved successfully.",
    selectItem: "Select a menu item to edit",
    selectedItem: "Selected Item",
    itemName: "Item Name",
    itemNamePlaceholder: "Margherita Pizza",
    category: "Category",
    categoryPlaceholder: "Pizza, Salad, Drink...",
    price: "Price",
    description: "Description",
    descriptionPlaceholder: "Short description of this meal",
    imageUrl: "Image URL",
    imageUrlPlaceholder: "https://...",
    available: "Available",
    unavailable: "Unavailable",
    deleteItem: "Delete Item",
    emptyTitle: "No menu items yet",
    emptyText: "Add your first dish so customers can pre-order meals.",
    preview: "Preview",
    status: "Status",
    item: "Item",
  },
  uz: {
    back: "Partner panelga qaytish",
    title: "Menyu tahrirlash",
    subtitle:
      "Restoran menyusini yarating va boshqaring. Mijozlar bron qilish paytida mavjud taomlarni ko‘radi.",
    noRestaurant: "Restoran topilmadi",
    noRestaurantText:
      "Partner akkauntingizda hali restoran yo‘q yoki restoran yaratilmagan.",
    addItem: "Menu item qo‘shish",
    saveChanges: "O‘zgarishlarni saqlash",
    saving: "Saqlanmoqda...",
    saved: "Menyu muvaffaqiyatli saqlandi.",
    selectItem: "Tahrirlash uchun menu item tanlang",
    selectedItem: "Tanlangan item",
    itemName: "Taom nomi",
    itemNamePlaceholder: "Margherita Pizza",
    category: "Kategoriya",
    categoryPlaceholder: "Pizza, Salat, Ichimlik...",
    price: "Narx",
    description: "Tavsif",
    descriptionPlaceholder: "Taom haqida qisqa ma’lumot",
    imageUrl: "Rasm URL",
    imageUrlPlaceholder: "https://...",
    available: "Mavjud",
    unavailable: "Mavjud emas",
    deleteItem: "Itemni o‘chirish",
    emptyTitle: "Hali menu item yo‘q",
    emptyText:
      "Mijozlar ovqatni oldindan buyurtma qilishi uchun birinchi taomni qo‘shing.",
    preview: "Ko‘rinish",
    status: "Status",
    item: "Item",
  },
  ru: {
    back: "Назад в партнёрский кабинет",
    title: "Редактор меню",
    subtitle:
      "Создавайте и управляйте меню ресторана. Клиенты увидят доступные блюда при бронировании.",
    noRestaurant: "Ресторан не найден",
    noRestaurantText:
      "У вашего партнёрского аккаунта пока нет ресторана или он не создан.",
    addItem: "Добавить блюдо",
    saveChanges: "Сохранить изменения",
    saving: "Сохранение...",
    saved: "Меню успешно сохранено.",
    selectItem: "Выберите блюдо для редактирования",
    selectedItem: "Выбранное блюдо",
    itemName: "Название блюда",
    itemNamePlaceholder: "Маргарита Пицца",
    category: "Категория",
    categoryPlaceholder: "Пицца, Салат, Напиток...",
    price: "Цена",
    description: "Описание",
    descriptionPlaceholder: "Краткое описание блюда",
    imageUrl: "URL изображения",
    imageUrlPlaceholder: "https://...",
    available: "Доступно",
    unavailable: "Недоступно",
    deleteItem: "Удалить блюдо",
    emptyTitle: "Меню пока пустое",
    emptyText:
      "Добавьте первое блюдо, чтобы клиенты могли делать предзаказ.",
    preview: "Предпросмотр",
    status: "Статус",
    item: "Блюдо",
  },
};

export default function PartnerMenuPage() {
  const { language } = useLanguage();
  const text = menuText[language];

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedItem =
    menuItems.find((item) => item.id === selectedItemId) || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRestaurant(null);
        setMenuItems([]);
        setIsLoading(false);
        return;
      }

      try {
        const rQuery = query(collection(db, "restaurants"), where("owner_id", "==", user.uid));
        const rSnap = await getDocs(rQuery);

        if (rSnap.empty) {
          setRestaurant(null);
          setMenuItems([]);
          setIsLoading(false);
          return;
        }

        const rDoc = rSnap.docs[0];
        const rData = { id: rDoc.id, ...rDoc.data() } as Restaurant;
        setRestaurant(rData);

        const mQuery = query(
          collection(db, "menu_items"),
          where("restaurant_id", "==", rData.id)
        );
        const mSnap = await getDocs(mQuery);

        const itemList: MenuItem[] = mSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MenuItem[];

        setMenuItems(itemList);
      } catch (error) {
        console.error("Menu error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  function updateSelectedItem<K extends keyof MenuItem>(
    key: K,
    value: MenuItem[K]
  ) {
    if (!selectedItemId) {
      return;
    }

    setMenuItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  async function handleAddItem() {
    if (!restaurant) {
      return;
    }

    const newItemData = {
      restaurant_id: restaurant.id,
      name: "New Dish",
      description: "Describe this dish.",
      category: "Main",
      price: 25000,
      image_url:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
      is_available: true,
      created_at: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "menu_items"), newItemData);
      const createdItem: MenuItem = { id: docRef.id, ...newItemData };

      setMenuItems((currentItems) => [createdItem, ...currentItems]);
      setSelectedItemId(createdItem.id);
      setMessage("");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error adding item.");
    }
  }

  async function handleSaveChanges() {
    setIsSaving(true);
    setMessage("");

    try {
      for (const item of menuItems) {
        await updateDoc(doc(db, "menu_items", item.id), {
          name: item.name,
          description: item.description,
          category: item.category,
          price: Number(item.price),
          image_url: item.image_url,
          is_available: item.is_available,
        });
      }
      setMessage(text.saved);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error saving menu.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!selectedItem) {
      return;
    }

    try {
      await deleteDoc(doc(db, "menu_items", selectedItem.id));
      setMenuItems((currentItems) =>
        currentItems.filter((item) => item.id !== selectedItem.id)
      );
      setSelectedItemId("");
      setMessage("");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error deleting item.");
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
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-5 py-3 font-black text-orange-600 hover:bg-orange-50"
            >
              <Plus size={18} />
              {text.addItem}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveChanges}
              className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? text.saving : text.saveChanges}
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

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.8fr]">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            {menuItems.length === 0 ? (
              <div className="rounded-3xl bg-orange-50 p-8 text-center">
                <ClipboardList
                  className="mx-auto text-orange-500"
                  size={46}
                />

                <h2 className="mt-4 text-2xl font-black text-gray-950">
                  {text.emptyTitle}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-gray-600">
                  {text.emptyText}
                </p>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
                >
                  <Plus size={18} />
                  {text.addItem}
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                      selectedItemId === item.id
                        ? "border-orange-500 ring-4 ring-orange-100"
                        : "border-gray-100"
                    }`}
                  >
                    <div
                      className="h-44 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${
                          item.image_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop"
                        })`,
                      }}
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-gray-950">
                            {item.name || text.item}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {item.category || text.category}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            item.is_available
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item.is_available
                            ? text.available
                            : text.unavailable}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                        {item.description || text.description}
                      </p>

                      <p className="mt-4 text-xl font-black text-orange-600">
                        {Number(item.price).toLocaleString()} UZS
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-8">
            {selectedItem ? (
              <div>
                <h2 className="text-2xl font-black text-gray-950">
                  {text.selectedItem}
                </h2>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.itemName}
                    </label>
                    <input
                      value={selectedItem.name}
                      onChange={(event) =>
                        updateSelectedItem("name", event.target.value)
                      }
                      placeholder={text.itemNamePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.category}
                    </label>
                    <input
                      value={selectedItem.category || ""}
                      onChange={(event) =>
                        updateSelectedItem("category", event.target.value)
                      }
                      placeholder={text.categoryPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.price}
                    </label>
                    <input
                      type="number"
                      value={selectedItem.price}
                      onChange={(event) =>
                        updateSelectedItem(
                          "price",
                          Number(event.target.value)
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.description}
                    </label>
                    <textarea
                      value={selectedItem.description || ""}
                      onChange={(event) =>
                        updateSelectedItem("description", event.target.value)
                      }
                      placeholder={text.descriptionPlaceholder}
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.imageUrl}
                    </label>
                    <input
                      value={selectedItem.image_url || ""}
                      onChange={(event) =>
                        updateSelectedItem("image_url", event.target.value)
                      }
                      placeholder={text.imageUrlPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.status}
                    </label>
                    <select
                      value={selectedItem.is_available ? "available" : "unavailable"}
                      onChange={(event) =>
                        updateSelectedItem(
                          "is_available",
                          event.target.value === "available"
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    >
                      <option value="available">{text.available}</option>
                      <option value="unavailable">{text.unavailable}</option>
                    </select>
                  </div>

                  <div className="rounded-3xl bg-orange-50 p-4">
                    <p className="mb-3 flex items-center gap-2 font-black text-gray-950">
                      <ImageIcon size={18} />
                      {text.preview}
                    </p>

                    <div
                      className="h-44 rounded-2xl bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${
                          selectedItem.image_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop"
                        })`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteItem}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-black text-white hover:bg-red-600"
                  >
                    <Trash2 size={18} />
                    {text.deleteItem}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-orange-50 p-6 text-center">
                <ClipboardList
                  className="mx-auto text-orange-500"
                  size={42}
                />
                <h2 className="mt-4 text-xl font-black text-gray-950">
                  {text.selectItem}
                </h2>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}