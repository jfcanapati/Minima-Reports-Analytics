"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { DataTable } from "@/components/reports/DataTable";
import { exportToPDF, exportKPIsToPDF } from "@/lib/exportUtils";
import { BedDouble, Users, CalendarCheck, TrendingUp, UserCheck, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/localization";
import { useToast } from "@/hooks/useToast";
import { useRoomTypes, useBookings, useDailyOccupancy, useMonthlyOccupancy, useMonthlyRevenue, useBookingStats, usePeriodComparison, calculateKPIs } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#111111", "#8A8A8A", "#4B4B4B", "#D1D1D1"];

export default function OccupancyPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes(endDate);
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings(startDate, endDate);
  const { data: dailyOccupancy = [], isLoading: dailyLoading } = useDailyOccupancy(startDate, endDate);
  const { data: monthlyOccupancy = [], isLoading: monthlyLoading } = useMonthlyOccupancy(startDate, endDate);
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue(startDate, endDate);
  const { data: bookingStats, isLoading: statsLoading } = useBookingStats(startDate, endDate);
  const { data: comparison } = usePeriodComparison(startDate, endDate);
  const { toast } = useToast();

  const isLoading = roomTypesLoading || dailyLoading || monthlyLoading || revenueLoading || bookingsLoading || statsLoading;
  const kpiData = calculateKPIs(roomTypes, monthlyRevenue);

  const totalRooms = roomTypes.reduce((acc, room) => acc + room.total, 0);
  const occupiedRooms = roomTypes.reduce((acc, room) => acc + room.occupied, 0);
  const availableRooms = totalRooms - occupiedRooms;
  const totalCapacity = roomTypes.reduce((acc, room) => acc + (room.capacity * room.total), 0);

  const pieData = [{ name: "Occupied", value: occupiedRooms }, { name: "Available", value: availableRooms }];
  const bookingTypeData = [
    { name: "Online", value: bookingStats?.online || 0 },
    { name: "Walk-in", value: bookingStats?.walkIn || 0 },
  ];

  const kpis = [
    { label: "Current Occupancy", value: `${comparison?.current.occupancyRate || kpiData.occupancyRate}%`, change: comparison?.changes.occupancyRate },
    { label: "Rooms Occupied", value: occupiedRooms },
    { label: "Rooms Available", value: availableRooms },
    { label: "Total Rooms", value: totalRooms },
  ];

  const bookingColumns = [
    { key: "id", label: "Booking ID" },
    { key: "guest", label: "Guest" },
    { key: "room", label: "Room Type" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "totalPrice", label: "Amount", render: (value: number) => formatCurrency(value) },
    { key: "isWalkIn", label: "Type", render: (value: boolean) => (
      <Badge variant={value ? "secondary" : "default"} className="text-xs">
        {value ? "Walk-in" : "Online"}
      </Badge>
    )},
    { key: "status", label: "Status" },
  ];

  const handleExportPDF = () => {
    const roomTypeExportData = roomTypes.map(room => ({ 
      type: room.type, 
      occupied: room.occupied, 
      total: room.total, 
      capacity: room.capacity,
      rate: room.rate, 
      occupancyRate: `${((room.occupied / room.total) * 100).toFixed(0)}%` 
    }));
    exportToPDF(roomTypeExportData, [
      { key: "type", label: "Room Type" }, 
      { key: "occupied", label: "Occupied" }, 
      { key: "total", label: "Total" }, 
      { key: "capacity", label: "Capacity" },
      { key: "rate", label: "Rate (₱)" }, 
      { key: "occupancyRate", label: "Occupancy %" }
    ], { title: "Occupancy Report", subtitle: "Room Occupancy Analysis", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Occupancy report exported as PDF" });
  };

  const handleExportExcel = () => {
    exportKPIsToPDF(kpis, [...dailyOccupancy, ...monthlyOccupancy], { title: "Occupancy Report", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Occupancy report exported as Excel" });
  };

  if (isLoading) {
    return (
      <PageContainer title="Occupancy Report" subtitle="Monitor room occupancy rates and availability">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 w-full" /><Skeleton className="h-96 w-full" /></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Occupancy Report" subtitle="Monitor room occupancy rates and availability across your hotel">
      <div className="mb-6">
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} reportTitle="Occupancy Report" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Current Occupancy" value={`${comparison?.current.occupancyRate || kpiData.occupancyRate}%`} change={comparison?.changes.occupancyRate} icon={<BedDouble className="h-6 w-6" />} variant="primary" />
        <KPICard title="Rooms Occupied" value={`${occupiedRooms} / ${totalRooms}`} icon={<Users className="h-6 w-6" />} />
        <KPICard title="Total Capacity" value={`${totalCapacity} guests`} icon={<CalendarCheck className="h-6 w-6" />} variant="success" />
        <KPICard title="Total Bookings" value={comparison?.current.bookings || bookingStats?.total || 0} change={comparison?.changes.bookings} icon={<TrendingUp className="h-6 w-6" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Occupancy" description="Room occupancy for the current week">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyOccupancy}>
                <defs>
                  <linearGradient id="occupiedGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#111111" stopOpacity={0.4} /><stop offset="95%" stopColor="#111111" stopOpacity={0} /></linearGradient>
                  <linearGradient id="availableGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E6E1DA" stopOpacity={0.4} /><stop offset="95%" stopColor="#E6E1DA" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="date" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} />
                <Area type="monotone" dataKey="occupied" stackId="1" stroke="#111111" fill="url(#occupiedGradient)" name="Occupied" />
                <Area type="monotone" dataKey="available" stackId="1" stroke="#E6E1DA" fill="url(#availableGradient)" name="Available" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Occupancy Trend" description="6-month occupancy rate trends">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyOccupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} formatter={(value: number) => [`${value}%`, "Occupancy Rate"]} />
                <Line type="monotone" dataKey="rate" stroke="#111111" strokeWidth={3} dot={{ fill: "#111111", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: "#111111", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <ChartCard title="Room Status" description="Occupied vs Available">
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                  <Cell fill="#111111" /><Cell fill="#E6E1DA" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-black" /><span className="text-xs text-gray-500">Occupied ({occupiedRooms})</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-accent-sand" /><span className="text-xs text-gray-500">Available ({availableRooms})</span></div>
          </div>
        </ChartCard>

        <ChartCard title="Booking Source" description="Online vs Walk-in">
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                  <Cell fill="#111111" /><Cell fill="#8A8A8A" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-black" /><span className="text-xs text-gray-500">Online ({bookingStats?.online || 0})</span></div>
            <div className="flex items-center gap-2"><UserCheck className="h-3 w-3 text-gray-500" /><span className="text-xs text-gray-500">Walk-in ({bookingStats?.walkIn || 0})</span></div>
          </div>
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Room Type Breakdown" description="Occupancy by room category">
            <div className="space-y-4">
              {roomTypes.map((room, index) => {
                const percentage = room.total > 0 ? (room.occupied / room.total) * 100 : 0;
                return (
                  <div key={room.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-black">{room.type}</span>
                        <span className="ml-2 text-xs text-gray-500">({room.capacity} guests max)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-black">{room.occupied}/{room.total}</span>
                        <span className="ml-2 text-sm text-gray-500">{formatCurrency(room.rate)}/night</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="mt-6">
        <ChartCard title="Recent Bookings" description="Latest booking activity with guest details">
          <DataTable columns={bookingColumns} data={bookings} />
        </ChartCard>
      </div>
    </PageContainer>
  );
}
