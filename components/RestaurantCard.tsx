import Link from "next/link";
import { MapPin, Star } from "lucide-react";

type RestaurantCardProps = {
  id: string;
  name: string;
  type: string;
  location: string;
  /** Omitted when the restaurant has no ratings yet — never invent one. */
  rating?: number | null;
  price?: string;
  status: string;
  image: string;
  actionHref?: string;
  actionText?: string;
};

export default function RestaurantCard({
  name,
  type,
  location,
  rating,
  price = "$$",
  status,
  image,
  actionHref = "/login",
  actionText = "Login to Book",
}: RestaurantCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-950">{name}</h3>

            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} />
              {type} • {price} • {location}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              status === "Open"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {rating ? (
            <p className="flex items-center gap-1 text-sm font-bold text-gray-800">
              <Star size={16} className="fill-orange-400 text-orange-400" />
              {rating.toFixed(1)}
            </p>
          ) : (
            <p className="text-xs font-bold text-gray-400">No ratings yet</p>
          )}

          <Link
            href={actionHref}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
          >
            {actionText}
          </Link>
        </div>
      </div>
    </article>
  );
}