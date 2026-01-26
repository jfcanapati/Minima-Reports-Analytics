"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { exportToPDF, exportKPIsToExcel } from "@/lib/exportUtils";
import { TrendingUp, CreditCard, PieChart as PieIcon, Wallet, Receipt, DollarSign } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { useToast } from "@/hooks/useToast";
import { 
  useRoomTypes, 
  useMonthlyRevenue, 
  useRevenueSummary,
  usePaymentMethodBreakdown,
  useTopProducts,
  usePeriodComparison,
  useDetailedRevenueBreakdown,
  calculateKPIs, 
  calculateRevenueByCatagory,
  RoomTypeRevenue,
  POSServiceRevenue,
} from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line, BarChart,
  TooltipProps 
} from "recharts";

const COLORS = ["#111111", "#4B4B4B", "#8A8A8A", "#D1D1D1", "#E5E5E5"];
const ROOM_COLORS = ["#111111", "#2D2D2D", "#4B4B4B", "#6B6B6B", "#8A8A8A"];
const SERVICE_COLORS = ["#4B4B4B", "#6B6B6B", "#8A8A8A", "#ABABAB", "#D1D1D1"];

// Filter types for the chart
type RevenueFilter = "all" | "rooms" | "services" | "total";

// Custom tooltip component for Revenue Trend chart with filter awareness and detailed breakdown
interface EnhancedTooltipProps extends TooltipProps<number, string> {
  filter: RevenueFilter;
  roomTypeBreakdown: RoomTypeRevenue[];
  posBreakdown: POSServiceRevenue[];
}

const RevenueTooltip = ({ 
  active, 
  payload, 
  label, 
  filter,
  roomTypeBreakdown,
  posBreakdown,
}: EnhancedTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const rooms = data.rooms || 0;
  const foods = data.foods || 0;
  const services = data.services || 0;
  const other = data.other || 0;
  const servicesTotal = foods + services + other;
  const total = data.total || (rooms + servicesTotal);

  // Show filtered content based on active filter
  if (filter === "rooms") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[260px] max-w-[300px]">
        <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{label}</p>
        
        {/* Total Room Revenue */}
        <div className="flex items-center justify-between py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#111111]" />
            <span className="text-sm font-medium text-gray-700">Total Room Revenue</span>
          </div>
          <span className="text-sm font-bold text-black">{formatCurrency(rooms)}</span>
        </div>
        
        {/* Room Types Breakdown */}
        {roomTypeBreakdown.length > 0 && (
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs font-medium text-gray-500 mb-2">By Room Type:</p>
            <div className="space-y-1.5">
              {roomTypeBreakdown.map((rt, idx) => (
                <div key={rt.roomType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: ROOM_COLORS[idx % ROOM_COLORS.length] }} 
                    />
                    <span className="text-xs text-gray-600">{rt.roomType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-700">{formatCurrency(rt.revenue)}</span>
                    <span className="text-xs text-gray-400 ml-1">({rt.bookings} bookings)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (filter === "services") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[260px] max-w-[300px]">
        <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{label}</p>
        
        {/* Services Total */}
        <div className="flex items-center justify-between py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4B4B4B]" />
            <span className="text-sm font-medium text-gray-700">Total Services (POS)</span>
          </div>
          <span className="text-sm font-bold text-black">{formatCurrency(servicesTotal)}</span>
        </div>
        
        {/* Basic Breakdown */}
        <div className="border-t border-gray-100 pt-2 mb-2">
          <p className="text-xs font-medium text-gray-500 mb-2">By Category:</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4B4B4B]" />
                <span className="text-xs text-gray-600">Foods & Beverages</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{formatCurrency(foods)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8A8A8A]" />
                <span className="text-xs text-gray-600">Spa & Services</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{formatCurrency(services)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D1D1D1]" />
                <span className="text-xs text-gray-600">Other Services</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{formatCurrency(other)}</span>
            </div>
          </div>
        </div>

        {/* Detailed POS Breakdown */}
        {posBreakdown.length > 0 && (
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs font-medium text-gray-500 mb-2">Detailed Breakdown:</p>
            <div className="space-y-1.5">
              {posBreakdown.map((pos, idx) => (
                <div key={pos.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: SERVICE_COLORS[idx % SERVICE_COLORS.length] }} 
                    />
                    <span className="text-xs text-gray-600">{pos.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-700">{formatCurrency(pos.revenue)}</span>
                    <span className="text-xs text-gray-400 ml-1">({pos.items} items)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (filter === "total") {
    const roomPct = total > 0 ? ((rooms / total) * 100).toFixed(1) : "0";
    const servicesPct = total > 0 ? ((servicesTotal / total) * 100).toFixed(1) : "0";
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
        <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{label}</p>
        
        {/* Grand Total */}
        <div className="flex items-center justify-between py-1.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-black" />
            <span className="text-sm font-semibold text-black">Grand Total</span>
          </div>
          <span className="text-sm font-bold text-black">{formatCurrency(total)}</span>
        </div>
        
        {/* Main Categories */}
        <div className="border-t border-gray-100 pt-2 space-y-2">
          {/* Rooms */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
                <span className="text-xs font-medium text-gray-700">Room Revenue ({roomPct}%)</span>
              </div>
              <span className="text-xs font-bold text-gray-800">{formatCurrency(rooms)}</span>
            </div>
            {roomTypeBreakdown.length > 0 && (
              <div className="ml-4 mt-1 space-y-0.5">
                {roomTypeBreakdown.slice(0, 3).map((rt, idx) => (
                  <div key={rt.roomType} className="flex justify-between text-xs text-gray-500">
                    <span>• {rt.roomType}</span>
                    <span>{formatCurrency(rt.revenue)}</span>
                  </div>
                ))}
                {roomTypeBreakdown.length > 3 && (
                  <span className="text-xs text-gray-400">+{roomTypeBreakdown.length - 3} more</span>
                )}
              </div>
            )}
          </div>
          
          {/* Services */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4B4B4B]" />
                <span className="text-xs font-medium text-gray-700">Services/POS ({servicesPct}%)</span>
              </div>
              <span className="text-xs font-bold text-gray-800">{formatCurrency(servicesTotal)}</span>
            </div>
            <div className="ml-4 mt-1 space-y-0.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>• Foods</span>
                <span>{formatCurrency(foods)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>• Services</span>
                <span>{formatCurrency(services)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>• Other</span>
                <span>{formatCurrency(other)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show all (filter === "all")
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[260px] max-w-[300px]">
      <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{label}</p>
      
      {/* Room Revenue */}
      <div className="mb-2">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#111111]" />
            <span className="text-sm text-gray-600">Room Revenue</span>
          </div>
          <span className="text-sm font-medium text-black">{formatCurrency(rooms)}</span>
        </div>
        {roomTypeBreakdown.length > 0 && (
          <div className="ml-5 space-y-0.5">
            {roomTypeBreakdown.slice(0, 2).map((rt) => (
              <div key={rt.roomType} className="flex justify-between text-xs text-gray-400">
                <span>• {rt.roomType}</span>
                <span>{formatCurrency(rt.revenue)}</span>
              </div>
            ))}
            {roomTypeBreakdown.length > 2 && (
              <span className="text-xs text-gray-300">+{roomTypeBreakdown.length - 2} more</span>
            )}
          </div>
        )}
      </div>
      
      {/* Services Revenue */}
      <div className="mb-2">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4B4B4B]" />
            <span className="text-sm text-gray-600">Services (POS)</span>
          </div>
          <span className="text-sm font-medium text-black">{formatCurrency(servicesTotal)}</span>
        </div>
        <div className="ml-5 text-xs text-gray-400 space-y-0.5">
          <div className="flex justify-between">
            <span>• Foods</span>
            <span>{formatCurrency(foods)}</span>
          </div>
          <div className="flex justify-between">
            <span>• Services</span>
            <span>{formatCurrency(services)}</span>
          </div>
          <div className="flex justify-between">
            <span>• Other</span>
            <span>{formatCurrency(other)}</span>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-black" />
          <span className="text-sm font-semibold text-black">Total</span>
        </div>
        <span className="text-sm font-bold text-black">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export default function RevenuePage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>("all");

  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes(endDate);
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue(startDate, endDate);
  const { data: revenueSummary, isLoading: summaryLoading } = useRevenueSummary(startDate, endDate);
  const { data: paymentMethods = [], isLoading: paymentLoading } = usePaymentMethodBreakdown();
  const { data: topProducts = [], isLoading: productsLoading } = useTopProducts(5);
  const { data: comparison } = usePeriodComparison(startDate, endDate);
  const { data: detailedBreakdown } = useDetailedRevenueBreakdown(startDate, endDate);
  const { toast } = useToast();

  const isLoading = roomTypesLoading || revenueLoading || summaryLoading;
  const kpiData = calculateKPIs(roomTypes, monthlyRevenue);
  const revenueByCategoryData = calculateRevenueByCatagory(monthlyRevenue);
  const totalRevenue = revenueByCategoryData.reduce((acc, item) => acc + item.value, 0);
  
  // Get detailed breakdown data
  const roomTypeBreakdown = detailedBreakdown?.roomTypes || [];
  const posBreakdown = detailedBreakdown?.posCategories || [];
  
  const revenueWithTotal = monthlyRevenue.map(item => ({ 
    ...item, 
    foods: item.restaurant,
    services: item.spa,
    total: item.rooms + item.restaurant + item.spa + item.other,
    servicesTotal: item.restaurant + item.spa + item.other,
  }));

  const kpis = [
    { label: "Total Revenue", value: formatCurrencyShort(comparison?.current.revenue || revenueSummary?.totalRevenue || 0), change: comparison?.changes.revenue },
    { label: "Room Revenue", value: formatCurrencyShort(comparison?.current.roomRevenue || revenueSummary?.totalRoomRevenue || 0), change: comparison?.changes.roomRevenue },
    { label: "POS Revenue", value: formatCurrencyShort(comparison?.current.posRevenue || revenueSummary?.totalPOSRevenue || 0), change: comparison?.changes.posRevenue },
    { label: "Avg Transaction", value: formatCurrency(revenueSummary?.avgTransactionValue || 0) },
  ];

  const handleExportPDF = () => {
    const revenueExportData = monthlyRevenue.map(item => ({ 
      month: item.month, 
      rooms: item.rooms, 
      foods: item.restaurant, 
      services: item.spa, 
      other: item.other, 
      total: item.rooms + item.restaurant + item.spa + item.other 
    }));
    exportToPDF(revenueExportData, [
      { key: "month", label: "Month" }, 
      { key: "rooms", label: "Rooms (₱)" }, 
      { key: "foods", label: "Foods (₱)" }, 
      { key: "services", label: "Services (₱)" }, 
      { key: "other", label: "Other (₱)" }, 
      { key: "total", label: "Total (₱)" }
    ], { title: "Revenue Report", subtitle: "Revenue Analysis by Category", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Revenue report exported as PDF" });
  };

  const handleExportExcel = () => {
    const revenueExportData = monthlyRevenue.map(item => ({ 
      month: item.month, 
      rooms: item.rooms, 
      foods: item.restaurant, 
      services: item.spa, 
      other: item.other, 
      total: item.rooms + item.restaurant + item.spa + item.other 
    }));
    exportKPIsToExcel(kpis, revenueExportData, { title: "Revenue Report", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Revenue report exported as Excel" });
  };

  if (isLoading) {
    return (
      <PageContainer title="Revenue Report" subtitle="Analyze revenue streams and financial performance">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Revenue Report" subtitle="Analyze revenue streams and financial performance">
      <div className="mb-6">
        <DateRangeFilter 
          startDate={startDate} 
          endDate={endDate} 
          onStartDateChange={setStartDate} 
          onEndDateChange={setEndDate} 
          onExportPDF={handleExportPDF} 
          onExportExcel={handleExportExcel} 
          reportTitle="Revenue Report" 
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Revenue" 
          value={formatCurrencyShort(comparison?.current.revenue || revenueSummary?.totalRevenue || 0)} 
          change={comparison?.changes.revenue} 
          icon={<Wallet className="h-6 w-6" />} 
          variant="primary" 
        />
        <KPICard 
          title="Room Revenue" 
          value={formatCurrencyShort(comparison?.current.roomRevenue || revenueSummary?.totalRoomRevenue || 0)} 
          change={comparison?.changes.roomRevenue} 
          icon={<CreditCard className="h-6 w-6" />} 
        />
        <KPICard 
          title="POS Revenue" 
          value={formatCurrencyShort(comparison?.current.posRevenue || revenueSummary?.totalPOSRevenue || 0)} 
          change={comparison?.changes.posRevenue} 
          icon={<Receipt className="h-6 w-6" />} 
          variant="success" 
        />
        <KPICard 
          title="Transactions" 
          value={revenueSummary?.totalTransactions.toString() || "0"} 
          icon={<TrendingUp className="h-6 w-6" />} 
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="mt-6">
        <ChartCard title="Revenue Trend" description="Monthly revenue breakdown by category - Click filters to view specific data">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
            <button
              onClick={() => setRevenueFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                revenueFilter === "all"
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${revenueFilter === "all" ? "bg-white" : "bg-gradient-to-r from-[#111111] to-[#8A8A8A]"}`} />
              All Categories
            </button>
            <button
              onClick={() => setRevenueFilter("rooms")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                revenueFilter === "rooms"
                  ? "bg-[#111111] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${revenueFilter === "rooms" ? "bg-white" : "bg-[#111111]"}`} />
              Rooms
            </button>
            <button
              onClick={() => setRevenueFilter("services")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                revenueFilter === "services"
                  ? "bg-[#4B4B4B] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${revenueFilter === "services" ? "bg-white" : "bg-[#4B4B4B]"}`} />
              Services (Foods, Spa, Other)
            </button>
            <button
              onClick={() => setRevenueFilter("total")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                revenueFilter === "total"
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className={`w-3 h-3 rounded-sm ${revenueFilter === "total" ? "bg-white" : "bg-black"}`} />
              Total
            </button>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {revenueFilter === "all" ? (
                <ComposedChart data={revenueWithTotal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                  <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                  <Tooltip content={<RevenueTooltip filter={revenueFilter} roomTypeBreakdown={roomTypeBreakdown} posBreakdown={posBreakdown} />} />
                  <Legend />
                  <Bar dataKey="rooms" name="Rooms" fill="#111111" radius={[4, 4, 0, 0]} stackId="stack" />
                  <Bar dataKey="foods" name="Foods" fill="#4B4B4B" radius={[0, 0, 0, 0]} stackId="stack" />
                  <Bar dataKey="services" name="Services" fill="#8A8A8A" radius={[0, 0, 0, 0]} stackId="stack" />
                  <Bar dataKey="other" name="Other" fill="#D1D1D1" radius={[4, 4, 0, 0]} stackId="stack" />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#111111" strokeWidth={2} dot={{ fill: "#111111", r: 4 }} />
                </ComposedChart>
              ) : revenueFilter === "rooms" ? (
                <BarChart data={revenueWithTotal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                  <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                  <Tooltip content={<RevenueTooltip filter={revenueFilter} roomTypeBreakdown={roomTypeBreakdown} posBreakdown={posBreakdown} />} />
                  <Legend />
                  <Bar dataKey="rooms" name="Room Revenue" fill="#111111" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : revenueFilter === "services" ? (
                <ComposedChart data={revenueWithTotal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                  <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                  <Tooltip content={<RevenueTooltip filter={revenueFilter} roomTypeBreakdown={roomTypeBreakdown} posBreakdown={posBreakdown} />} />
                  <Legend />
                  <Bar dataKey="foods" name="Foods" fill="#4B4B4B" radius={[4, 4, 0, 0]} stackId="services" />
                  <Bar dataKey="services" name="Spa/Services" fill="#8A8A8A" radius={[0, 0, 0, 0]} stackId="services" />
                  <Bar dataKey="other" name="Other" fill="#D1D1D1" radius={[4, 4, 0, 0]} stackId="services" />
                  <Line type="monotone" dataKey="servicesTotal" name="Services Total" stroke="#4B4B4B" strokeWidth={2} dot={{ fill: "#4B4B4B", r: 4 }} />
                </ComposedChart>
              ) : (
                <ComposedChart data={revenueWithTotal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                  <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                  <Tooltip content={<RevenueTooltip filter={revenueFilter} roomTypeBreakdown={roomTypeBreakdown} posBreakdown={posBreakdown} />} />
                  <Legend />
                  <Bar dataKey="total" name="Total Revenue" fill="#111111" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="total" name="Trend" stroke="#4B4B4B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Revenue Distribution & Category Performance */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Distribution" description="Revenue breakdown by category">
          <div className="h-80 flex items-center justify-center">
            {revenueByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={revenueByCategoryData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={110} 
                    paddingAngle={3} 
                    dataKey="value" 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
                    labelLine={false}
                  >
                    {revenueByCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} 
                    formatter={(value: number) => [formatCurrency(value), ""]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No revenue data available</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Category Performance" description="Detailed revenue by category">
          <div className="space-y-6">
            {revenueByCategoryData.map((item, index) => {
              const percentage = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
              return (
                <div key={item.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-black">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-black">{formatCurrencyShort(item.value)}</span>
                      <span className="ml-2 text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-black">Total Revenue</span>
                <span className="text-2xl font-bold text-black">{formatCurrencyShort(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Payment Methods & Top Products */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Payment Methods" description="Revenue breakdown by payment method">
          {paymentLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-black">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-black">{formatCurrency(method.amount)}</span>
                      <span className="ml-2 text-sm text-gray-500">({method.count} txns)</span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div 
                      className="h-full rounded-full bg-black" 
                      style={{ width: `${method.percentage}%` }} 
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-300">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Tax Collected</span>
                  <span className="font-medium text-black">{formatCurrency(revenueSummary?.taxCollected || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No payment data available</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top Services/Products" description="Best selling items by revenue">
          {productsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-black">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-black">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category} • {product.quantitySold} sold</p>
                    </div>
                  </div>
                  <span className="font-semibold text-black">{formatCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No product sales data available</p>
            </div>
          )}
        </ChartCard>
      </div>
    </PageContainer>
  );
}
