import Link from "next/link";
import { Clock, Mail, ShieldCheck, Utensils } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function PartnerPendingPage() {
  return (
    <main className="min-h-screen bg-[#fffaf5]">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={18} />
            </div>
            <span className="text-xl font-black">DineFlow Partner</span>
          </Link>

          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl items-center justify-center px-6 py-20">
        <div className="rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Clock size={38} />
          </div>

          <h1 className="mt-6 text-4xl font-black text-gray-950">
            Your restaurant is under review
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Thank you for registering as a DineFlow partner. Our admin team will
            review your restaurant information before activating your partner
            dashboard.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-orange-50 p-5 text-left">
              <ShieldCheck className="text-orange-500" />
              <h2 className="mt-3 font-black text-gray-950">
                Why approval is needed
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We check restaurant information to keep the platform safe and
                trustworthy for customers.
              </p>
            </div>

            <div className="rounded-3xl bg-orange-50 p-5 text-left">
              <Mail className="text-orange-500" />
              <h2 className="mt-3 font-black text-gray-950">
                What happens next
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                After approval, you will be able to manage bookings, menu, and
                your editable floor plan.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/partner/onboarding"
              className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              Start Restaurant & Table Setup (Onboarding) →
            </Link>
          </div>

          <div className="mt-4 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="rounded-2xl border border-orange-200 px-6 py-3 font-bold text-orange-600 hover:bg-orange-50"
            >
              Back to Home
            </Link>

            <Link
              href="/partner/floor-plan"
              className="rounded-2xl border border-gray-200 px-6 py-3 font-bold text-gray-700 hover:bg-gray-50"
            >
              Open Drag & Drop Floor Map
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}