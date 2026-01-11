"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, get, set, push, remove } from "firebase/database";
import { database } from "@/lib/firebase";

export interface Goal {
  id: string;
  type: "revenue" | "occupancy" | "bookings";
  target: number;
  period: "monthly" | "quarterly" | "yearly";
  month: number; // 0-11
  year: number;
  createdAt: string;
  createdBy?: string;
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  percentage: number;
  remaining: number;
  status: "on-track" | "at-risk" | "behind" | "achieved";
  daysRemaining: number;
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async (): Promise<Goal[]> => {
      const snapshot = await get(ref(database, "goals"));
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.entries(data).map(([id, goal]: [string, any]) => ({
        id,
        ...goal,
      }));
    },
  });
}

export function useGoalProgress(goals: Goal[]) {
  return useQuery({
    queryKey: ["goalProgress", goals.map(g => g.id).join(",")],
    queryFn: async (): Promise<GoalProgress[]> => {
      const [bookingsSnapshot, posSnapshot, roomsSnapshot] = await Promise.all([
        get(ref(database, "bookings")),
        get(ref(database, "pos_transactions")),
        get(ref(database, "rooms")),
      ]);

      const allBookings: any[] = bookingsSnapshot.exists() ? Object.values(bookingsSnapshot.val()) : [];
      const allPOS: any[] = posSnapshot.exists() ? Object.values(posSnapshot.val()) : [];
      const totalRooms = roomsSnapshot.exists() ? Object.keys(roomsSnapshot.val()).length : 1;

      const progress: GoalProgress[] = [];

      for (const goal of goals) {
        const now = new Date();
        let periodStart: Date;
        let periodEnd: Date;

        if (goal.period === "monthly") {
          periodStart = new Date(goal.year, goal.month, 1);
          periodEnd = new Date(goal.year, goal.month + 1, 0);
        } else if (goal.period === "quarterly") {
          const quarterStart = Math.floor(goal.month / 3) * 3;
          periodStart = new Date(goal.year, quarterStart, 1);
          periodEnd = new Date(goal.year, quarterStart + 3, 0);
        } else {
          periodStart = new Date(goal.year, 0, 1);
          periodEnd = new Date(goal.year, 11, 31);
        }

        const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        let current = 0;

        if (goal.type === "revenue") {
          // Calculate revenue
          allBookings.forEach((b) => {
            if (b.status !== "paid" && b.status !== "completed") return;
            const date = new Date(b.createdAt || b.checkIn);
            if (date >= periodStart && date <= periodEnd) {
              current += b.totalPrice || 0;
            }
          });
          allPOS.forEach((t) => {
            if (t.status !== "completed") return;
            const date = new Date(t.created_at);
            if (date >= periodStart && date <= periodEnd) {
              current += t.total || 0;
            }
          });
        } else if (goal.type === "occupancy") {
          // Calculate occupancy rate
          let occupiedNights = 0;
          allBookings.forEach((b) => {
            if (b.status !== "paid" && b.status !== "checked-in" && b.status !== "completed") return;
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            const overlapStart = checkIn > periodStart ? checkIn : periodStart;
            const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd;
            if (overlapStart <= overlapEnd) {
              const nights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
              occupiedNights += Math.max(0, nights);
            }
          });
          const totalNights = totalRooms * daysInPeriod;
          current = totalNights > 0 ? Math.round((occupiedNights / totalNights) * 100) : 0;
        } else if (goal.type === "bookings") {
          // Count bookings
          allBookings.forEach((b) => {
            if (b.status !== "paid" && b.status !== "completed") return;
            const date = new Date(b.createdAt || b.checkIn);
            if (date >= periodStart && date <= periodEnd) {
              current++;
            }
          });
        }

        const percentage = goal.target > 0 ? Math.round((current / goal.target) * 100) : 0;
        const remaining = Math.max(0, goal.target - current);

        // Determine status
        const daysPassed = daysInPeriod - daysRemaining;
        const expectedProgress = daysPassed / daysInPeriod;
        let status: GoalProgress["status"];

        if (percentage >= 100) {
          status = "achieved";
        } else if (percentage >= expectedProgress * 100 * 0.9) {
          status = "on-track";
        } else if (percentage >= expectedProgress * 100 * 0.7) {
          status = "at-risk";
        } else {
          status = "behind";
        }

        progress.push({
          goal,
          current,
          percentage: Math.min(percentage, 100),
          remaining,
          status,
          daysRemaining,
        });
      }

      return progress;
    },
    enabled: goals.length > 0,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<Goal, "id">) => {
      const goalsRef = ref(database, "goals");
      const newGoalRef = push(goalsRef);
      await set(newGoalRef, goal);
      return { id: newGoalRef.key, ...goal };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      await remove(ref(database, `goals/${goalId}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
