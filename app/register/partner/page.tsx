"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  auth,
  db,
  doc,
  setDoc,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  createUserProfile,
  addDoc,
  collection,
  formatAuthError,
} from "@/lib/firebase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

const partnerRegisterText = {
  en: {
    logo: "DineFlow",
    already: "Already have an account?",
    login: "Login",
    back: "Back",
    stepOwner: "Owner Account",
    stepRestaurant: "Restaurant Info",
    stepReview: "Admin Review",

    ownerTitle: "Owner Account",
    ownerSubtitle: "Create your restaurant owner account first.",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    ownerPhone: "Owner Phone Number",
    ownerPhonePlaceholder: "+998 90 123 45 67",
    password: "Password",
    passwordPlaceholder: "Create a password",
    nextStep: "Next Step",
    googleOwner: "Sign Up as Owner with Google",

    restaurantTitle: "Restaurant Information",
    restaurantSubtitle:
      "Tell us about your restaurant. This information will be reviewed by admin before your partner panel is activated.",
    restaurantName: "Restaurant Name",
    restaurantNamePlaceholder: "Bella Vista",
    cuisineType: "Cuisine Type",
    cuisineTypePlaceholder: "Italian, Uzbek, Korean...",
    city: "City",
    cityPlaceholder: "Tashkent",
    restaurantPhone: "Restaurant Phone",
    restaurantPhonePlaceholder: "+998 90 123 45 67",
    address: "Address",
    addressPlaceholder: "Full restaurant address",
    openingTime: "Opening Time",
    closingTime: "Closing Time",

    reviewTitle: "Submit for Admin Review",
    reviewSubtitle:
      "Your restaurant will be created with pending status. After admin approval, you can access the partner dashboard.",
    restaurantSummary: "Restaurant Summary",
    statusAfterSubmit: "Status after submit: pending approval",
    submit: "Submit for Review",
    submitting: "Submitting...",

    sideTitle: "Partner approval process",
    sideStep1Title: "1. Submit restaurant",
    sideStep1Text: "Fill owner and restaurant information.",
    sideStep2Title: "2. Verify details",
    sideStep2Text: "Account details are sent for activation.",
    sideStep3Title: "3. Admin reviews",
    sideStep3Text: "Admin checks restaurant details before approval.",
    sideStep4Title: "4. Partner dashboard opens",
    sideStep4Text:
      "After approval, you can manage floor map, menu and bookings.",

    ownerError: "Please fill in owner full name, email and password.",
    restaurantError: "Please fill in restaurant name, cuisine type and address.",
  },

  uz: {
    logo: "DineFlow",
    already: "Akkauntingiz bormi?",
    login: "Kirish",
    back: "Orqaga",
    stepOwner: "Ega akkaunti",
    stepRestaurant: "Restoran ma’lumoti",
    stepReview: "Admin tekshiruvi",

    ownerTitle: "Restoran egasi akkaunti",
    ownerSubtitle: "Avval restoran egasi akkauntini yarating.",
    fullName: "To‘liq ism",
    fullNamePlaceholder: "To‘liq ismingizni kiriting",
    email: "Email manzil",
    emailPlaceholder: "Emailingizni kiriting",
    ownerPhone: "Ega telefon raqami",
    ownerPhonePlaceholder: "+998 90 123 45 67",
    password: "Parol",
    passwordPlaceholder: "Parol yarating",
    nextStep: "Keyingi qadam",
    googleOwner: "Google bilan ega sifatidaning ro‘yxatdan o‘tishi",

    restaurantTitle: "Restoran ma’lumotlari",
    restaurantSubtitle:
      "Restoraningiz haqida ma’lumot kiriting. Partner panel faollashishidan oldin admin bu ma’lumotlarni tekshiradi.",
    restaurantName: "Restoran nomi",
    restaurantNamePlaceholder: "Bella Vista",
    cuisineType: "Oshxona turi",
    cuisineTypePlaceholder: "Italyan, O‘zbek, Koreys...",
    city: "Shahar",
    cityPlaceholder: "Toshkent",
    restaurantPhone: "Restoran telefoni",
    restaurantPhonePlaceholder: "+998 90 123 45 67",
    address: "Manzil",
    addressPlaceholder: "Restoranning to‘liq manzili",
    openingTime: "Ochilgan vaqti",
    closingTime: "Yopilgan vaqti",

    reviewTitle: "Admin tekshiruviga yuborish",
    reviewSubtitle:
      "Restoraningiz pending holatda yaratiladi. Admin approve qilgandan keyin partner panelga kira olasiz.",
    restaurantSummary: "Restoran xulosasi",
    statusAfterSubmit: "Yuborilgandan keyingi status: pending approval",
    submit: "Tekshiruvga yuborish",
    submitting: "Yuborilmoqda...",

    sideTitle: "Partner approval jarayoni",
    sideStep1Title: "1. Restoranni yuborish",
    sideStep1Text: "Ega va restoran ma’lumotlarini to‘ldiring.",
    sideStep2Title: "2. Ma'lumotlarni tekshirish",
    sideStep2Text: "Ma'lumotlar faollashtirish uchun yuboriladi.",
    sideStep3Title: "3. Admin tekshiradi",
    sideStep3Text: "Admin restoran ma’lumotlarini tekshiradi.",
    sideStep4Title: "4. Partner panel ochiladi",
    sideStep4Text:
      "Tasdiqdan keyin floor map, menyu va bronlarni boshqarasiz.",

    ownerError: "To‘liq ism, email va parolni kiriting.",
    restaurantError: "Restoran nomi, oshxona turi va manzilni kiriting.",
  },

  ru: {
    logo: "DineFlow",
    already: "Уже есть аккаунт?",
    login: "Войти",
    back: "Назад",
    stepOwner: "Аккаунт владельца",
    stepRestaurant: "Информация о ресторане",
    stepReview: "Проверка админом",

    ownerTitle: "Аккаунт владельца",
    ownerSubtitle: "Сначала создайте аккаунт владельца ресторана.",
    fullName: "Полное имя",
    fullNamePlaceholder: "Введите полное имя",
    email: "Email адрес",
    emailPlaceholder: "Введите email",
    ownerPhone: "Телефон владельца",
    ownerPhonePlaceholder: "+998 90 123 45 67",
    password: "Пароль",
    passwordPlaceholder: "Создайте пароль",
    nextStep: "Следующий шаг",
    googleOwner: "Регистрация владельца через Google",

    restaurantTitle: "Информация о ресторане",
    restaurantSubtitle:
      "Расскажите о ресторане. Администратор проверит информацию перед активацией партнёрского кабинета.",
    restaurantName: "Название ресторана",
    restaurantNamePlaceholder: "Bella Vista",
    cuisineType: "Тип кухни",
    cuisineTypePlaceholder: "Итальянская, Узбекская, Корейская...",
    city: "Город",
    cityPlaceholder: "Ташкент",
    restaurantPhone: "Телефон ресторана",
    restaurantPhonePlaceholder: "+998 90 123 45 67",
    address: "Адрес",
    addressPlaceholder: "Полный адрес ресторана",
    openingTime: "Время открытия",
    closingTime: "Время закрытия",

    reviewTitle: "Отправить на проверку",
    reviewSubtitle:
      "Ресторан будет создан со статусом pending. После одобрения администратором вы сможете войти в партнёрский кабинет.",
    restaurantSummary: "Сводка ресторана",
    statusAfterSubmit: "Статус после отправки: pending approval",
    submit: "Отправить на проверку",
    submitting: "Отправка...",

    sideTitle: "Процесс одобрения партнёра",
    sideStep1Title: "1. Отправьте ресторан",
    sideStep1Text: "Заполните информацию о владельце и ресторане.",
    sideStep2Title: "2. Проверка данных",
    sideStep2Text: "Данные отправляются на активацию.",
    sideStep3Title: "3. Админ проверяет",
    sideStep3Text: "Администратор проверяет данные ресторана.",
    sideStep4Title: "4. Кабинет партнёра открывается",
    sideStep4Text:
      "После одобрения вы сможете управлять планом зала, меню и бронированиями.",

    ownerError: "Введите полное имя, email и пароль.",
    restaurantError: "Введите название ресторана, тип кухни и адрес.",
  },
};

export default function PartnerRegisterPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const text = partnerRegisterText[language];

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [city, setCity] = useState("Tashkent");
  const [address, setAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("23:00");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registeredUid, setRegisteredUid] = useState<string | null>(null);

  function goToRestaurantInfoStep() {
    setMessage("");

    if (!registeredUid && (!fullName || !email || !password)) {
      setMessage(text.ownerError);
      return;
    }

    setStep(2);
  }

  function goToFinishStep() {
    setMessage("");

    if (!restaurantName || !cuisineType || !address) {
      setMessage(text.restaurantError);
      return;
    }

    setStep(3);
  }

  async function handleGoogleOwnerSignUp() {
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      setRegisteredUid(res.user.uid);
      setFullName(res.user.displayName || "Owner");
      setEmail(res.user.email || "");

      await createUserProfile(res.user.uid, {
        email: res.user.email || "",
        full_name: res.user.displayName || "Owner",
        phone: ownerPhone,
        role: "partner",
        partner_status: "pending",
      });

      setStep(2);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Google owner sign up failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handlePartnerRegister() {
    setMessage("");

    if (!restaurantName || !cuisineType || !address) {
      setMessage(text.restaurantError);
      setStep(2);
      return;
    }

    setIsLoading(true);

    try {
      let uid = registeredUid || auth.currentUser?.uid || null;

      if (!uid) {
        if (!fullName || !email || !password) {
          setMessage(text.ownerError);
          setStep(1);
          setIsLoading(false);
          return;
        }

        try {
          const signUpRes = await createUserWithEmailAndPassword(auth, email, password);
          uid = signUpRes.user.uid;
        } catch (signUpErr: any) {
          if (signUpErr?.code === "auth/email-already-in-use") {
            const signInRes = await signInWithEmailAndPassword(auth, email, password);
            uid = signInRes.user.uid;
          } else {
            throw signUpErr;
          }
        }

        await createUserProfile(uid, {
          email,
          full_name: fullName,
          phone: ownerPhone,
          role: "partner",
          partner_status: "pending",
        });

        // Save also in 'users' and 'partners' collections for guaranteed record matching
        try {
          await setDoc(doc(db, "users", uid), {
            uid,
            email,
            full_name: fullName,
            phone: ownerPhone,
            role: "partner",
            created_at: new Date().toISOString(),
          });

          await setDoc(doc(db, "partners", uid), {
            uid,
            owner_id: uid,
            email,
            full_name: fullName,
            phone: ownerPhone,
            status: "pending",
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Secondary partner collection sync notice:", e);
        }
      }

      await addDoc(collection(db, "restaurants"), {
        owner_id: uid,
        name: restaurantName,
        description: `Welcome to ${restaurantName}.`,
        cuisine_type: cuisineType,
        address,
        city,
        phone: restaurantPhone,
        image_url:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
        opening_time: openingTime,
        closing_time: closingTime,
        is_open: true,
        approval_status: "pending",
        rating: 5.0,
        price: "$$",
        created_at: new Date().toISOString(),
      });

      if (auth.currentUser) {
        try {
          await sendEmailVerification(auth.currentUser);
        } catch (e) {
          console.warn("Email verification send warning:", e);
        }
      }

      router.push(
        `/auth/check-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/partner/onboarding")}`
      );
      router.refresh();
    } catch (error: any) {
      console.error("Partner register error:", error);
      setMessage(formatAuthError(error, "Partner registration failed."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={18} />
            </div>
            <span className="text-xl font-black">{text.logo}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="hidden text-sm font-bold text-orange-600 md:block"
            >
              {text.already} {text.login}
            </Link>
          </div>
        </div>

        <Link
          href="/register"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-gray-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          {text.back}
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          {[text.stepOwner, text.stepRestaurant, text.stepReview].map(
            (label, index) => {
              const number = index + 1;

              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                      step >= number
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {number}
                  </div>

                  <span
                    className={`hidden text-sm font-bold md:block ${
                      step >= number ? "text-gray-950" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            }
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            {step === 1 && (
              <div>
                <h1 className="text-3xl font-black text-gray-950">
                  {text.ownerTitle}
                </h1>

                <p className="mt-2 text-gray-500">{text.ownerSubtitle}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.fullName}
                    </label>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder={text.fullNamePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={text.emailPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.ownerPhone}
                    </label>
                    <input
                      value={ownerPhone}
                      onChange={(event) => setOwnerPhone(event.target.value)}
                      placeholder={text.ownerPhonePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.password}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={text.passwordPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  {message && (
                    <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                      {message}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={goToRestaurantInfoStep}
                    className="w-full rounded-2xl bg-orange-500 px-5 py-4 font-black text-white hover:bg-orange-600"
                  >
                    {text.nextStep}
                  </button>

                  <button
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleOwnerSignUp}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-5 py-4 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-70"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.41l3.99-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    )}
                    {text.googleOwner}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-3xl font-black text-gray-950">
                  {text.restaurantTitle}
                </h1>

                <p className="mt-2 text-gray-500">{text.restaurantSubtitle}</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.restaurantName}
                    </label>
                    <input
                      value={restaurantName}
                      onChange={(event) =>
                        setRestaurantName(event.target.value)
                      }
                      placeholder={text.restaurantNamePlaceholder}
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
                      placeholder={text.cuisineTypePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.city}
                    </label>
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder={text.cityPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      {text.restaurantPhone}
                    </label>
                    <input
                      value={restaurantPhone}
                      onChange={(event) =>
                        setRestaurantPhone(event.target.value)
                      }
                      placeholder={text.restaurantPhonePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
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
                </div>

                {message && (
                  <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                    {message}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep(1);
                    }}
                    className="rounded-2xl border border-gray-200 px-5 py-3 font-black text-gray-700 hover:bg-gray-50"
                  >
                    {text.back}
                  </button>

                  <button
                    type="button"
                    onClick={goToFinishStep}
                    className="flex-1 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600"
                  >
                    {text.nextStep}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-3xl font-black text-gray-950">
                  {text.reviewTitle}
                </h1>

                <p className="mt-2 text-gray-500">{text.reviewSubtitle}</p>

                <div className="mt-6 rounded-2xl bg-orange-50 p-5">
                  <p className="text-sm font-bold text-orange-700">
                    {text.restaurantSummary}
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-gray-950">
                    {restaurantName || text.restaurantName}
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    {cuisineType || text.cuisineType} • {city || text.city}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {address || text.address}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {openingTime} - {closingTime}
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
                    {text.statusAfterSubmit}
                  </div>
                </div>

                {message && (
                  <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                    {message}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep(2);
                    }}
                    className="rounded-2xl border border-gray-200 px-5 py-3 font-black text-gray-700 hover:bg-gray-50"
                  >
                    {text.back}
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handlePartnerRegister}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading && <Loader2 className="animate-spin" size={18} />}
                    {isLoading ? text.submitting : text.submit}
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-3xl bg-gray-950 p-6 text-white">
            <h2 className="text-2xl font-black">{text.sideTitle}</h2>

            <ul className="mt-6 space-y-4 text-gray-300">
              <li className="rounded-2xl bg-white/10 p-4">
                <p className="font-bold text-white">{text.sideStep1Title}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {text.sideStep1Text}
                </p>
              </li>

              <li className="rounded-2xl bg-white/10 p-4">
                <p className="font-bold text-white">{text.sideStep2Title}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {text.sideStep2Text}
                </p>
              </li>

              <li className="rounded-2xl bg-white/10 p-4">
                <p className="font-bold text-white">{text.sideStep3Title}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {text.sideStep3Text}
                </p>
              </li>

              <li className="rounded-2xl bg-white/10 p-4">
                <p className="font-bold text-white">{text.sideStep4Title}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {text.sideStep4Text}
                </p>
              </li>
            </ul>

            <div
              className="mt-8 h-72 rounded-3xl bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop)",
              }}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}