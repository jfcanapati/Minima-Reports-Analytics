"use client";

import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export interface RoomPerformance {
  roomId: string;
  roomType: string;
  totalBookings: number;
  totalRevenue: number;
  averageRevenue: number;
  occupancyRate: number;
  averageStay: number;
  rank: number;
}

export interface RoomPerformanceData {
  rooms: RoomPerformance[];
  topPerformer: RoomPerformance | null;
  lowestPerformer: RoomPerformance | null;
  totalRoomRevenue: number;
  averageOccupancy: number;
}

export function useRoomPerformance(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["roomPerformance", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<RoomPerformanceData> => {
      const [roomsSnapshot, bookingsSnapshot] = await Promise.all([
        get(ref(database, "rooms")),
        get(ref(database, "bookings"))
      ]);

      const rooms: Record<string, any> = roomsSnapshot.exists() ? roomsSnapshot.val() : {};
      const allBookings: any[] = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];

      // Filter bookings by date and status
      const filteredBookings = allBookings.filter((b) => {
        if (b.status !== "paid" && b.status !== "completed" && b.status !== "checked-in") return false;
        if (!startDate || !endDate) return true;
        const bookingDate = new Date(b.createdAt || b.checkIn);
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      // Calculate days in period for occupancy
      const periodStart = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const periodEnd = endDate || new Date();
      const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) || 30;

      // Calculate performance per room
      const roomPerformance: Record<string, RoomPerformance> = {};

      // Initialize all rooms
      Object.entries(rooms).forEach(([roomId, room]: [string, any]) => {
        roomPerformance[roomId] = {
          roomId,
          roomType: room.type || "Unknown",
          totalBookings: 0,
          totalRevenue: 0,
          averageRevenue: 0,
          occupancyRate: 0,
          averageStay: 0,
          rank: 0,
        };
      });

      // Aggregate booking data
      const roomStays: Record<string, number[]> = {};
      const roomOccupiedNights: Record<string, number> = {};

      filteredBookings.forEach((b) => {
        const roomId = b.roomId;
        if (!roomPerformance[roomId]) {
          roomPerformance[roomId] = {
            roomId,
            roomType: b.roomType || "Unknown",
            totalBookings: 0,
            totalRevenue: 0,
            averageRevenue: 0,
            occupancyRate: 0,
            averageStay: 0,
            rank: 0,
          };
        }

        roomPerformance[roomId].totalBookings++;
        roomPerformance[roomId].totalRevenue += b.totalPrice || 0;

        // Calculate stay duration
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        if (!roomStays[roomId]) roomStays[roomId] = [];
        roomStays[roomId].push(nights);

        // Calculate occupied nights within period
        const overlapStart = checkIn > periodStart ? checkIn : periodStart;
        const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd;
        if (overlapStart <= overlapEnd) {
          const occupiedNights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
          roomOccupiedNights[roomId] = (roomOccupiedNights[roomId] || 0) + Math.max(0, occupiedNights);
        }
      });

      // Calculate averages and occupancy
      Object.keys(roomPerformance).forEach((roomId) => {
        const room = roomPerformance[roomId];
        room.averageRevenue = room.totalBookings > 0 ? Math.round(room.totalRevenue / room.totalBookings) : 0;
        room.averageStay = roomStays[roomId]?.length > 0 
          ? Math.round((roomStays[roomId].reduce((a, b) => a + b, 0) / roomStays[roomId].length) * 10) / 10 
          : 0;
        room.occupancyRate = Math.round(((roomOccupiedNights[roomId] || 0) / daysInPeriod) * 100);
      });

      // Sort by revenue and assign ranks
      const sortedRooms = Object.values(roomPerformance)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map((room, index) => ({ ...room, rank: index + 1 }));

      const totalRoomRevenue = sortedRooms.reduce((sum, r) => sum + r.totalRevenue, 0);
      const averageOccupancy = sortedRooms.length > 0 
        ? Math.round(sortedRooms.reduce((sum, r) => sum + r.occupancyRate, 0) / sortedRooms.length) 
        : 0;

      return {
        rooms: sortedRooms,
        topPerformer: sortedRooms[0] || null,
        lowestPerformer: sortedRooms[sortedRooms.length - 1] || null,
        totalRoomRevenue,
        averageOccupancy,
      };
    },
  });
}
