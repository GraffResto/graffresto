import { NextResponse } from "next/server";
import { db, collection, addDoc, doc, updateDoc, getDocs, query, where } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      restaurantId,
      tableId,
      tableName,
      bookingDate,
      bookingTime,
      guestsCount,
      customerName,
      customerPhone,
      occasion,
    } = body;

    if (!restaurantId || !tableId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: "Missing required fields for atomic reservation lock." },
        { status: 400 }
      );
    }

    // Atomic conflict check: Query existing active bookings for exact table, date & time
    const existingQuery = query(
      collection(db, "bookings"),
      where("restaurant_id", "==", restaurantId),
      where("table_name", "==", tableName || tableId),
      where("booking_date", "==", bookingDate),
      where("booking_time", "==", bookingTime),
      where("status", "in", ["approved", "pending"])
    );

    const snapshot = await getDocs(existingQuery);
    if (!snapshot.empty) {
      return NextResponse.json(
        {
          error: "Table lock collision: This 3D table node has just been reserved by another guest.",
          conflict: true,
        },
        { status: 409 }
      );
    }

    // Create reservation document in Firestore
    const newBooking = {
      restaurant_id: restaurantId,
      customer_name: customerName || "Guest User",
      customer_phone: customerPhone || "+998 90 123 45 67",
      booking_date: bookingDate,
      booking_time: bookingTime,
      table_name: tableName || tableId,
      guests_count: Number(guestsCount) || 2,
      occasion: occasion || "3D Spatial Dining",
      payment_status: "paid",
      status: "approved",
      source: "3D Digital Twin Engine",
      created_at: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "bookings"), newBooking);

    return NextResponse.json({
      success: true,
      bookingId: docRef.id,
      booking: newBooking,
      message: "Atomic reservation lock acquired successfully.",
    });
  } catch (err: any) {
    console.error("Atomic Reservation API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to acquire atomic reservation lock." },
      { status: 500 }
    );
  }
}
