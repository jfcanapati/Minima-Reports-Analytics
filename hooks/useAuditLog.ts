"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, get, push, set, query, orderByChild, limitToLast } from "firebase/database";
import { database } from "@/lib/firebase";

export interface AuditLogEntry {
  id: string;
  action: string;
  category: "booking" | "payment" | "guest" | "room" | "pos" | "settings" | "auth" | "report" | "goal";
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export function useAuditLog(limit: number = 50, category?: string) {
  return useQuery({
    queryKey: ["auditLog", limit, category],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const logsRef = ref(database, "audit_logs");
      const logsQuery = query(logsRef, orderByChild("timestamp"), limitToLast(limit * 2));
      const snapshot = await get(logsQuery);
      
      if (!snapshot.exists()) return [];
      
      let logs = Object.entries(snapshot.val()).map(([id, log]: [string, any]) => ({
        id,
        ...log,
      }));

      // Filter by category if provided
      if (category && category !== "all") {
        logs = logs.filter(log => log.category === category);
      }

      // Sort by timestamp descending and limit
      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
  });
}

export function useLogAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
      const logsRef = ref(database, "audit_logs");
      const newLogRef = push(logsRef);
      const logEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
      };
      await set(newLogRef, logEntry);
      return { id: newLogRef.key, ...logEntry };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}

// Helper function to log actions from anywhere in the app
export async function logAuditAction(
  action: string,
  category: AuditLogEntry["category"],
  description: string,
  user: { id: string; name: string; email: string },
  metadata?: Record<string, any>
) {
  try {
    const logsRef = ref(database, "audit_logs");
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      action,
      category,
      description,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      metadata,
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
