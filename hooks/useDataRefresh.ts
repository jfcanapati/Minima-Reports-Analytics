"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

interface DataRefreshSettings {
  autoRefresh: boolean;
  refreshInterval: number; // in minutes
  lastRefresh: number | null;
}

interface DataRefreshStore extends DataRefreshSettings {
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (minutes: number) => void;
  setLastRefresh: (timestamp: number) => void;
}

export const useDataRefreshStore = create<DataRefreshStore>()(
  persist(
    (set) => ({
      autoRefresh: true,
      refreshInterval: 5,
      lastRefresh: null,
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
      setRefreshInterval: (minutes) => set({ refreshInterval: minutes }),
      setLastRefresh: (timestamp) => set({ lastRefresh: timestamp }),
    }),
    {
      name: "data-refresh-settings",
    }
  )
);

export function useDataRefresh() {
  const queryClient = useQueryClient();
  const { autoRefresh, refreshInterval, lastRefresh, setLastRefresh, setAutoRefresh, setRefreshInterval } = useDataRefreshStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAllData = useCallback(async () => {
    // Invalidate all queries to trigger refetch
    await queryClient.invalidateQueries();
    setLastRefresh(Date.now());
  }, [queryClient, setLastRefresh]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshAllData();
      }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshAllData]);

  return {
    autoRefresh,
    refreshInterval,
    lastRefresh,
    setAutoRefresh,
    setRefreshInterval,
    refreshAllData,
  };
}
