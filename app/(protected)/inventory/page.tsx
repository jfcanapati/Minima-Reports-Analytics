"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { DataTable } from "@/components/reports/DataTable";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { inventoryTrends } from "@/lib/mockData";
import { exportToPDF, exportKPIsToExcel } from "@/lib/exportUtils";
import { Package, TrendingDown, AlertTriangle, Wallet } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { useToast } from "@/hooks/useToast";
import { useInventoryItems } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export default function InventoryPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: inventoryData = [], isLoading } = useInventoryItems();
  const { toast } = useToast();

  const totalCost = inventoryData.reduce((acc, item) => acc + item.cost, 0);
  const totalUsed = inventoryData.reduce((acc, item) => acc + item.used, 0);
  const avgWastage = inventoryData.length > 0 ? inventoryData.reduce((acc, item) => acc + item.wastage, 0) / inventoryData.length : 0;

  const inventoryColumns = [
    { key: "category", label: "Category" },
    { key: "used", label: "Quantity Used" },
    { key: "cost", label: "Cost", render: (value: number) => formatCurrency(value) },
    { key: "wastage", label: "Wastage %", render: (value: number) => <span className={value > 3 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>{value}%</span> },
  ];

  const radarData = inventoryData.map(item => ({ category: item.category, usage: totalUsed > 0 ? (item.used / totalUsed) * 100 : 0, cost: totalCost > 0 ? (item.cost / totalCost) * 100 : 0, wastage: item.wastage * 10 }));

  const kpis = [
    { label: "Inventory Turnover", value: 4.2, change: -2.1 },
    { label: "Total Items Used", value: totalUsed.toLocaleString() },
    { label: "Total Cost", value: formatCurrencyShort(totalCost) },
    { label: "Avg Wastage", value: `${avgWastage.toFixed(1)}%` },
  ];

  const handleExportPDF = () => {
    exportToPDF(inventoryData, [{ key: "category", label: "Category" }, { key: "used", label: "Quantity Used" }, { key: "cost", label: "Cost ($)" }, { key: "wastage", label: "Wastage %" }], { title: "Inventory Report", subtitle: "Inventory Usage and Cost Analysis", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Inventory report exported as PDF" });
  };

  const handleExportExcel = () => {
    exportKPIsToExcel(kpis, inventoryData, { title: "Inventory Report", dateRange: { start: startDate, end: endDate } });
    toast({ title: "Export Successful", description: "Inventory report exported as Excel" });
  };

  if (isLoading) {
    return (
      <PageContainer title="Inventory Report" subtitle="Track inventory consumption, costs, and wastage">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 w-full" /><Skeleton className="h-96 w-full" /></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Inventory Report" subtitle="Track inventory consumption, costs, and identify wastage patterns">
      <div className="mb-6">
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} reportTitle="Inventory Report" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Inventory Turnover" value={4.2} change={-2.1} icon={<Package className="h-6 w-6" />} variant="primary" />
        <KPICard title="Total Items Used" value={totalUsed.toLocaleString()} icon={<TrendingDown className="h-6 w-6" />} />
        <KPICard title="Total Cost" value={formatCurrencyShort(totalCost)} icon={<Wallet className="h-6 w-6" />} variant="warning" />
        <KPICard title="Avg Wastage" value={`${avgWastage.toFixed(1)}%`} icon={<AlertTriangle className="h-6 w-6" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Cost by Category" description="Inventory costs breakdown">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis type="number" stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                <YAxis dataKey="category" type="category" stroke="#8A8A8A" fontSize={12} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} formatter={(value: number) => [formatCurrency(value), "Cost"]} />
                <Bar dataKey="cost" fill="#111111" radius={[0, 4, 4, 0]} name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Usage Trends" description="Weekly inventory consumption">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="week" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1", borderRadius: "6px" }} />
                <Legend />
                <Line type="monotone" dataKey="linens" name="Linens" stroke="#111111" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="toiletries" name="Toiletries" stroke="#8A8A8A" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="food" name="Food" stroke="#4B4B4B" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="beverages" name="Beverages" stroke="#D1D1D1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="Category Analysis" description="Usage vs Cost vs Wastage">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#D1D1D1" />
                <PolarAngleAxis dataKey="category" stroke="#8A8A8A" fontSize={10} />
                <PolarRadiusAxis stroke="#8A8A8A" fontSize={10} />
                <Radar name="Usage %" dataKey="usage" stroke="#111111" fill="#111111" fillOpacity={0.3} />
                <Radar name="Cost %" dataKey="cost" stroke="#8A8A8A" fill="#8A8A8A" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Inventory Details" description="Complete inventory usage data">
            <DataTable columns={inventoryColumns} data={inventoryData} />
          </ChartCard>
        </div>
      </div>

      <div className="mt-6">
        <ChartCard title="Wastage Analysis" description="Identify categories with high wastage rates">
          <div className="space-y-4">
            {[...inventoryData].sort((a, b) => b.wastage - a.wastage).map((item) => {
              const isHigh = item.wastage > 3;
              const isMedium = item.wastage > 1.5 && item.wastage <= 3;
              return (
                <div key={item.category} className="flex items-center gap-4">
                  <div className="w-32 font-medium text-black">{item.category}</div>
                  <div className="flex-1 h-4 overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full ${isHigh ? "bg-red-600" : isMedium ? "bg-yellow-500" : "bg-green-600"}`} style={{ width: `${(item.wastage / 5) * 100}%` }} />
                  </div>
                  <div className={`w-16 text-right font-semibold ${isHigh ? "text-red-600" : isMedium ? "text-yellow-500" : "text-green-600"}`}>{item.wastage}%</div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </PageContainer>
  );
}
