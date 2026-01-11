"use client";

import { AlertTriangle, TrendingDown, BedDouble, Calendar, CheckCircle } from "lucide-react";

export type AlertType = "warning" | "danger" | "info" | "success";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  metric?: string;
  threshold?: string;
}

interface AlertCardProps {
  alerts: Alert[];
}

const alertStyles: Record<AlertType, { bg: string; border: string; icon: string; iconBg: string }> = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    iconBg: "bg-red-100",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "text-yellow-600",
    iconBg: "bg-yellow-100",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-600",
    iconBg: "bg-green-100",
  },
};

const AlertIcon = ({ type }: { type: AlertType }) => {
  switch (type) {
    case "danger":
      return <TrendingDown className="h-5 w-5" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5" />;
    case "success":
      return <CheckCircle className="h-5 w-5" />;
    default:
      return <Calendar className="h-5 w-5" />;
  }
};

export function AlertCard({ alerts }: AlertCardProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">All Systems Normal</p>
            <p className="text-sm text-green-600">No issues detected in the selected period</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const styles = alertStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}>
                <span className={styles.icon}>
                  <AlertIcon type={alert.type} />
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                {(alert.metric || alert.threshold) && (
                  <div className="flex gap-4 mt-2 text-xs">
                    {alert.metric && (
                      <span className="text-gray-500">Current: <span className="font-medium text-gray-700">{alert.metric}</span></span>
                    )}
                    {alert.threshold && (
                      <span className="text-gray-500">Threshold: <span className="font-medium text-gray-700">{alert.threshold}</span></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
