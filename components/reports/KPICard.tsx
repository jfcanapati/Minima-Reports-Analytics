"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
}

export function KPICard({ title, value, change, subtitle, icon, variant = "default" }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={cn("rounded-md border border-gray-300 bg-white p-6 transition-shadow duration-200 hover:shadow-md")}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-heading font-medium tracking-tight text-black">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="h-4 w-4 text-green-600" /> : isNegative ? <TrendingDown className="h-4 w-4 text-red-600" /> : null}
              <span className={cn("text-sm", isPositive && "text-green-600", isNegative && "text-red-600", !isPositive && !isNegative && "text-gray-500")}>{isPositive ? "+" : ""}{change}%</span>
              <span className="text-sm text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-500">{icon}</div>
      </div>
    </div>
  );
}
