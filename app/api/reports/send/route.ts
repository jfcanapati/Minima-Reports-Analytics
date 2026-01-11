import { NextRequest, NextResponse } from "next/server";
import { sendReportEmail, ReportEmailData } from "@/lib/email";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (server-side)
function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
  return admin.database();
}

async function calculateReportMetrics(
  db: admin.database.Database,
  startDate: Date,
  endDate: Date
) {
  const [roomsSnap, bookingsSnap, posSnap] = await Promise.all([
    db.ref("rooms").get(),
    db.ref("bookings").get(),
    db.ref("pos_transactions").get(),
  ]);

  const totalRooms = roomsSnap.exists() ? Object.keys(roomsSnap.val()).length : 1;
  const allBookings: any[] = bookingsSnap.exists() ? Object.values(bookingsSnap.val()) : [];
  const allPOS: any[] = posSnap.exists() ? Object.values(posSnap.val()) : [];

  // Filter bookings by date
  const filteredBookings = allBookings.filter((b) => {
    if (b.status !== "paid" && b.status !== "completed") return false;
    const date = new Date(b.createdAt || b.checkIn);
    return date >= startDate && date <= endDate;
  });

  // Filter POS by date
  const filteredPOS = allPOS.filter((t) => {
    if (t.status !== "completed") return false;
    const date = new Date(t.created_at);
    return date >= startDate && date <= endDate;
  });

  // Calculate revenue
  const roomRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const posRevenue = filteredPOS.reduce((sum, t) => sum + (t.total || 0), 0);

  // Calculate occupancy
  const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  let occupiedNights = 0;

  filteredBookings.forEach((b) => {
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    const overlapStart = checkIn > startDate ? checkIn : startDate;
    const overlapEnd = checkOut < endDate ? checkOut : endDate;
    if (overlapStart <= overlapEnd) {
      const nights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
      occupiedNights += Math.max(0, nights);
    }
  });

  const totalNights = totalRooms * daysInPeriod;
  const occupancyRate = totalNights > 0 ? Math.round((occupiedNights / totalNights) * 100) : 0;

  // Booking counts
  const onlineBookings = filteredBookings.filter((b) => !b.isWalkIn).length;
  const walkInBookings = filteredBookings.filter((b) => b.isWalkIn).length;

  // Average stay duration
  const stayDurations = filteredBookings.map((b) => {
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  });
  const averageStayDuration = stayDurations.length > 0
    ? Math.round((stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length) * 10) / 10
    : 0;

  // Top room
  const roomRevenues: Record<string, { type: string; revenue: number }> = {};
  filteredBookings.forEach((b) => {
    if (!roomRevenues[b.roomId]) {
      roomRevenues[b.roomId] = { type: b.roomType, revenue: 0 };
    }
    roomRevenues[b.roomId].revenue += b.totalPrice || 0;
  });
  const topRoom = Object.values(roomRevenues).sort((a, b) => b.revenue - a.revenue)[0]?.type;

  // Generate alerts
  const alerts: string[] = [];
  if (occupancyRate < 50) alerts.push(`Low occupancy rate: ${occupancyRate}%`);
  if (filteredBookings.length === 0) alerts.push("No bookings in this period");
  if (roomRevenue + posRevenue === 0) alerts.push("No revenue generated");

  return {
    totalRevenue: roomRevenue + posRevenue,
    roomRevenue,
    posRevenue,
    occupancyRate,
    totalBookings: filteredBookings.length,
    onlineBookings,
    walkInBookings,
    averageStayDuration,
    topRoom,
    alerts,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reportType, hotelName = "Minima Hotel" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json({ error: "Email service not configured. Please add BREVO_API_KEY to .env.local" }, { status: 500 });
    }

    const db = getFirebaseAdmin();

    // Calculate date range based on report type
    const endDate = new Date();
    const startDate = new Date();

    switch (reportType) {
      case "daily":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "weekly":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "monthly":
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const metrics = await calculateReportMetrics(db, startDate, endDate);

    const emailData: ReportEmailData = {
      to: email,
      reportType: reportType || "monthly",
      hotelName,
      periodStart: startDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
      periodEnd: endDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
      metrics: {
        totalRevenue: metrics.totalRevenue,
        roomRevenue: metrics.roomRevenue,
        posRevenue: metrics.posRevenue,
        occupancyRate: metrics.occupancyRate,
        totalBookings: metrics.totalBookings,
        onlineBookings: metrics.onlineBookings,
        walkInBookings: metrics.walkInBookings,
        averageStayDuration: metrics.averageStayDuration,
      },
      alerts: metrics.alerts,
      topRoom: metrics.topRoom,
    };

    const result = await sendReportEmail(emailData);

    return NextResponse.json({ success: true, messageId: result?.body?.messageId || "sent" });
  } catch (error: any) {
    console.error("Failed to send report email:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
