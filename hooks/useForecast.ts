"use client";

import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface ForecastData {
  month: string;
  revenue: number;
  occupancy: number;
  bookings: number;
  isProjected: boolean;
}

export interface ForecastSummary {
  projectedRevenue: number;
  projectedOccupancy: number;
  projectedBookings: number;
  revenueGrowthRate: number;
  occupancyTrend: "up" | "down" | "stable";
  confidence: "high" | "medium" | "low";
}

// Simple linear regression for trend calculation
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

// Calculate moving average
function movingAverage(data: number[], window: number = 3): number {
  if (data.length === 0) return 0;
  const slice = data.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function useForecast(monthsToForecast: number = 3) {
  return useQuery({
    queryKey: ["forecast", monthsToForecast],
    queryFn: async (): Promise<{ historical: ForecastData[]; forecast: ForecastData[]; summary: ForecastSummary }> => {
      const [roomsSnapshot, bookingsSnapshot, posSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings")),
        get(ref(database, "pos_transactions"))
      ]);

      const totalRooms = roomsSnapshot.exists() ? Object.keys(roomsSnapshot.val()).length : 1;
      const allBookings = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      const allPOS = posSnapshot.exists() ? Object.values(posSnapshot.val()) : [];

      // Get last 6 months of historical data
      const historical: ForecastData[] = [];
      const revenueHistory: number[] = [];
      const occupancyHistory: number[] = [];
      const bookingsHistory: number[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Calculate revenue for this month
        let roomRevenue = 0;
        let posRevenue = 0;
        let monthBookings = 0;

        allBookings.forEach((b: any) => {
          if (b.status !== "paid" && b.status !== "completed") return;
          const bookingDate = new Date(b.createdAt || b.checkIn);
          if (bookingDate.getFullYear() === year && bookingDate.getMonth() === month) {
            roomRevenue += b.totalPrice || 0;
            monthBookings++;
          }
        });

        allPOS.forEach((t: any) => {
          if (t.status !== "completed") return;
          const transDate = new Date(t.created_at);
          if (transDate.getFullYear() === year && transDate.getMonth() === month) {
            posRevenue += t.total || 0;
          }
        });

        // Calculate occupancy for this month
        let occupiedNights = 0;
        allBookings.forEach((b: any) => {
          if (b.status !== "paid" && b.status !== "checked-in" && b.status !== "completed") return;
          
          const checkIn = new Date(b.checkIn);
          const checkOut = new Date(b.checkOut);
          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);

          const overlapStart = checkIn > monthStart ? checkIn : monthStart;
          const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd;

          if (overlapStart <= overlapEnd) {
            const nights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
            occupiedNights += Math.max(0, nights);
          }
        });

        const totalNights = totalRooms * daysInMonth;
        const occupancyRate = totalNights > 0 ? (occupiedNights / totalNights) * 100 : 0;
        const totalRevenue = roomRevenue + posRevenue;

        historical.push({
          month: MONTH_NAMES[month],
          revenue: totalRevenue,
          occupancy: Math.round(occupancyRate * 10) / 10,
          bookings: monthBookings,
          isProjected: false,
        });

        revenueHistory.push(totalRevenue);
        occupancyHistory.push(occupancyRate);
        bookingsHistory.push(monthBookings);
      }

      // Calculate trends using linear regression
      const revenueTrend = linearRegression(revenueHistory);
      const occupancyTrend = linearRegression(occupancyHistory);
      const bookingsTrend = linearRegression(bookingsHistory);

      // Calculate moving averages for smoothing
      const revenueMA = movingAverage(revenueHistory);
      const occupancyMA = movingAverage(occupancyHistory);
      const bookingsMA = movingAverage(bookingsHistory);

      // Generate forecast
      const forecast: ForecastData[] = [];
      const n = revenueHistory.length;

      for (let i = 1; i <= monthsToForecast; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const month = date.getMonth();

        // Blend trend projection with moving average for more stable forecast
        const trendRevenue = revenueTrend.intercept + revenueTrend.slope * (n + i - 1);
        const trendOccupancy = occupancyTrend.intercept + occupancyTrend.slope * (n + i - 1);
        const trendBookings = bookingsTrend.intercept + bookingsTrend.slope * (n + i - 1);

        // Weight: 60% trend, 40% moving average
        const projectedRevenue = Math.max(0, trendRevenue * 0.6 + revenueMA * 0.4);
        const projectedOccupancy = Math.min(100, Math.max(0, trendOccupancy * 0.6 + occupancyMA * 0.4));
        const projectedBookings = Math.max(0, Math.round(trendBookings * 0.6 + bookingsMA * 0.4));

        forecast.push({
          month: MONTH_NAMES[month],
          revenue: Math.round(projectedRevenue),
          occupancy: Math.round(projectedOccupancy * 10) / 10,
          bookings: projectedBookings,
          isProjected: true,
        });
      }

      // Calculate summary
      const totalProjectedRevenue = forecast.reduce((sum, f) => sum + f.revenue, 0);
      const avgProjectedOccupancy = forecast.reduce((sum, f) => sum + f.occupancy, 0) / forecast.length;
      const totalProjectedBookings = forecast.reduce((sum, f) => sum + f.bookings, 0);

      // Calculate growth rate
      const lastMonthRevenue = revenueHistory[revenueHistory.length - 1] || 1;
      const avgForecastRevenue = totalProjectedRevenue / monthsToForecast;
      const revenueGrowthRate = ((avgForecastRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

      // Determine occupancy trend
      let occupancyTrendDirection: "up" | "down" | "stable" = "stable";
      if (occupancyTrend.slope > 1) occupancyTrendDirection = "up";
      else if (occupancyTrend.slope < -1) occupancyTrendDirection = "down";

      // Determine confidence based on data consistency
      const revenueVariance = revenueHistory.reduce((sum, r) => sum + Math.pow(r - revenueMA, 2), 0) / revenueHistory.length;
      const revenueStdDev = Math.sqrt(revenueVariance);
      const coefficientOfVariation = revenueMA > 0 ? revenueStdDev / revenueMA : 1;
      
      let confidence: "high" | "medium" | "low" = "medium";
      if (coefficientOfVariation < 0.3 && revenueHistory.filter(r => r > 0).length >= 4) {
        confidence = "high";
      } else if (coefficientOfVariation > 0.6 || revenueHistory.filter(r => r > 0).length < 3) {
        confidence = "low";
      }

      return {
        historical,
        forecast,
        summary: {
          projectedRevenue: totalProjectedRevenue,
          projectedOccupancy: Math.round(avgProjectedOccupancy * 10) / 10,
          projectedBookings: totalProjectedBookings,
          revenueGrowthRate: Math.round(revenueGrowthRate * 10) / 10,
          occupancyTrend: occupancyTrendDirection,
          confidence,
        },
      };
    },
  });
}
