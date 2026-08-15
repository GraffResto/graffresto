"use client";

import Link from "next/link";
import {
  Armchair,
  Building2,
  CalendarDays,
  ClipboardList,
  Map,
  Search,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RestaurantCard from "@/components/RestaurantCard";
import { useLanguage } from "@/components/LanguageProvider";

type RestaurantPreview = {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number | null;
  price: string;
  status: string;
  image: string;
};

type LandingContentProps = {
  restaurantList: RestaurantPreview[];
};

export default function LandingContent({ restaurantList }: LandingContentProps) {
  const { t } = useLanguage();

  const steps = [
    {
      title: t.step1Title,
      text: t.step1Text,
      icon: Search,
    },
    {
      title: t.step2Title,
      text: t.step2Text,
      icon: Users,
    },
    {
      title: t.step3Title,
      text: t.step3Text,
      icon: Armchair,
    },
    {
      title: t.step4Title,
      text: t.step4Text,
      icon: ShoppingBag,
    },
  ];

  return (
    <main className="min-h-screen bg-[#fffaf5]">
      <Navbar />

      <section className="relative overflow-hidden bg-gray-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop)",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full bg-orange-500/20 px-4 py-2 text-sm font-bold text-orange-300">
              {t.heroBadge}
            </p>

            <h1 className="text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">
              {t.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-200">
              {t.heroText}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register/customer"
                className="rounded-2xl bg-orange-500 px-7 py-4 text-center font-black text-white shadow-lg shadow-orange-950/30 hover:bg-orange-600"
              >
                {t.createCustomerAccount}
              </Link>

              <Link
                href="/register/partner"
                className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-center font-black text-white backdrop-blur hover:bg-white/20"
              >
                {t.registerRestaurant}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-5 text-sm font-semibold text-gray-200">
              <span className="flex items-center gap-2">
                <Star className="fill-orange-400 text-orange-400" size={18} />
                {t.restaurantDiscovery}
              </span>

              <span className="flex items-center gap-2">
                <Users size={18} />
                {t.panelsText}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-950">{t.howTitle}</h2>
          <p className="mt-2 text-gray-600">{t.howSubtitle}</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <step.icon size={22} />
              </div>

              <p className="mt-4 text-sm font-black text-orange-500">
                {t.step} {index + 1}
              </p>

              <h3 className="mt-2 font-black text-gray-950">{step.title}</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="restaurants" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-950">
              {t.featuredRestaurants}
            </h2>

            <p className="mt-2 text-gray-600">
              {t.featuredRestaurantsText}
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-2xl bg-gray-950 px-5 py-3 text-center font-black text-white hover:bg-gray-800"
          >
            {t.loginToBook}
          </Link>
        </div>

        {restaurantList.length === 0 ? (
          <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-gray-950">
              {t.noRestaurantsFound}
            </h3>

            <p className="mt-2 text-gray-500">
              {t.approvedRestaurantsAppear}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {restaurantList.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                {...restaurant}
                actionHref="/login"
                actionText={t.loginToBook}
              />
            ))}
          </div>
        )}
      </section>

      <section
        id="customers"
        className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-2"
      >
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="font-black text-orange-600">{t.forCustomers}</p>

          <h2 className="mt-3 text-3xl font-black text-gray-950">
            {t.customerTitle}
          </h2>

          <p className="mt-4 leading-7 text-gray-600">{t.customerText}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-orange-50 p-5">
              <CalendarDays className="text-orange-500" />
              <h3 className="mt-3 font-black text-gray-950">
                {t.tableBooking}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {t.tableBookingText}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-5">
              <ShoppingBag className="text-orange-500" />
              <h3 className="mt-3 font-black text-gray-950">
                {t.preorderMeals}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {t.preorderMealsText}
              </p>
            </div>
          </div>

          <Link
            href="/register/customer"
            className="mt-8 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
          >
            {t.createCustomerAccount}
          </Link>
        </div>

        <div
          id="partners"
          className="rounded-[2rem] bg-gray-950 p-8 text-white shadow-sm"
        >
          <p className="font-black text-orange-400">{t.forRestaurants}</p>

          <h2 className="mt-3 text-3xl font-black">{t.partnerTitle}</h2>

          <p className="mt-4 leading-7 text-gray-300">{t.partnerText}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <Map className="text-orange-400" />
              <p className="mt-3 text-sm font-bold">{t.floorMap}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <ClipboardList className="text-orange-400" />
              <p className="mt-3 text-sm font-bold">{t.menuEditor}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <Building2 className="text-orange-400" />
              <p className="mt-3 text-sm font-bold">{t.partnerPanel}</p>
            </div>
          </div>

          <Link
            href="/register/partner"
            className="mt-8 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
          >
            {t.registerRestaurant}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[2rem] bg-orange-500 p-8 text-white md:p-12">
          <h2 className="text-3xl font-black">{t.finalCtaTitle}</h2>

          <p className="mt-3 max-w-2xl text-orange-50">{t.finalCtaText}</p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register/customer"
              className="rounded-2xl bg-white px-6 py-3 text-center font-black text-orange-600"
            >
              {t.customerSignUp}
            </Link>

            <Link
              href="/register/partner"
              className="rounded-2xl border border-white/40 px-6 py-3 text-center font-black text-white"
            >
              {t.partnerSignUp}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}