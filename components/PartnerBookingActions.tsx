"use client";

import { CheckCircle, Loader2, XCircle, CircleCheckBig } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { db, doc, updateDoc } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageProvider";

type PartnerBookingActionsProps = {
  bookingId: string;
  currentStatus: string;
};

const actionText = {
  en: {
    approve: "Approve",
    cancel: "Cancel",
    complete: "Complete",
    updating: "Updating...",
  },
  uz: {
    approve: "Tasdiqlash",
    cancel: "Bekor qilish",
    complete: "Yakunlash",
    updating: "Yangilanmoqda...",
  },
  ru: {
    approve: "Одобрить",
    cancel: "Отменить",
    complete: "Завершить",
    updating: "Обновление...",
  },
};

export default function PartnerBookingActions({
  bookingId,
  currentStatus,
}: PartnerBookingActionsProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const text = actionText[language];

  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  async function updateBookingStatus(nextStatus: string) {
    setLoadingStatus(nextStatus);

    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: nextStatus,
      });
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Error updating booking");
    } finally {
      setLoadingStatus(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {currentStatus === "pending" && (
        <>
          <button
            type="button"
            disabled={loadingStatus !== null}
            onClick={() => updateBookingStatus("approved")}
            className="flex items-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-sm font-black text-white hover:bg-green-600 disabled:opacity-60"
          >
            {loadingStatus === "approved" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <CheckCircle size={17} />
            )}
            {loadingStatus === "approved" ? text.updating : text.approve}
          </button>

          <button
            type="button"
            disabled={loadingStatus !== null}
            onClick={() => updateBookingStatus("cancelled")}
            className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loadingStatus === "cancelled" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <XCircle size={17} />
            )}
            {loadingStatus === "cancelled" ? text.updating : text.cancel}
          </button>
        </>
      )}

      {currentStatus === "approved" && (
        <>
          <button
            type="button"
            disabled={loadingStatus !== null}
            onClick={() => updateBookingStatus("completed")}
            className="flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-600 disabled:opacity-60"
          >
            {loadingStatus === "completed" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <CircleCheckBig size={17} />
            )}
            {loadingStatus === "completed" ? text.updating : text.complete}
          </button>

          <button
            type="button"
            disabled={loadingStatus !== null}
            onClick={() => updateBookingStatus("cancelled")}
            className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loadingStatus === "cancelled" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <XCircle size={17} />
            )}
            {loadingStatus === "cancelled" ? text.updating : text.cancel}
          </button>
        </>
      )}
    </div>
  );
}