"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { useAuditLog, AuditLogEntry } from "@/hooks/useAuditLog";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  FileText, User, CreditCard, BedDouble, ShoppingCart, Settings, 
  LogIn, BarChart3, Target, Clock, Filter 
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  booking: <BedDouble className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  guest: <User className="h-4 w-4" />,
  room: <BedDouble className="h-4 w-4" />,
  pos: <ShoppingCart className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  auth: <LogIn className="h-4 w-4" />,
  report: <BarChart3 className="h-4 w-4" />,
  goal: <Target className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  booking: "bg-blue-100 text-blue-600",
  payment: "bg-green-100 text-green-600",
  guest: "bg-purple-100 text-purple-600",
  room: "bg-orange-100 text-orange-600",
  pos: "bg-pink-100 text-pink-600",
  settings: "bg-gray-100 text-gray-600",
  auth: "bg-yellow-100 text-yellow-600",
  report: "bg-indigo-100 text-indigo-600",
  goal: "bg-teal-100 text-teal-600",
};

export default function AuditPage() {
  const [category, setCategory] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading } = useAuditLog(limit, category);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Audit Log" subtitle="Track all system activities">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Audit Log" subtitle="Track all system activities for accountability">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by:</span>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="booking">Bookings</option>
          <option value="payment">Payments</option>
          <option value="guest">Guests</option>
          <option value="room">Rooms</option>
          <option value="pos">POS</option>
          <option value="auth">Authentication</option>
          <option value="report">Reports</option>
          <option value="goal">Goals</option>
          <option value="settings">Settings</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
        >
          <option value={25}>Last 25</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
        </select>
      </div>

      {/* Audit Log List */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {logs && logs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${CATEGORY_COLORS[log.category] || "bg-gray-100 text-gray-600"}`}>
                    {CATEGORY_ICONS[log.category] || <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{log.action}</span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                        {log.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{log.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userName || log.userEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No audit logs yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              System activities will appear here as they occur.
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-800">About Audit Logs</h4>
        <p className="mt-1 text-sm text-blue-600">
          Audit logs track important system activities for transparency and accountability. 
          All actions including bookings, payments, guest management, and report generation are recorded 
          with timestamps and user information.
        </p>
      </div>
    </PageContainer>
  );
}
