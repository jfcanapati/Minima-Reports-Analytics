"use client";

import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export interface GuestAnalytics {
  totalGuests: number;
  onlineBookings: number;
  walkInBookings: number;
  onlinePercentage: number;
  walkInPercentage: number;
  repeatGuests: number;
  repeatGuestPercentage: number;
  newGuests: number;
  averageStayDuration: number;
  guestsByMonth: { month: string; online: number; walkIn: number }[];
  topGuests: { name: string; email: string; bookings: number; totalSpent: number }[];
  stayDurationDistribution: { range: string; count: number }[];
}

export function useGuestAnalytics(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["guestAnalytics", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<GuestAnalytics> => {
      const [bookingsSnapshot, guestsSnapshot] = await Promise.all([
        get(ref(database, "bookings")),
        get(ref(database, "guests"))
      ]);

      const allBookings: any[] = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      const allGuests: any[] = guestsSnapshot.exists() ? Object.values(guestsSnapshot.val()) : [];

      // Filter by date range if provided
      const filteredBookings = allBookings.filter((b) => {
        if (b.status !== "paid" && b.status !== "completed" && b.status !== "checked-in") return false;
        if (!startDate || !endDate) return true;
        const bookingDate = new Date(b.createdAt || b.checkIn);
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      // Count online vs walk-in
      const onlineBookings = filteredBookings.filter(b => !b.isWalkIn).length;
      const walkInBookings = filteredBookings.filter(b => b.isWalkIn).length;
      const totalBookings = filteredBookings.length;

      // Calculate stay durations
      const stayDurations: number[] = [];
      filteredBookings.forEach(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        if (nights > 0) stayDurations.push(nights);
      });

      const averageStayDuration = stayDurations.length > 0 
        ? stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length 
        : 0;

      // Stay duration distribution
      const stayDurationDistribution = [
        { range: "1 night", count: stayDurations.filter(d => d === 1).length },
        { range: "2 nights", count: stayDurations.filter(d => d === 2).length },
        { range: "3-4 nights", count: stayDurations.filter(d => d >= 3 && d <= 4).length },
        { range: "5-7 nights", count: stayDurations.filter(d => d >= 5 && d <= 7).length },
        { range: "8+ nights", count: stayDurations.filter(d => d >= 8).length },
      ];

      // Repeat guests (guests with more than 1 booking)
      const guestBookingCount: Record<string, { name: string; email: string; count: number; spent: number }> = {};
      filteredBookings.forEach(b => {
        const guestId = b.guestId || b.guestEmail;
        if (!guestBookingCount[guestId]) {
          guestBookingCount[guestId] = { name: b.guestName, email: b.guestEmail, count: 0, spent: 0 };
        }
        guestBookingCount[guestId].count++;
        guestBookingCount[guestId].spent += b.totalPrice || 0;
      });

      const uniqueGuests = Object.keys(guestBookingCount).length;
      const repeatGuests = Object.values(guestBookingCount).filter(g => g.count > 1).length;
      const newGuests = uniqueGuests - repeatGuests;

      // Top guests by bookings
      const topGuests = Object.values(guestBookingCount)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
        .map(g => ({ name: g.name, email: g.email, bookings: g.count, totalSpent: g.spent }));

      // Bookings by month
      const monthlyData: Record<string, { online: number; walkIn: number }> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      filteredBookings.forEach(b => {
        const date = new Date(b.createdAt || b.checkIn);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!monthlyData[key]) monthlyData[key] = { online: 0, walkIn: 0 };
        if (b.isWalkIn) monthlyData[key].walkIn++;
        else monthlyData[key].online++;
      });

      const guestsByMonth = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .slice(-6);

      return {
        totalGuests: uniqueGuests,
        onlineBookings,
        walkInBookings,
        onlinePercentage: totalBookings > 0 ? Math.round((onlineBookings / totalBookings) * 100) : 0,
        walkInPercentage: totalBookings > 0 ? Math.round((walkInBookings / totalBookings) * 100) : 0,
        repeatGuests,
        repeatGuestPercentage: uniqueGuests > 0 ? Math.round((repeatGuests / uniqueGuests) * 100) : 0,
        newGuests,
        averageStayDuration: Math.round(averageStayDuration * 10) / 10,
        guestsByMonth,
        topGuests,
        stayDurationDistribution,
      };
    },
  });
}
