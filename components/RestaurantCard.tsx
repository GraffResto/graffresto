import Link from "next/link";
import { MapPin, Star } from "lucide-react";

type RestaurantCardProps = {
  id: string;
  name: string;
  type: string;
  location: string;
  rating?: number | null;
  price?: string;
  status: string;
  image: string;
  actionHref?: string;
  actionText?: string;
};

export default function RestaurantCard({
  id,
  name,
  type,
  location,
  rating,
  price = "$$",
  status,
  image,
  actionHref,
  actionText = "Login to Book",
}: RestaurantCardProps) {
  const targetHref = actionHref || (id ? `/user/restaurants/${id}` : "/login");

  return (
    <article className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
      <div>
        <Link href={targetHref} className="block relative h-48 overflow-hidden">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${image})` }}
          />
        </Link>

        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <Link href={targetHref} className="hover:text-orange-600 transition">
                <h3 className="text-lg font-black text-gray-950 group-hover:text-orange-600 transition">
                  {name}
                </h3>
              </Link>

              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={14} className="shrink-0 text-orange-500" />
                <span>{type}</span> • <span>{price}</span> • <span>{location}</span>
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                status === "Open" || status === "Ochiq" || status === "Открыто"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
        <p className="flex items-center gap-1 text-sm font-bold text-gray-800">
          <Star size={16} className="fill-orange-400 text-orange-400" />
          {rating ? rating.toFixed(1) : "4.8"}
        </p>

        <Link
          href={targetHref}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition shadow-sm"
        >
          {actionText}
        </Link>
      </div>
    </article>
  );
}