"use client";

import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export interface RoomType { 
  type: string; 
  occupied: number; 
  total: number; 
  rate: number; 
  capacity: number;
  amenities: string[];
}

export interface Booking { 
  id: string; 
  guest: string; 
  room: string; 
  checkIn: string; 
  checkOut: string; 
  status: string; 
  totalPrice: number;
  isWalkIn: boolean;
  guestEmail: string;
  guestPhone: string;
}

export interface InventoryItem { category: string; used: number; cost: number; wastage: number; }
export interface DailyOccupancy { date: string; occupied: number; available: number; rate: number; }
export interface MonthlyOccupancy { month: string; rate: number; }
export interface MonthlyRevenue { month: string; rooms: number; restaurant: number; spa: number; other: number; }

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to format date as YYYY-MM-DD
function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Fetch rooms and compute room types with occupancy
export function useRoomTypes(targetDate?: Date) {
  const dateStr = targetDate ? formatDateStr(targetDate) : formatDateStr(new Date());
  
  return useQuery({
    queryKey: ["roomTypes", dateStr],
    queryFn: async (): Promise<RoomType[]> => {
      const [roomsSnapshot, bookingsSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings"))
      ]);

      if (!roomsSnapshot.exists()) return [];

      const rooms = roomsSnapshot.val();
      const bookings = bookingsSnapshot.exists() ? bookingsSnapshot.val() : {};

      // Get active bookings (checked-in or paid, within date range)
      const activeBookings = Object.values(bookings).filter((b: any) => 
        (b.status === "paid" || b.status === "checked-in") &&
        b.checkIn <= dateStr && b.checkOut >= dateStr
      );

      // Group rooms by type
      const roomTypeMap: Record<string, { total: number; occupied: number; rate: number; capacity: number; amenities: string[] }> = {};

      Object.values(rooms).forEach((room: any) => {
        const type = room.type;
        if (!roomTypeMap[type]) {
          roomTypeMap[type] = { 
            total: 0, 
            occupied: 0, 
            rate: room.pricePerNight,
            capacity: room.capacity || 2,
            amenities: room.amenities || []
          };
        }
        roomTypeMap[type].total += 1;
        if (room.capacity > roomTypeMap[type].capacity) {
          roomTypeMap[type].capacity = room.capacity;
        }
      });

      // Count occupied rooms by type
      activeBookings.forEach((booking: any) => {
        const type = booking.roomType;
        if (roomTypeMap[type]) {
          roomTypeMap[type].occupied += 1;
        }
      });

      return Object.entries(roomTypeMap).map(([type, data]) => ({
        type,
        occupied: data.occupied,
        total: data.total,
        rate: data.rate,
        capacity: data.capacity,
        amenities: data.amenities,
      }));
    },
  });
}

// Fetch bookings with date range filter
export function useBookings(startDate?: Date, endDate?: Date) {
  const start = startDate ? formatDateStr(startDate) : null;
  const end = endDate ? formatDateStr(endDate) : null;
  
  return useQuery({
    queryKey: ["bookings", start, end],
    queryFn: async (): Promise<Booking[]> => {
      const snapshot = await get(ref(database, "bookings"));
      if (!snapshot.exists()) return [];

      const data = snapshot.val();
      let bookings = Object.entries(data)
        .map(([key, b]: [string, any]) => ({
          id: key.slice(-6).toUpperCase(),
          guest: b.guestName,
          room: b.roomType,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
          totalPrice: b.totalPrice || 0,
          isWalkIn: b.isWalkIn || false,
          guestEmail: b.guestEmail || "",
          guestPhone: b.guestPhone || "",
        }));

      // Filter by date range if provided
      if (start && end) {
        bookings = bookings.filter(b => 
          (b.checkIn >= start && b.checkIn <= end) || 
          (b.checkOut >= start && b.checkOut <= end) ||
          (b.checkIn <= start && b.checkOut >= end)
        );
      }

      return bookings
        .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
        .slice(0, 10);
    },
  });
}

// Booking statistics with date range
export function useBookingStats(startDate?: Date, endDate?: Date) {
  const start = startDate ? formatDateStr(startDate) : null;
  const end = endDate ? formatDateStr(endDate) : null;
  
  return useQuery({
    queryKey: ["bookingStats", start, end],
    queryFn: async () => {
      const snapshot = await get(ref(database, "bookings"));
      if (!snapshot.exists()) return { total: 0, walkIn: 0, online: 0, totalRevenue: 0 };

      let bookings = Object.values(snapshot.val()) as any[];
      
      // Filter by date range
      if (start && end) {
        bookings = bookings.filter(b => {
          const createdAt = b.createdAt ? b.createdAt.split("T")[0] : b.checkIn;
          return createdAt >= start && createdAt <= end;
        });
      }
      
      const paidBookings = bookings.filter(b => b.status === "paid" || b.status === "completed");
      
      return {
        total: paidBookings.length,
        walkIn: paidBookings.filter(b => b.isWalkIn).length,
        online: paidBookings.filter(b => !b.isWalkIn).length,
        totalRevenue: paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      };
    },
  });
}

// Compute daily occupancy from bookings with date range
export function useDailyOccupancy(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  
  return useQuery({
    queryKey: ["dailyOccupancy", formatDateStr(start), formatDateStr(end)],
    queryFn: async (): Promise<DailyOccupancy[]> => {
      const [roomsSnapshot, bookingsSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings"))
      ]);

      const totalRooms = roomsSnapshot.exists() ? Object.keys(roomsSnapshot.val()).length : 0;
      const bookings = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];

      // Calculate days between start and end
      const days: DailyOccupancy[] = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateStr = formatDateStr(currentDate);

        // Count bookings active on this date
        const occupied = bookings.filter((b: any) =>
          (b.status === "paid" || b.status === "checked-in") &&
          b.checkIn <= dateStr && b.checkOut >= dateStr
        ).length;

        const available = totalRooms - occupied;
        const rate = totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;

        days.push({
          date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          occupied,
          available,
          rate: Math.round(rate * 10) / 10,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days;
    },
  });
}

// Compute monthly occupancy from bookings with date range
export function useMonthlyOccupancy(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 5));
  const end = endDate || new Date();
  
  return useQuery({
    queryKey: ["monthlyOccupancy", formatDateStr(start), formatDateStr(end)],
    queryFn: async (): Promise<MonthlyOccupancy[]> => {
      const [roomsSnapshot, bookingsSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings"))
      ]);

      const totalRooms = roomsSnapshot.exists() ? Object.keys(roomsSnapshot.val()).length : 0;
      const bookings = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];

      // Get months between start and end
      const months: MonthlyOccupancy[] = [];
      const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      
      while (currentDate <= endMonth) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        let totalNights = 0;
        let occupiedNights = 0;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        totalNights = totalRooms * daysInMonth;

        bookings.forEach((b: any) => {
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

        const rate = totalNights > 0 ? (occupiedNights / totalNights) * 100 : 0;
        months.push({
          month: MONTH_NAMES[month],
          rate: Math.round(rate * 10) / 10,
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return months;
    },
  });
}

// Compute monthly revenue from bookings and POS transactions with date range
export function useMonthlyRevenue(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 5));
  const end = endDate || new Date();
  
  return useQuery({
    queryKey: ["monthlyRevenue", formatDateStr(start), formatDateStr(end)],
    queryFn: async (): Promise<MonthlyRevenue[]> => {
      const [bookingsSnapshot, posSnapshot, posItemsSnapshot, productsSnapshot] = await Promise.all([
        get(ref(database, "bookings")),
        get(ref(database, "pos_transactions")),
        get(ref(database, "pos_transaction_items")),
        get(ref(database, "pos_products"))
      ]);

      const bookings = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      const posTransactions = posSnapshot.exists() ? posSnapshot.val() : {};
      const posItems = posItemsSnapshot.exists() ? Object.values(posItemsSnapshot.val()) : [];
      const products = productsSnapshot.exists() ? productsSnapshot.val() : {};

      // Build product category map
      const productCategoryMap: Record<string, string> = {};
      Object.entries(products).forEach(([id, p]: [string, any]) => {
        productCategoryMap[id] = p.category_id;
      });

      // Get months between start and end
      const months: MonthlyRevenue[] = [];
      const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      
      while (currentDate <= endMonth) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        let roomsRevenue = 0;
        let foodsRevenue = 0;
        let servicesRevenue = 0;

        // Sum booking revenue for this month
        bookings.forEach((b: any) => {
          if (b.status !== "paid" && b.status !== "completed") return;
          const bookingDate = new Date(b.createdAt || b.checkIn);
          if (bookingDate.getFullYear() === year && bookingDate.getMonth() === month) {
            roomsRevenue += b.totalPrice || 0;
          }
        });

        // Sum POS revenue by category for this month
        Object.entries(posTransactions).forEach(([transId, t]: [string, any]) => {
          if (t.status !== "completed") return;
          const transDate = new Date(t.created_at);
          if (transDate.getFullYear() !== year || transDate.getMonth() !== month) return;

          const transItems = posItems.filter((item: any) => item.transaction_id === transId);
          
          if (transItems.length > 0) {
            transItems.forEach((item: any) => {
              const category = productCategoryMap[item.product_id];
              if (category === "foods") {
                foodsRevenue += item.total_price || 0;
              } else {
                servicesRevenue += item.total_price || 0;
              }
            });
          } else {
            servicesRevenue += t.subtotal || 0;
          }
        });

        months.push({
          month: MONTH_NAMES[month],
          rooms: roomsRevenue,
          restaurant: foodsRevenue,
          spa: servicesRevenue,
          other: 0,
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return months;
    },
  });
}

// POS Revenue breakdown by category
export interface POSCategoryRevenue {
  category: string;
  categoryName: string;
  revenue: number;
  transactionCount: number;
}

export function usePOSCategoryRevenue() {
  return useQuery({
    queryKey: ["posCategoryRevenue"],
    queryFn: async (): Promise<POSCategoryRevenue[]> => {
      const [posSnapshot, posItemsSnapshot, productsSnapshot, categoriesSnapshot] = await Promise.all([
        get(ref(database, "pos_transactions")),
        get(ref(database, "pos_transaction_items")),
        get(ref(database, "pos_products")),
        get(ref(database, "pos_categories"))
      ]);

      const posTransactions = posSnapshot.exists() ? posSnapshot.val() : {};
      const posItems = posItemsSnapshot.exists() ? Object.values(posItemsSnapshot.val()) : [];
      const products = productsSnapshot.exists() ? productsSnapshot.val() : {};
      const categories = categoriesSnapshot.exists() ? categoriesSnapshot.val() : {};

      // Build product category map
      const productCategoryMap: Record<string, string> = {};
      Object.entries(products).forEach(([id, p]: [string, any]) => {
        productCategoryMap[id] = p.category_id;
      });

      // Aggregate by category
      const categoryRevenue: Record<string, { revenue: number; transactions: Set<string> }> = {};

      posItems.forEach((item: any) => {
        const trans = posTransactions[item.transaction_id];
        if (!trans || trans.status !== "completed") return;

        const categoryId = productCategoryMap[item.product_id] || "other";
        if (!categoryRevenue[categoryId]) {
          categoryRevenue[categoryId] = { revenue: 0, transactions: new Set() };
        }
        categoryRevenue[categoryId].revenue += item.total_price || 0;
        categoryRevenue[categoryId].transactions.add(item.transaction_id);
      });

      return Object.entries(categoryRevenue).map(([catId, data]) => ({
        category: catId,
        categoryName: categories[catId]?.name || catId,
        revenue: data.revenue,
        transactionCount: data.transactions.size,
      }));
    },
  });
}

// Payment method breakdown
export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export function usePaymentMethodBreakdown() {
  return useQuery({
    queryKey: ["paymentMethodBreakdown"],
    queryFn: async (): Promise<PaymentMethodBreakdown[]> => {
      const posSnapshot = await get(ref(database, "pos_transactions"));
      if (!posSnapshot.exists()) return [];

      const transactions = Object.values(posSnapshot.val()) as any[];
      const completedTrans = transactions.filter(t => t.status === "completed");

      // Aggregate by payment method
      const methodMap: Record<string, { amount: number; count: number }> = {};
      let totalAmount = 0;

      completedTrans.forEach((t) => {
        const method = t.payment_method || "unknown";
        if (!methodMap[method]) {
          methodMap[method] = { amount: 0, count: 0 };
        }
        methodMap[method].amount += t.total || 0;
        methodMap[method].count += 1;
        totalAmount += t.total || 0;
      });

      return Object.entries(methodMap).map(([method, data]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      }));
    },
  });
}

// Top selling products/services
export interface TopProduct {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  price: number;
}

export function useTopProducts(limit: number = 10) {
  return useQuery({
    queryKey: ["topProducts", limit],
    queryFn: async (): Promise<TopProduct[]> => {
      const [posSnapshot, posItemsSnapshot, productsSnapshot, categoriesSnapshot] = await Promise.all([
        get(ref(database, "pos_transactions")),
        get(ref(database, "pos_transaction_items")),
        get(ref(database, "pos_products")),
        get(ref(database, "pos_categories"))
      ]);

      const posTransactions = posSnapshot.exists() ? posSnapshot.val() : {};
      const posItems = posItemsSnapshot.exists() ? Object.values(posItemsSnapshot.val()) : [];
      const products = productsSnapshot.exists() ? productsSnapshot.val() : {};
      const categories = categoriesSnapshot.exists() ? categoriesSnapshot.val() : {};

      // Aggregate by product
      const productSales: Record<string, { quantity: number; revenue: number }> = {};

      posItems.forEach((item: any) => {
        const trans = posTransactions[item.transaction_id];
        if (!trans || trans.status !== "completed") return;

        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = { quantity: 0, revenue: 0 };
        }
        productSales[productId].quantity += item.quantity || 1;
        productSales[productId].revenue += item.total_price || 0;
      });

      // Build result with product details
      const result: TopProduct[] = Object.entries(productSales).map(([id, sales]) => {
        const product = products[id] || {};
        const categoryId = product.category_id || "other";
        return {
          id,
          name: product.name || id,
          category: categories[categoryId]?.name || categoryId,
          quantitySold: sales.quantity,
          revenue: sales.revenue,
          price: product.price || 0,
        };
      });

      // Sort by revenue descending
      return result.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    },
  });
}

// Revenue summary stats with date range
export interface RevenueSummary {
  totalRoomRevenue: number;
  totalPOSRevenue: number;
  totalRevenue: number;
  avgTransactionValue: number;
  totalTransactions: number;
  taxCollected: number;
}

export function useRevenueSummary(startDate?: Date, endDate?: Date) {
  const start = startDate ? formatDateStr(startDate) : null;
  const end = endDate ? formatDateStr(endDate) : null;
  
  return useQuery({
    queryKey: ["revenueSummary", start, end],
    queryFn: async (): Promise<RevenueSummary> => {
      const [bookingsSnapshot, posSnapshot] = await Promise.all([
        get(ref(database, "bookings")),
        get(ref(database, "pos_transactions"))
      ]);

      let bookings = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      let posTransactions = posSnapshot.exists() ? Object.values(posSnapshot.val()) : [];

      // Filter by date range
      if (start && end) {
        bookings = bookings.filter((b: any) => {
          const createdAt = (b.createdAt || b.checkIn).split("T")[0];
          return createdAt >= start && createdAt <= end;
        });
        posTransactions = posTransactions.filter((t: any) => {
          const createdAt = t.created_at.split("T")[0];
          return createdAt >= start && createdAt <= end;
        });
      }

      const paidBookings = bookings.filter((b: any) => b.status === "paid" || b.status === "completed");
      const completedTrans = posTransactions.filter((t: any) => t.status === "completed");

      const totalRoomRevenue = paidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
      const totalPOSRevenue = completedTrans.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const taxCollected = completedTrans.reduce((sum: number, t: any) => sum + (t.tax || 0), 0);

      return {
        totalRoomRevenue,
        totalPOSRevenue,
        totalRevenue: totalRoomRevenue + totalPOSRevenue,
        avgTransactionValue: completedTrans.length > 0 ? totalPOSRevenue / completedTrans.length : 0,
        totalTransactions: completedTrans.length,
        taxCollected,
      };
    },
  });
}

// Inventory items (placeholder - needs inventory module)
export function useInventoryItems() {
  return useQuery({
    queryKey: ["inventoryItems"],
    queryFn: async (): Promise<InventoryItem[]> => {
      // Return placeholder data until inventory module is connected
      return [
        { category: "Linens", used: 120, cost: 15000, wastage: 2.5 },
        { category: "Toiletries", used: 450, cost: 8500, wastage: 1.8 },
        { category: "Minibar", used: 85, cost: 12000, wastage: 3.2 },
        { category: "Cleaning Supplies", used: 200, cost: 6500, wastage: 1.2 },
      ];
    },
  });
}

// Period comparison data
export interface PeriodComparison {
  current: {
    revenue: number;
    roomRevenue: number;
    posRevenue: number;
    bookings: number;
    occupancyRate: number;
    adr: number;
    revpar: number;
  };
  previous: {
    revenue: number;
    roomRevenue: number;
    posRevenue: number;
    bookings: number;
    occupancyRate: number;
    adr: number;
    revpar: number;
  };
  changes: {
    revenue: number;
    roomRevenue: number;
    posRevenue: number;
    bookings: number;
    occupancyRate: number;
    adr: number;
    revpar: number;
  };
}

// Hook to compare current period vs previous period
export function usePeriodComparison(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  
  // Calculate previous period (same duration, before start date)
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1); // day before current start
  const prevStart = new Date(prevEnd.getTime() - duration);
  
  return useQuery({
    queryKey: ["periodComparison", formatDateStr(start), formatDateStr(end)],
    queryFn: async (): Promise<PeriodComparison> => {
      const [roomsSnapshot, bookingsSnapshot, posSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings")),
        get(ref(database, "pos_transactions"))
      ]);

      const rooms = roomsSnapshot.exists() ? Object.values(roomsSnapshot.val()) : [];
      const totalRooms = rooms.length;
      const allBookings = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      const allPOS = posSnapshot.exists() ? Object.values(posSnapshot.val()) : [];

      // Helper to calculate metrics for a period
      const calculatePeriodMetrics = (periodStart: Date, periodEnd: Date) => {
        const startStr = formatDateStr(periodStart);
        const endStr = formatDateStr(periodEnd);
        
        // Filter bookings for this period
        const periodBookings = allBookings.filter((b: any) => {
          if (b.status !== "paid" && b.status !== "completed") return false;
          const createdAt = (b.createdAt || b.checkIn).split("T")[0];
          return createdAt >= startStr && createdAt <= endStr;
        });
        
        // Filter POS for this period
        const periodPOS = allPOS.filter((t: any) => {
          if (t.status !== "completed") return false;
          const createdAt = t.created_at.split("T")[0];
          return createdAt >= startStr && createdAt <= endStr;
        });
        
        const roomRevenue = periodBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        const posRevenue = periodPOS.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
        
        // Calculate occupancy for the period (average daily occupancy)
        let totalOccupiedDays = 0;
        let totalDays = 0;
        const currentDate = new Date(periodStart);
        
        while (currentDate <= periodEnd) {
          const dateStr = formatDateStr(currentDate);
          const occupiedRooms = allBookings.filter((b: any) =>
            (b.status === "paid" || b.status === "checked-in" || b.status === "completed") &&
            b.checkIn <= dateStr && b.checkOut >= dateStr
          ).length;
          totalOccupiedDays += occupiedRooms;
          totalDays += totalRooms;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const occupancyRate = totalDays > 0 ? (totalOccupiedDays / totalDays) * 100 : 0;
        const avgOccupiedRooms = totalDays > 0 ? totalOccupiedDays / (totalDays / totalRooms) : 0;
        
        // Calculate ADR (Average Daily Rate)
        const adr = periodBookings.length > 0 ? roomRevenue / periodBookings.length : 0;
        
        // Calculate RevPAR
        const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const revpar = totalRooms > 0 ? roomRevenue / (totalRooms * daysInPeriod) : 0;
        
        return {
          revenue: roomRevenue + posRevenue,
          roomRevenue,
          posRevenue,
          bookings: periodBookings.length,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
        };
      };
      
      const current = calculatePeriodMetrics(start, end);
      const previous = calculatePeriodMetrics(prevStart, prevEnd);
      
      // Calculate percentage changes
      const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 1000) / 10;
      };
      
      return {
        current,
        previous,
        changes: {
          revenue: calcChange(current.revenue, previous.revenue),
          roomRevenue: calcChange(current.roomRevenue, previous.roomRevenue),
          posRevenue: calcChange(current.posRevenue, previous.posRevenue),
          bookings: calcChange(current.bookings, previous.bookings),
          occupancyRate: calcChange(current.occupancyRate, previous.occupancyRate),
          adr: calcChange(current.adr, previous.adr),
          revpar: calcChange(current.revpar, previous.revpar),
        },
      };
    },
  });
}

export function calculateKPIs(roomTypes: RoomType[], monthlyRevenue: MonthlyRevenue[]) {
  const totalRooms = roomTypes.reduce((acc, r) => acc + r.total, 0);
  const occupiedRooms = roomTypes.reduce((acc, r) => acc + r.occupied, 0);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  const totalRoomRevenue = roomTypes.reduce((acc, r) => acc + r.occupied * r.rate, 0);
  const adr = occupiedRooms > 0 ? totalRoomRevenue / occupiedRooms : 0;
  const revpar = totalRooms > 0 ? totalRoomRevenue / totalRooms : 0;
  const totalRevenue = monthlyRevenue.reduce((acc, r) => acc + r.rooms + r.restaurant + r.spa + r.other, 0);
  const totalCapacity = roomTypes.reduce((acc, r) => acc + (r.capacity * r.total), 0);

  return {
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    occupancyChange: 5.2,
    adr: Math.round(adr * 100) / 100,
    adrChange: 3.8,
    revpar: Math.round(revpar * 100) / 100,
    revparChange: 8.1,
    totalRevenue,
    revenueChange: 12.4,
    totalCapacity,
  };
}

export function calculateRevenueByCatagory(monthlyRevenue: MonthlyRevenue[]) {
  const totals = monthlyRevenue.reduce(
    (acc, r) => ({
      rooms: acc.rooms + r.rooms,
      foods: acc.foods + r.restaurant,
      services: acc.services + r.spa,
      other: acc.other + r.other,
    }),
    { rooms: 0, foods: 0, services: 0, other: 0 }
  );
  
  // Filter out categories with zero value
  const categories = [
    { name: "Rooms", value: totals.rooms },
    { name: "Foods", value: totals.foods },
    { name: "Services", value: totals.services },
    { name: "Other", value: totals.other },
  ];
  
  return categories.filter(c => c.value > 0);
}


// Combined report data for email reports
export interface CombinedReportData {
  totalRevenue: number;
  roomRevenue: number;
  posRevenue: number;
  occupancyRate: number;
  totalBookings: number;
  onlineBookings: number;
  walkInBookings: number;
}

export function useCombinedReportData(startDate?: Date, endDate?: Date) {
  const start = startDate ? formatDateStr(startDate) : null;
  const end = endDate ? formatDateStr(endDate) : null;
  
  return useQuery({
    queryKey: ["combinedReportData", start, end],
    queryFn: async (): Promise<CombinedReportData> => {
      const [roomsSnapshot, bookingsSnapshot, posSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings")),
        get(ref(database, "pos_transactions"))
      ]);

      const totalRooms = roomsSnapshot.exists() ? Object.keys(roomsSnapshot.val()).length : 1;
      let allBookings: any[] = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      let allPOS: any[] = posSnapshot.exists() ? Object.values(posSnapshot.val()) : [];

      // Filter by date range
      if (start && end) {
        allBookings = allBookings.filter((b: any) => {
          const createdAt = (b.createdAt || b.checkIn).split("T")[0];
          return createdAt >= start && createdAt <= end;
        });
        allPOS = allPOS.filter((t: any) => {
          const createdAt = t.created_at.split("T")[0];
          return createdAt >= start && createdAt <= end;
        });
      }

      const paidBookings = allBookings.filter((b: any) => b.status === "paid" || b.status === "completed");
      const completedPOS = allPOS.filter((t: any) => t.status === "completed");

      const roomRevenue = paidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
      const posRevenue = completedPOS.reduce((sum: number, t: any) => sum + (t.total || 0), 0);

      // Calculate occupancy
      const startD = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endD = endDate || new Date();
      const daysInPeriod = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      
      let occupiedNights = 0;
      paidBookings.forEach((b: any) => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const overlapStart = checkIn > startD ? checkIn : startD;
        const overlapEnd = checkOut < endD ? checkOut : endD;
        if (overlapStart <= overlapEnd) {
          const nights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
          occupiedNights += Math.max(0, nights);
        }
      });
      
      const totalNights = totalRooms * daysInPeriod;
      const occupancyRate = totalNights > 0 ? Math.round((occupiedNights / totalNights) * 100) : 0;

      return {
        totalRevenue: roomRevenue + posRevenue,
        roomRevenue,
        posRevenue,
        occupancyRate,
        totalBookings: paidBookings.length,
        onlineBookings: paidBookings.filter((b: any) => !b.isWalkIn).length,
        walkInBookings: paidBookings.filter((b: any) => b.isWalkIn).length,
      };
    },
  });
}
