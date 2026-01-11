"use client";

import { useMemo } from "react";
import { PeriodComparison } from "./useReportData";
import { Alert } from "@/components/reports/AlertCard";

// Thresholds for alerts
const THRESHOLDS = {
  lowOccupancy: 30, // Below 30% is concerning
  criticalOccupancy: 15, // Below 15% is critical
  revenueDecline: -20, // More than 20% decline is concerning
  criticalRevenueDecline: -40, // More than 40% decline is critical
  noBookings: 0, // Zero bookings
  lowBookings: 2, // Less than 2 bookings in period
  highOccupancy: 90, // Above 90% is great
  revenueGrowth: 20, // More than 20% growth is great
};

export function useAlerts(comparison: PeriodComparison | undefined): Alert[] {
  return useMemo(() => {
    if (!comparison) return [];

    const alerts: Alert[] = [];
    const { current, changes } = comparison;

    // Critical: No revenue at all
    if (current.revenue === 0 && current.bookings === 0) {
      alerts.push({
        id: "no-activity",
        type: "danger",
        title: "No Activity Detected",
        message: "There are no bookings or revenue recorded in the selected period. Check if data is being captured correctly.",
        metric: "₱0 revenue",
        threshold: "Expected: > ₱0",
      });
      return alerts; // Return early, other alerts don't make sense
    }

    // Occupancy Alerts
    if (current.occupancyRate < THRESHOLDS.criticalOccupancy) {
      alerts.push({
        id: "critical-occupancy",
        type: "danger",
        title: "Critical Low Occupancy",
        message: "Occupancy rate is critically low. Consider promotional offers or marketing campaigns to attract guests.",
        metric: `${current.occupancyRate}%`,
        threshold: `> ${THRESHOLDS.criticalOccupancy}%`,
      });
    } else if (current.occupancyRate < THRESHOLDS.lowOccupancy) {
      alerts.push({
        id: "low-occupancy",
        type: "warning",
        title: "Low Occupancy Rate",
        message: "Occupancy is below target. Review pricing strategy or increase marketing efforts.",
        metric: `${current.occupancyRate}%`,
        threshold: `> ${THRESHOLDS.lowOccupancy}%`,
      });
    } else if (current.occupancyRate >= THRESHOLDS.highOccupancy) {
      alerts.push({
        id: "high-occupancy",
        type: "success",
        title: "Excellent Occupancy",
        message: "Occupancy rate is excellent! Consider dynamic pricing to maximize revenue.",
        metric: `${current.occupancyRate}%`,
      });
    }

    // Revenue Decline Alerts
    if (changes.revenue < THRESHOLDS.criticalRevenueDecline) {
      alerts.push({
        id: "critical-revenue-decline",
        type: "danger",
        title: "Significant Revenue Decline",
        message: "Revenue has dropped significantly compared to the previous period. Immediate action recommended.",
        metric: `${changes.revenue}%`,
        threshold: `> ${THRESHOLDS.criticalRevenueDecline}%`,
      });
    } else if (changes.revenue < THRESHOLDS.revenueDecline) {
      alerts.push({
        id: "revenue-decline",
        type: "warning",
        title: "Revenue Declining",
        message: "Revenue is down compared to the previous period. Review pricing and occupancy strategies.",
        metric: `${changes.revenue}%`,
        threshold: `> ${THRESHOLDS.revenueDecline}%`,
      });
    } else if (changes.revenue >= THRESHOLDS.revenueGrowth) {
      alerts.push({
        id: "revenue-growth",
        type: "success",
        title: "Strong Revenue Growth",
        message: "Revenue has increased significantly compared to the previous period. Great performance!",
        metric: `+${changes.revenue}%`,
      });
    }

    // Booking Alerts
    if (current.bookings === THRESHOLDS.noBookings) {
      alerts.push({
        id: "no-bookings",
        type: "danger",
        title: "No Bookings",
        message: "No bookings recorded in this period. Check booking channels and availability.",
        metric: "0 bookings",
      });
    } else if (current.bookings <= THRESHOLDS.lowBookings) {
      alerts.push({
        id: "low-bookings",
        type: "warning",
        title: "Low Booking Volume",
        message: "Very few bookings in this period. Consider promotional activities.",
        metric: `${current.bookings} bookings`,
        threshold: `> ${THRESHOLDS.lowBookings}`,
      });
    }

    // ADR Decline
    if (changes.adr < -15) {
      alerts.push({
        id: "adr-decline",
        type: "warning",
        title: "Average Daily Rate Declining",
        message: "ADR has dropped compared to previous period. Review room pricing strategy.",
        metric: `${changes.adr}%`,
      });
    }

    // RevPAR Decline
    if (changes.revpar < -25) {
      alerts.push({
        id: "revpar-decline",
        type: "warning",
        title: "RevPAR Declining",
        message: "Revenue per available room is down. This affects overall profitability.",
        metric: `${changes.revpar}%`,
      });
    }

    // Sort by severity: danger first, then warning, then info, then success
    const severityOrder = { danger: 0, warning: 1, info: 2, success: 3 };
    alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

    return alerts;
  }, [comparison]);
}
