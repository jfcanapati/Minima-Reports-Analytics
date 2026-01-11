"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BedDouble, DollarSign, Package, Settings, TrendingUp, PieChart, Target, FileText, Mail, RefreshCw } from "lucide-react";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Occupancy report", href: "/occupancy", icon: BedDouble },
  { name: "Revenue report", href: "/revenue", icon: DollarSign },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Forecast", href: "/forecast", icon: TrendingUp },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Email Reports", href: "/email-reports", icon: Mail },
  { name: "Audit Log", href: "/audit", icon: FileText },
  { name: "Inventory report", href: "/inventory", icon: Package },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lastRefresh, refreshAllData, autoRefresh, refreshInterval } = useDataRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("Never");

  // Update time ago every 30 seconds
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastRefresh) {
        setTimeAgo("Never");
        return;
      }
      const now = Date.now();
      const diff = now - lastRefresh;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) setTimeAgo("Just now");
      else if (minutes === 1) setTimeAgo("1 minute ago");
      else if (minutes < 60) setTimeAgo(`${minutes} minutes ago`);
      else if (hours === 1) setTimeAgo("1 hour ago");
      else if (hours < 24) setTimeAgo(`${hours} hours ago`);
      else setTimeAgo(new Date(lastRefresh).toLocaleDateString());
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-300 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-center border-b border-gray-300 px-6">
          <Image src="/minima-logo.png" alt="Minima Hotel" width={100} height={32} className="h-6 w-auto object-contain" />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          <div className="mb-4 px-3"><p className="text-xs font-medium text-gray-500">Main menu</p></div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-body transition-colors duration-200", isActive ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black")}>
                <item.icon className="h-4 w-4" />{item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-300 p-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex w-full items-center gap-3 rounded-sm bg-gray-100 p-3 hover:bg-gray-200 transition-colors disabled:opacity-70"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200">
              <RefreshCw className={cn("h-4 w-4 text-gray-500", isRefreshing && "animate-spin")} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-black">
                {isRefreshing ? "Refreshing..." : "Data updated"}
              </p>
              <p className="text-xs text-gray-500">
                {isRefreshing ? "Please wait" : timeAgo}
                {autoRefresh && !isRefreshing && ` • Auto: ${refreshInterval}m`}
              </p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
