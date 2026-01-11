"use client";

import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export interface PeakAnalysisData {
  checkInsByHour: { hour: string; count: number }[];
  bookingsByDayOfWeek: { day: string; count: number; revenue: number }[];
  bookingsByMonth: { month: string; count: number; revenue: number }[];
  peakHour: string;
  peakDay: string;
  peakMonth: string;
  slowestDay: string;
  weekdayVsWeekend: { weekday: number; weekend: number; weekdayRevenue: number; weekendRevenue: number };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function usePeakAnalysis(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["peakAnalysis", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<PeakAnalysisData> => {
      const bookingsSnapshot = await get(ref(database, "bookings"));
      const allBookings: any[] = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];

      // Filter by date and status
      const filteredBookings = allBookings.filter((b) => {
        if (b.status !== "paid" && b.status !== "completed" && b.status !== "checked-in") return false;
        if (!startDate || !endDate) return true;
        const bookingDate = new Date(b.createdAt || b.checkIn);
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      // Check-ins by hour (based on createdAt timestamp)
      const hourCounts: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourCounts[i] = 0;

      filteredBookings.forEach((b) => {
        if (b.createdAt) {
          const hour = new Date(b.createdAt).getHours();
          hourCounts[hour]++;
        }
      });

      const checkInsByHour = Object.entries(hourCounts).map(([hour, count]) => ({
        hour: `${hour.padStart(2, "0")}:00`,
        count,
      }));

      // Bookings by day of week (based on check-in date)
      const dayData: Record<number, { count: number; revenue: number }> = {};
      for (let i = 0; i < 7; i++) dayData[i] = { count: 0, revenue: 0 };

      filteredBookings.forEach((b) => {
        const checkInDate = new Date(b.checkIn);
        const dayOfWeek = checkInDate.getDay();
        dayData[dayOfWeek].count++;
        dayData[dayOfWeek].revenue += b.totalPrice || 0;
      });

      const bookingsByDayOfWeek = Object.entries(dayData).map(([day, data]) => ({
        day: DAY_NAMES[parseInt(day)],
        count: data.count,
        revenue: data.revenue,
      }));

      // Bookings by month
      const monthData: Record<string, { count: number; revenue: number }> = {};

      filteredBookings.forEach((b) => {
        const date = new Date(b.checkIn);
        const key = MONTH_NAMES[date.getMonth()];
        if (!monthData[key]) monthData[key] = { count: 0, revenue: 0 };
        monthData[key].count++;
        monthData[key].revenue += b.totalPrice || 0;
      });

      const bookingsByMonth = MONTH_NAMES.map((month) => ({
        month,
        count: monthData[month]?.count || 0,
        revenue: monthData[month]?.revenue || 0,
      }));

      // Find peaks
      const peakHourEntry = checkInsByHour.reduce((max, curr) => curr.count > max.count ? curr : max, checkInsByHour[0]);
      const peakDayEntry = bookingsByDayOfWeek.reduce((max, curr) => curr.count > max.count ? curr : max, bookingsByDayOfWeek[0]);
      const slowestDayEntry = bookingsByDayOfWeek.reduce((min, curr) => curr.count < min.count ? curr : min, bookingsByDayOfWeek[0]);
      const peakMonthEntry = bookingsByMonth.reduce((max, curr) => curr.count > max.count ? curr : max, bookingsByMonth[0]);

      // Weekday vs Weekend
      const weekdayDays = [1, 2, 3, 4, 5]; // Mon-Fri
      const weekendDays = [0, 6]; // Sun, Sat

      const weekdayStats = weekdayDays.reduce(
        (acc, day) => ({
          count: acc.count + dayData[day].count,
          revenue: acc.revenue + dayData[day].revenue,
        }),
        { count: 0, revenue: 0 }
      );

      const weekendStats = weekendDays.reduce(
        (acc, day) => ({
          count: acc.count + dayData[day].count,
          revenue: acc.revenue + dayData[day].revenue,
        }),
        { count: 0, revenue: 0 }
      );

      return {
        checkInsByHour,
        bookingsByDayOfWeek,
        bookingsByMonth,
        peakHour: peakHourEntry?.hour || "N/A",
        peakDay: peakDayEntry?.day || "N/A",
        peakMonth: peakMonthEntry?.month || "N/A",
        slowestDay: slowestDayEntry?.day || "N/A",
        weekdayVsWeekend: {
          weekday: weekdayStats.count,
          weekend: weekendStats.count,
          weekdayRevenue: weekdayStats.revenue,
          weekendRevenue: weekendStats.revenue,
        },
      };
    },
  });
}
