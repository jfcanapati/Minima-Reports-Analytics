"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { KPICard } from "@/components/reports/KPICard";
import { ChartCard } from "@/components/reports/ChartCard";
import { DataTable } from "@/components/reports/DataTable";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { exportKPIsToPDF, exportKPIsToExcel } from "@/lib/exportUtils";
import { BedDouble, TrendingUp, BarChart3, Wallet } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { useToast } from "@/hooks/useToast";
import { 
  useRoomTypes, 
  useBookings, 
  useBookingStats,
  useDailyOccupancy, 
  useMonthlyRevenue, 
  useRevenueSummary,
  usePeriodComparison,
  calculateKPIs 
} from "@/hooks/useReportData";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertCard } from "@/components/reports/AlertCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend 
} from "recharts";

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes(endDate);
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings(startDate, endDate);
  const { data: bookingStats } = useBookingStats(startDate, endDate);
  const { data: dailyOccupancy = [], isLoading: occupancyLoading } = useDailyOccupancy(startDate, endDate);
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue(startDate, endDate);
  const { data: revenueSummary, isLoading: summaryLoading } = useRevenueSummary(startDate, endDate);
  const { data: comparison, isLoading: comparisonLoading } = usePeriodComparison(startDate, endDate);
  const alerts = useAlerts(comparison);
  const { toast } = useToast();

  const isLoading = roomTypesLoading || bookingsLoading || occupancyLoading || revenueLoading || summaryLoading || comparisonLoading;
  const kpiData = calculateKPIs(roomTypes, monthlyRevenue);

  // Transform monthly revenue for chart - rename fields for display
  const revenueChartData = monthlyRevenue.map(item => ({
    month: item.month,
    Rooms: item.rooms,
    Foods: item.restaurant,
    Services: item.spa,
    Other: item.other,
  }));

  const bookingColumns = [
    { key: "id", label: "Booking ID" },
    { key: "guest", label: "Guest" },
    { key: "room", label: "Room Type" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { 
      key: "status", 
      label: "Status",
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === "paid" ? "bg-green-100 text-green-800" :
          value === "pending" ? "bg-yellow-100 text-yellow-800" :
          value === "checked-in" ? "bg-blue-100 text-blue-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {value}
        </span>
      )
    },
  ];

  const kpis = [
    { label: "Occupancy Rate", value: `${comparison?.current.occupancyRate || kpiData.occupancyRate}%`, change: comparison?.changes.occupancyRate },
    { label: "Average Daily Rate", value: formatCurrency(comparison?.current.adr || kpiData.adr), change: comparison?.changes.adr },
    { label: "RevPAR", value: formatCurrency(comparison?.current.revpar || kpiData.revpar), change: comparison?.changes.revpar },
    { label: "Total Revenue", value: formatCurrencyShort(comparison?.current.revenue || revenueSummary?.totalRevenue || 0), change: comparison?.changes.revenue },
  ];

  const handleExportPDF = () => {
    exportKPIsToPDF(kpis, dailyOccupancy, { title: "Dashboard Overview", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Dashboard report exported as PDF" });
  };

  const handleExportExcel = () => {
    exportKPIsToExcel(kpis, [...dailyOccupancy, ...monthlyRevenue], { title: "Dashboard Overview", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Dashboard report exported as Excel" });
  };

  // Calculate totals
  const totalRooms = roomTypes.reduce((acc, r) => acc + r.total, 0);
  const occupiedRooms = roomTypes.reduce((acc, r) => acc + r.occupied, 0);

  if (isLoading) {
    return (
      <PageContainer title="Dashboard Overview" subtitle="Welcome back! Here's what's happening at your hotel today.">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard Overview" subtitle="Welcome back! Here's what's happening at your hotel today.">
      <div className="mb-6">
        <DateRangeFilter 
          startDate={startDate} 
          endDate={endDate} 
          onStartDateChange={setStartDate} 
          onEndDateChange={setEndDate} 
          onExportPDF={handleExportPDF} 
          onExportExcel={handleExportExcel} 
          reportTitle="Dashboard" 
        />
      </div>

      {/* Main KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Occupancy Rate" 
          value={`${comparison?.current.occupancyRate || kpiData.occupancyRate}%`} 
          change={comparison?.changes.occupancyRate} 
          icon={<BedDouble className="h-6 w-6" />} 
          variant="primary" 
        />
        <KPICard 
          title="Average Daily Rate" 
          value={formatCurrency(comparison?.current.adr || kpiData.adr)} 
          change={comparison?.changes.adr} 
          icon={<Wallet className="h-6 w-6" />} 
        />
        <KPICard 
          title="RevPAR" 
          value={formatCurrency(comparison?.current.revpar || kpiData.revpar)} 
          change={comparison?.changes.revpar} 
          icon={<TrendingUp className="h-6 w-6" />} 
          variant="success" 
        />
        <KPICard 
          title="Total Revenue" 
          value={formatCurrencyShort(comparison?.current.revenue || revenueSummary?.totalRevenue || 0)} 
          change={comparison?.changes.revenue} 
          icon={<BarChart3 className="h-6 w-6" />} 
        />
      </div>

      {/* Alerts Section */}
      <div className="mt-6">
        <ChartCard title="Alerts & Insights" description="Issues and opportunities detected in the selected period">
          <AlertCard alerts={alerts} />
        </ChartCard>
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Weekly Occupancy" description="Room occupancy trend for the past 7 days">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyOccupancy}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="date" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} 
                  formatter={(value: number) => [`${value}%`, "Occupancy"]}
                />
                <Area type="monotone" dataKey="rate" stroke="#111111" strokeWidth={2} fill="url(#occupancyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Category" description="Monthly revenue breakdown">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} 
                  formatter={(value: number) => [formatCurrency(value), ""]} 
                />
                <Legend />
                <Bar dataKey="Rooms" fill="#111111" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Foods" fill="#4B4B4B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Services" fill="#8A8A8A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Other" fill="#D1D1D1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Room Types & Recent Bookings */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="Room Type Status" description="Current occupancy by room type">
          <div className="space-y-4">
            {roomTypes.length > 0 ? (
              roomTypes.map((room) => {
                const percentage = room.total > 0 ? (room.occupied / room.total) * 100 : 0;
                return (
                  <div key={room.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-black">{room.type}</span>
                      <span className="text-gray-500">
                        {room.occupied}/{room.total} • {formatCurrency(room.rate)}/night
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className={`h-full rounded-full ${percentage > 80 ? 'bg-green-600' : percentage > 50 ? 'bg-yellow-500' : 'bg-black'}`} 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Capacity: {room.capacity} guests/room</span>
                      <span>{percentage.toFixed(0)}% occupied</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No room data available</p>
            )}
            
            {/* Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Occupied</span>
                <span className="font-semibold text-black">{occupiedRooms} / {totalRooms} rooms</span>
              </div>
            </div>
          </div>
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Recent Bookings" description="Latest booking activity">
            {bookings.length > 0 ? (
              <DataTable columns={bookingColumns} data={bookings} />
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">No recent bookings</p>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="mt-6">
        <ChartCard title="Revenue Summary" description="Breakdown of revenue sources vs previous period">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Room Revenue</p>
              <p className="text-2xl font-bold text-black">{formatCurrencyShort(comparison?.current.roomRevenue || revenueSummary?.totalRoomRevenue || 0)}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">From {comparison?.current.bookings || bookingStats?.total || 0} bookings</p>
                {comparison?.changes.roomRevenue !== undefined && (
                  <span className={`text-xs font-medium ${comparison.changes.roomRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.changes.roomRevenue >= 0 ? '↑' : '↓'} {Math.abs(comparison.changes.roomRevenue)}%
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">POS Revenue</p>
              <p className="text-2xl font-bold text-black">{formatCurrencyShort(comparison?.current.posRevenue || revenueSummary?.totalPOSRevenue || 0)}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">From {revenueSummary?.totalTransactions || 0} transactions</p>
                {comparison?.changes.posRevenue !== undefined && (
                  <span className={`text-xs font-medium ${comparison.changes.posRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.changes.posRevenue >= 0 ? '↑' : '↓'} {Math.abs(comparison.changes.posRevenue)}%
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Previous Period</p>
              <p className="text-2xl font-bold text-black">{formatCurrencyShort(comparison?.previous.revenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison?.previous.bookings || 0} bookings • {formatCurrency(comparison?.previous.adr || 0)} ADR
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </PageContainer>
  );
}
