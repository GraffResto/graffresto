export type Language = "en" | "uz" | "ru";

export const translations = {
  en: {
    navHome: "Home",
    navHowItWorks: "How it works",
    navCustomers: "For Customers",
    navPartners: "For Restaurants",
    navRestaurants: "Restaurants",
    login: "Login",
    getStarted: "Get Started",

    heroBadge: "Restaurant booking and table management platform",
    heroTitle: "Discover restaurants before you book.",
    heroText:
      "DineFlow helps customers explore restaurants, view restaurant information, and after login book exact tables and pre-order meals. Restaurants can manage bookings, menu, and floor plans from one partner dashboard.",
    createCustomerAccount: "Create Customer Account",
    registerRestaurant: "Register Restaurant",
    restaurantDiscovery: "Restaurant discovery",
    panelsText: "Customer, partner, and admin panels",

    howTitle: "How DineFlow works",
    howSubtitle: "Public visitors can explore. Registered users can book.",
    step1Title: "Explore Restaurants",
    step1Text: "Visitors can view restaurant photos and basic information.",
    step2Title: "Register or Login",
    step2Text: "Booking is available only after creating an account.",
    step3Title: "Choose Table",
    step3Text: "Customers can select exact tables from the floor map.",
    step4Title: "Pre-order Meals",
    step4Text: "Users can order meals before arriving at the restaurant.",
    step: "Step",

    featuredRestaurants: "Featured Restaurants",
    featuredRestaurantsText:
      "Preview restaurant photos, cuisine, city, and status. Login is required to book a table.",
    loginToBook: "Login to Book",
    noRestaurantsFound: "No restaurants found",
    approvedRestaurantsAppear: "Approved restaurants will appear here.",
    loadingRestaurants: "Loading restaurants...",

    forCustomers: "For Customers",
    customerTitle: "Book after registration",
    customerText:
      "Customers can register, enter the user panel, see restaurants, choose exact tables, and pre-order meals.",
    tableBooking: "Table booking",
    tableBookingText: "Select date, time, table, and guest count.",
    preorderMeals: "Pre-order meals",
    preorderMealsText: "Add dishes before arriving.",

    forRestaurants: "For Restaurants",
    partnerTitle: "Manage your restaurant after approval",
    partnerText:
      "Restaurant owners register as partners. After admin approval, they can manage menu, tables, floor map, and bookings.",
    floorMap: "Floor Map",
    menuEditor: "Menu Editor",
    partnerPanel: "Partner Panel",

    finalCtaTitle: "Ready to use DineFlow?",
    finalCtaText:
      "Create a customer account to book restaurants, or register your restaurant as a partner.",
    customerSignUp: "Customer Sign Up",
    partnerSignUp: "Partner Sign Up",

    open: "Open",
    closed: "Closed",

    // Auth & Validation
    forgotPassword: "Forgot password?",
    resetPasswordTitle: "Reset Password",
    resetPasswordDesc:
      "Enter your account email address below to receive an official password reset link.",
    sendResetLink: "Send Reset Link",
    sendingResetLink: "Sending reset link...",
    enterEmailForReset: "Please enter your registered email address.",
    invalidPhoneError: "Please enter a valid phone number (e.g. +998 90 123 45 67)",
    invalidEmailError: "Please enter a valid email address",
    weakPasswordError: "Password must be at least 6 characters long",
    viewDetails: "View Details & Book",

    // Footer
    footerDesc:
      "The next-generation 3D spatial digital twin & table reservation platform for restaurants and guests.",
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    legal: "Legal",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    allRightsReserved: "All rights reserved.",
  },

  uz: {
    navHome: "Bosh sahifa",
    navHowItWorks: "Qanday ishlaydi",
    navCustomers: "Mijozlar uchun",
    navPartners: "Restoranlar uchun",
    navRestaurants: "Restoranlar",
    login: "Kirish",
    getStarted: "Boshlash",

    heroBadge: "Restoran bron qilish va stol boshqaruv platformasi",
    heroTitle: "Bron qilishdan oldin restoranlarni ko‘ring.",
    heroText:
      "DineFlow mijozlarga restoranlarni ko‘rish, ma’lumot olish, login qilgandan keyin aniq stolni tanlash va ovqatni oldindan buyurtma qilish imkonini beradi. Restoranlar esa bronlar, menyu va floor plan’ni bitta paneldan boshqaradi.",
    createCustomerAccount: "Mijoz akkaunti yaratish",
    registerRestaurant: "Restoranni ro‘yxatdan o‘tkazish",
    restaurantDiscovery: "Restoranlarni ko‘rish",
    panelsText: "Mijoz, hamkor va admin panellari",

    howTitle: "DineFlow qanday ishlaydi",
    howSubtitle:
      "Public foydalanuvchilar ko‘radi. Ro‘yxatdan o‘tganlar bron qiladi.",
    step1Title: "Restoranlarni ko‘ring",
    step1Text:
      "Mehmonlar restoran rasmlari va asosiy ma’lumotlarini ko‘rishi mumkin.",
    step2Title: "Ro‘yxatdan o‘ting yoki kiring",
    step2Text: "Bron qilish faqat akkaunt ochilgandan keyin mumkin.",
    step3Title: "Stol tanlang",
    step3Text: "Mijozlar floor map orqali aniq stolni tanlaydi.",
    step4Title: "Ovqatni oldindan buyurtma qiling",
    step4Text: "Foydalanuvchilar restoranga borishdan oldin ovqat tanlaydi.",
    step: "Qadam",

    featuredRestaurants: "Tavsiya qilingan restoranlar",
    featuredRestaurantsText:
      "Restoran rasmi, oshxona turi, shahar va holatini ko‘ring. Bron qilish uchun login kerak.",
    loginToBook: "Bron qilish uchun kiring",
    noRestaurantsFound: "Restoran topilmadi",
    approvedRestaurantsAppear:
      "Admin tasdiqlagan restoranlar shu yerda ko‘rinadi.",
    loadingRestaurants: "Restoranlar yuklanmoqda...",

    forCustomers: "Mijozlar uchun",
    customerTitle: "Ro‘yxatdan o‘tgandan keyin bron qiling",
    customerText:
      "Mijozlar ro‘yxatdan o‘tib, user panelga kiradi, restoranlarni ko‘radi, aniq stol tanlaydi va ovqatni oldindan buyurtma qiladi.",
    tableBooking: "Stol bron qilish",
    tableBookingText: "Sana, vaqt, stol va mehmonlar sonini tanlang.",
    preorderMeals: "Ovqatni oldindan buyurtma qilish",
    preorderMealsText: "Restoranga borishdan oldin taomlarni qo‘shing.",

    forRestaurants: "Restoranlar uchun",
    partnerTitle: "Tasdiqdan keyin restoranni boshqaring",
    partnerText:
      "Restoran egalari hamkor sifatida ro‘yxatdan o‘tadi. Admin tasdiqlagandan keyin menyu, stollar, floor map va bronlarni boshqaradi.",
    floorMap: "Floor Map",
    menuEditor: "Menyu tahrirlash",
    partnerPanel: "Hamkor paneli",

    finalCtaTitle: "DineFlow’dan foydalanishga tayyormisiz?",
    finalCtaText:
      "Restoran bron qilish uchun mijoz akkaunti yarating yoki restoraningizni hamkor sifatida ro‘yxatdan o‘tkazing.",
    customerSignUp: "Mijoz sifatida ro‘yxatdan o‘tish",
    partnerSignUp: "Hamkor sifatida ro‘yxatdan o‘tish",

    open: "Ochiq",
    closed: "Yopiq",

    // Auth & Validation
    forgotPassword: "Parolni unutdingizmi?",
    resetPasswordTitle: "Parolni tiklash",
    resetPasswordDesc:
      "Parolni tiklash havolasini olish uchun akkauntingiz email manzilini kiriting.",
    sendResetLink: "Tiklash havolasini yuborish",
    sendingResetLink: "Havola yuborilmoqda...",
    enterEmailForReset: "Iltimos, ro'yxatdan o'tgan emailingizni kiriting.",
    invalidPhoneError:
      "Iltimos, to'g'ri telefon raqam kiriting (masalan +998 90 123 45 67)",
    invalidEmailError: "Iltimos, to'g'ri email manzil kiriting",
    weakPasswordError: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    viewDetails: "Batafsil va bron qilish",

    // Footer
    footerDesc:
      "Restoranlar va mehmonlar uchun yangi avlod 3D raqamli egizak va stol bron qilish platformasi.",
    quickLinks: "Tezkor havolalar",
    contactUs: "Bog'lanish",
    legal: "Huquqiy",
    privacyPolicy: "Maxfiylik siyosati",
    termsOfService: "Foydalanish shartlari",
    allRightsReserved: "Barcha huquqlar himoyalangan.",
  },

  ru: {
    navHome: "Главная",
    navHowItWorks: "Как это работает",
    navCustomers: "Для клиентов",
    navPartners: "Для ресторанов",
    navRestaurants: "Рестораны",
    login: "Войти",
    getStarted: "Начать",

    heroBadge: "Платформа бронирования и управления столами",
    heroTitle: "Изучайте рестораны перед бронированием.",
    heroText:
      "DineFlow помогает клиентам смотреть информацию о ресторанах, а после входа бронировать конкретные столы и заранее заказывать блюда. Рестораны могут управлять бронированиями, меню и планом зала из одного партнёрского кабинета.",
    createCustomerAccount: "Создать аккаунт клиента",
    registerRestaurant: "Зарегистрировать ресторан",
    restaurantDiscovery: "Просмотр ресторанов",
    panelsText: "Кабинеты клиента, партнёра и администратора",

    howTitle: "Как работает DineFlow",
    howSubtitle:
      "Гости могут просматривать информацию. Зарегистрированные пользователи могут бронировать.",
    step1Title: "Изучите рестораны",
    step1Text:
      "Посетители могут видеть фотографии ресторанов и основную информацию.",
    step2Title: "Зарегистрируйтесь или войдите",
    step2Text: "Бронирование доступно только после создания аккаунта.",
    step3Title: "Выберите стол",
    step3Text: "Клиенты могут выбрать конкретный стол на плане зала.",
    step4Title: "Закажите блюда заранее",
    step4Text: "Пользователи могут выбрать блюда до прихода в ресторан.",
    step: "Шаг",

    featuredRestaurants: "Рекомендуемые рестораны",
    featuredRestaurantsText:
      "Посмотрите фото, кухню, город и статус ресторана. Для бронирования нужен вход.",
    loginToBook: "Войти для брони",
    noRestaurantsFound: "Рестораны не найдены",
    approvedRestaurantsAppear:
      "Одобренные рестораны появятся здесь.",
    loadingRestaurants: "Загрузка ресторанов...",

    forCustomers: "Для клиентов",
    customerTitle: "Бронируйте после регистрации",
    customerText:
      "Клиенты могут зарегистрироваться, войти в личный кабинет, посмотреть рестораны, выбрать конкретный стол и заранее заказать блюда.",
    tableBooking: "Бронирование стола",
    tableBookingText: "Выберите дату, время, стол и количество гостей.",
    preorderMeals: "Предзаказ блюд",
    preorderMealsText: "Добавьте блюда до прихода в ресторан.",

    forRestaurants: "Для ресторанов",
    partnerTitle: "Управляйте рестораном после одобрения",
    partnerText:
      "Владельцы ресторанов регистрируются как партнёры. После одобрения администратора они управляют меню, столами, планом зала и бронированиями.",
    floorMap: "План зала",
    menuEditor: "Редактор меню",
    partnerPanel: "Партнёрский кабинет",

    finalCtaTitle: "Готовы использовать DineFlow?",
    finalCtaText:
      "Создайте аккаунт клиента для бронирования или зарегистрируйте ресторан как партнёр.",
    customerSignUp: "Регистрация клиента",
    partnerSignUp: "Регистрация партнёра",

    open: "Открыто",
    closed: "Закрыто",

    // Auth & Validation
    forgotPassword: "Забыли пароль?",
    resetPasswordTitle: "Сброс пароля",
    resetPasswordDesc:
      "Введите email вашего аккаунта для получения ссылки сброса пароля.",
    sendResetLink: "Отправить ссылку",
    sendingResetLink: "Отправка ссылки...",
    enterEmailForReset: "Пожалуйста, введите ваш зарегистрированный email.",
    invalidPhoneError:
      "Пожалуйста, введите корректный номер телефона (например +998 90 123 45 67)",
    invalidEmailError: "Пожалуйста, введите корректный email адрес",
    weakPasswordError: "Пароль должен содержать минимум 6 символов",
    viewDetails: "Подробнее и бронировать",

    // Footer
    footerDesc:
      "Платформа 3D цифровых двойников и бронирования столов для ресторанов и гостей.",
    quickLinks: "Быстрые ссылки",
    contactUs: "Контакты",
    legal: "Правовая информация",
    privacyPolicy: "Политика конфиденциальности",
    termsOfService: "Условия использования",
    allRightsReserved: "Все права защищены.",
  },
};

/**
 * Phone number validation helper.
 * Returns true if input contains valid digits (7 to 15 digits).
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || !phone.trim()) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const digitsOnly = cleaned.replace(/^\+/, "");
  return /^\d{7,15}$/.test(digitsOnly);
}