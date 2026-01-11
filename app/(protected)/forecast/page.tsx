"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { useForecast } from "@/hooks/useForecast";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingUp, TrendingDown, Minus, Target, Calendar, DollarSign, BedDouble } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Area, AreaChart 
} from "recharts";

export default function ForecastPage() {
  const { data, isLoading } = useForecast(3);

  if (isLoading) {
    return (
      <PageContainer title="Forecast & Planning" subtitle="Revenue and occupancy projections">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  const { historical, forecast, summary } = data || { historical: [], forecast: [], summary: null };
  
  // Combine historical and forecast data for charts
  const combinedData = [...historical, ...forecast];
  
  // Trend icon
  const TrendIcon = summary?.occupancyTrend === "up" ? TrendingUp : 
                    summary?.occupancyTrend === "down" ? TrendingDown : Minus;
  
  // Confidence color
  const confidenceColor = summary?.confidence === "high" ? "text-green-600" : 
                          summary?.confidence === "medium" ? "text-yellow-600" : "text-red-600";
  const confidenceBg = summary?.confidence === "high" ? "bg-green-100" : 
                       summary?.confidence === "medium" ? "bg-yellow-100" : "bg-red-100";

  return (
    <PageContainer title="Forecast & Planning" subtitle="Revenue and occupancy projections based on historical trends">
      {/* Summary KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Projected Revenue (3 mo)" 
          value={formatCurrencyShort(summary?.projectedRevenue || 0)} 
          change={summary?.revenueGrowthRate}
          icon={<DollarSign className="h-6 w-6" />} 
          variant="primary" 
        />
        <KPICard 
          title="Avg Projected Occupancy" 
          value={`${summary?.projectedOccupancy || 0}%`} 
          icon={<BedDouble className="h-6 w-6" />} 
        />
        <KPICard 
          title="Projected Bookings" 
          value={summary?.projectedBookings?.toString() || "0"} 
          icon={<Calendar className="h-6 w-6" />} 
          variant="success"
        />
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Forecast Confidence</p>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${confidenceBg}`}>
              <Target className={`h-5 w-5 ${confidenceColor}`} />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-bold capitalize ${confidenceColor}`}>
            {summary?.confidence || "N/A"}
          </p>
          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <TrendIcon className="h-4 w-4" />
            <span>Occupancy trend: {summary?.occupancyTrend || "stable"}</span>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Chart */}
      <div className="mt-6">
        <ChartCard title="Revenue Forecast" description="Historical revenue with 3-month projection">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === "revenue" ? "Revenue" : name
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.isProjected ? `${label} (Projected)` : label;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#111111"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Trend" 
                  stroke="#8A8A8A" 
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-black" />
              <span className="text-gray-600">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-black opacity-50" />
              <span className="text-gray-600">Projected</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Occupancy Forecast Chart */}
      <div className="mt-6">
        <ChartCard title="Occupancy Forecast" description="Historical occupancy with 3-month projection">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData}>
                <defs>
                  <linearGradient id="occupancyForecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} 
                  formatter={(value: number) => [`${value}%`, "Occupancy"]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.isProjected ? `${label} (Projected)` : label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#111111" 
                  strokeWidth={2}
                  fill="url(#occupancyForecastGradient)"
                  strokeDasharray="0"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Detailed Forecast Table */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Breakdown" description="Detailed forecast by month">
          <div className="space-y-4">
            {forecast.map((f) => (
              <div key={f.month} className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-black">{f.month}</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Projected</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-semibold text-black">{formatCurrencyShort(f.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Occupancy</p>
                    <p className="font-semibold text-black">{f.occupancy}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bookings</p>
                    <p className="font-semibold text-black">{f.bookings}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Planning Insights" description="Recommendations based on forecast">
          <div className="space-y-4">
            {summary?.revenueGrowthRate && summary.revenueGrowthRate > 10 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-medium text-green-800">📈 Growth Expected</p>
                <p className="text-sm text-green-600 mt-1">
                  Revenue is projected to grow by {summary.revenueGrowthRate}%. Consider increasing room rates or adding premium services.
                </p>
              </div>
            )}
            
            {summary?.revenueGrowthRate && summary.revenueGrowthRate < -10 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-800">📉 Decline Expected</p>
                <p className="text-sm text-red-600 mt-1">
                  Revenue is projected to decline. Consider promotional campaigns or special offers to boost bookings.
                </p>
              </div>
            )}

            {summary?.projectedOccupancy && summary.projectedOccupancy < 50 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="font-medium text-yellow-800">🛏️ Low Occupancy Forecast</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Projected occupancy is below 50%. Consider marketing campaigns or partnerships with travel agencies.
                </p>
              </div>
            )}

            {summary?.projectedOccupancy && summary.projectedOccupancy >= 80 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-medium text-green-800">🎯 High Demand Expected</p>
                <p className="text-sm text-green-600 mt-1">
                  High occupancy projected. Consider dynamic pricing to maximize revenue during peak periods.
                </p>
              </div>
            )}

            {summary?.confidence === "low" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-medium text-gray-800">⚠️ Limited Data</p>
                <p className="text-sm text-gray-600 mt-1">
                  Forecast confidence is low due to limited historical data. Projections will improve as more data is collected.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="font-medium text-blue-800">💡 Staffing Recommendation</p>
              <p className="text-sm text-blue-600 mt-1">
                Based on {summary?.projectedBookings || 0} projected bookings, plan for adequate housekeeping and front desk coverage.
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </PageContainer>
  );
}
