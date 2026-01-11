"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, get, set, push, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useToast } from "./useToast";

export interface ScheduledReport {
  id: string;
  email: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  hour: number; // 0-23
  enabled: boolean;
  lastSent?: string;
  createdAt: string;
  createdBy: string;
}

export function useScheduledReports() {
  return useQuery({
    queryKey: ["scheduledReports"],
    queryFn: async (): Promise<ScheduledReport[]> => {
      const snapshot = await get(ref(database, "scheduled_reports"));
      if (!snapshot.exists()) return [];
      
      return Object.entries(snapshot.val()).map(([id, report]: [string, any]) => ({
        id,
        ...report,
      }));
    },
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (report: Omit<ScheduledReport, "id" | "createdAt">) => {
      const reportsRef = ref(database, "scheduled_reports");
      const newReportRef = push(reportsRef);
      const reportData = {
        ...report,
        createdAt: new Date().toISOString(),
      };
      await set(newReportRef, reportData);
      return { id: newReportRef.key, ...reportData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledReports"] });
      toast({ title: "Schedule created", description: "Email report schedule has been created." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create schedule." });
    },
  });
}

export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledReport> & { id: string }) => {
      await update(ref(database, `scheduled_reports/${id}`), updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledReports"] });
      toast({ title: "Schedule updated", description: "Email report schedule has been updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update schedule." });
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await remove(ref(database, `scheduled_reports/${id}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledReports"] });
      toast({ title: "Schedule deleted", description: "Email report schedule has been removed." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete schedule." });
    },
  });
}

export function useSendReportNow() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, reportType }: { 
      email: string; 
      reportType: "daily" | "weekly" | "monthly";
    }) => {
      const response = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reportType, hotelName: "Minima Hotel" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send report");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report sent!", description: "The report has been sent to your email." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to send", description: error.message });
    },
  });
}
