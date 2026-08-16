"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, Users, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableName: string;
  seats: number;
  onSuccess: (bookingData: any) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  restaurantId,
  tableName,
  seats,
  onSuccess,
}: BookingModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+998 ");
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bookingTime, setBookingTime] = useState("19:00");
  const [guestsCount, setGuestsCount] = useState(Math.min(2, seats));
  const [occasion, setOccasion] = useState("Dining");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || customerName.trim().length < 2) {
      setErrorMsg("Please enter a valid guest name.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reservations/atomic-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableName,
          tableId: tableName,
          bookingDate,
          bookingTime,
          guestsCount,
          customerName,
          customerPhone,
          occasion,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reservation request failed.");
      }

      onSuccess(data.booking);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete 3D spatial booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-all">
      <div className="w-full max-w-lg rounded-3xl bg-[#09111e] border border-orange-500/30 p-6 text-white shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Reserve {tableName}</h3>
              <p className="text-xs text-slate-400 font-medium">3D Spatial Real-Time Lock • Up to {seats} guests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-950/60 border border-red-500/40 p-3 text-xs font-bold text-red-300">
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitReservation} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Jasur Karimov"
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Party Size
              </label>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
              >
                {Array.from({ length: seats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Time Slot
              </label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
              >
                <option value="12:00">12:00 PM (Lunch)</option>
                <option value="13:30">1:30 PM (Lunch)</option>
                <option value="17:00">5:00 PM (Dinner)</option>
                <option value="19:00">7:00 PM (Dinner)</option>
                <option value="20:30">8:30 PM (Dinner)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
          >
            {loading ? (
              <span>Acquiring Spatial Table Lock...</span>
            ) : (
              <>
                <CheckCircle2 size={16} /> Lock Table & Confirm Reservation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
