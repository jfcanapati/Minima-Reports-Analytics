"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { Package, TrendingDown, AlertTriangle, Wallet, ShoppingCart, TrendingUp } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { useToast } from "@/hooks/useToast";
import { useInventory, useInventoryStats, usePurchaseOrders, useMenuItems } from "@/hooks/useInventory";
import { exportKPIsToPDF, exportKPIsToExcel } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, TooltipProps } from "recharts";

export default function InventoryPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { items, loading } = useInventory();
  const stats = useInventoryStats(items);
  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();
  const { menuItems, loading: menuLoading } = useMenuItems();
  const { toast } = useToast();

  // Filter purchase orders by date range
  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const poDate = new Date(po.createdAt);
    if (startDate && poDate < startDate) return false;
    if (endDate && poDate > endDate) return false;
    return true;
  });

  // Category breakdown for chart with detailed info
  const categoryData = items.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) {
      acc[cat] = { 
        category: cat, 
        value: 0, 
        count: 0,
        lowStock: 0,
        outOfStock: 0,
        items: []
      };
    }
    acc[cat].count++;
    acc[cat].items.push(item.name);
    
    if (item.currentStock && item.cost) {
      acc[cat].value += item.currentStock * item.cost;
    }
    
    // Track stock status
    if (item.type === "consumable") {
      if (item.currentStock === 0) {
        acc[cat].outOfStock++;
      } else if (item.restockThreshold && item.currentStock && item.currentStock <= item.restockThreshold) {
        acc[cat].lowStock++;
      }
    }
    
    return acc;
  }, {} as Record<string, { 
    category: string; 
    value: number; 
    count: number;
    lowStock: number;
    outOfStock: number;
    items: string[];
  }>);

  const categoryChartData = Object.values(categoryData)
    .map(d => ({
      name: d.category.charAt(0).toUpperCase() + d.category.slice(1).replace("-", " "),
      value: d.value,
      count: d.count,
      lowStock: d.lowStock,
      outOfStock: d.outOfStock,
      items: d.items
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Custom tooltip for category chart
  const CategoryTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[250px]">
        <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{data.name}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Value</span>
            <span className="text-sm font-bold text-black">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Items</span>
            <span className="text-sm font-medium text-black">{data.count}</span>
          </div>
          {data.lowStock > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-600">Low Stock</span>
              <span className="text-sm font-medium text-yellow-600">{data.lowStock}</span>
            </div>
          )}
          {data.outOfStock > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">Out of Stock</span>
              <span className="text-sm font-medium text-red-600">{data.outOfStock}</span>
            </div>
          )}
        </div>
        {data.items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Items ({data.items.length}):</p>
            <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
              {data.items.slice(0, 5).map((item: string, idx: number) => (
                <div key={idx}>• {item}</div>
              ))}
              {data.items.length > 5 && (
                <div className="text-gray-400 mt-1">+{data.items.length - 5} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Custom tooltip for stock status pie chart
  const StockStatusTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0];
    const total = stats.totalItems;
    const percentage = total > 0 ? ((data.value! / total) * 100).toFixed(1) : 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
        <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{data.name}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Items</span>
            <span className="text-sm font-bold text-black">{data.value}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Percentage</span>
            <span className="text-sm font-medium text-black">{percentage}%</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Total Items</span>
            <span className="text-xs text-gray-500">{total}</span>
          </div>
        </div>
      </div>
    );
  };

  // Custom tooltip for PO status chart
  const POStatusTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    const statusPOs = filteredPurchaseOrders.filter(po => 
      po.status.charAt(0).toUpperCase() + po.status.slice(1) === data.status
    );
    const totalAmount = statusPOs.reduce((sum, po) => sum + po.totalAmount, 0);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[220px]">
        <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-100">{data.status}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Orders</span>
            <span className="text-sm font-bold text-black">{data.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Value</span>
            <span className="text-sm font-medium text-black">{formatCurrency(totalAmount)}</span>
          </div>
          {statusPOs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Recent Orders:</p>
              <div className="text-xs text-gray-600 space-y-1">
                {statusPOs.slice(0, 3).map((po, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{po.orderNumber}</span>
                    <span className="font-medium">{formatCurrencyShort(po.totalAmount)}</span>
                  </div>
                ))}
                {statusPOs.length > 3 && (
                  <div className="text-gray-400">+{statusPOs.length - 3} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Stock status for pie chart
  const stockStatusData = [
    { name: "In Stock", value: stats.totalItems - stats.lowStockItems - stats.outOfStockItems, color: "#10B981" },
    { name: "Low Stock", value: stats.lowStockItems, color: "#F59E0B" },
    { name: "Out of Stock", value: stats.outOfStockItems, color: "#EF4444" },
  ].filter(d => d.value > 0);

  // Purchase orders by status (filtered)
  const poByStatus = filteredPurchaseOrders.reduce((acc, po) => {
    acc[po.status] = (acc[po.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const poStatusData = Object.entries(poByStatus).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }));

  // Menu items stock status
  const menuStockData = menuItems.reduce((acc, item) => {
    if (item.currentStock === 0) acc.outOfStock++;
    else if (item.currentStock <= item.restockThreshold) acc.lowStock++;
    else acc.inStock++;
    return acc;
  }, { inStock: 0, lowStock: 0, outOfStock: 0 });

  // Top 5 low stock items
  const lowStockItems = items
    .filter(item => 
      item.type === "consumable" && 
      item.currentStock !== undefined && 
      item.restockThreshold && 
      item.currentStock <= item.restockThreshold && 
      item.currentStock > 0
    )
    .sort((a, b) => {
      const aPercent = a.restockThreshold ? (a.currentStock! / a.restockThreshold) : 1;
      const bPercent = b.restockThreshold ? (b.currentStock! / b.restockThreshold) : 1;
      return aPercent - bPercent;
    })
    .slice(0, 5);

  // Recent 5 purchase orders (filtered)
  const recentPOs = filteredPurchaseOrders.slice(0, 5);

  const handleExportPDF = () => {
    const kpis = [
      { label: "Total Items", value: stats.totalItems },
      { label: "Low Stock Alerts", value: stats.lowStockItems },
      { label: "Out of Stock", value: stats.outOfStockItems },
      { label: "Total Value", value: formatCurrency(stats.totalValue) },
      { label: "Consumables", value: stats.consumables },
      { label: "Assets", value: stats.assets },
      { label: "Purchase Orders (Period)", value: filteredPurchaseOrders.length },
      { label: "Menu Items", value: menuItems.length },
    ];

    // Detailed breakdown for export
    const exportData = [
      // Category breakdown
      ...categoryChartData.map(d => ({
        Section: "Category Breakdown",
        Name: d.name || "Unknown",
        "Total Value": formatCurrency(d.value || 0),
        "Item Count": d.count || 0,
        "Low Stock": d.lowStock || 0,
        "Out of Stock": d.outOfStock || 0,
      })),
      // Low stock items
      ...lowStockItems.map(item => ({
        Section: "Low Stock Alerts",
        Name: item.name || "Unknown",
        Category: item.category || "Unknown",
        "Current Stock": `${item.currentStock || 0} ${item.unit || ""}`,
        "Threshold": `${item.restockThreshold || 0} ${item.unit || ""}`,
        Location: item.location || "Unknown",
      })),
      // Purchase orders by status
      ...Object.entries(poByStatus).map(([status, count]) => {
        const statusPOs = filteredPurchaseOrders.filter(po => po.status === status);
        const totalAmount = statusPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        return {
          Section: "Purchase Orders",
          Name: status.charAt(0).toUpperCase() + status.slice(1),
          "Total Value": formatCurrency(totalAmount),
          "Item Count": count || 0,
          "Low Stock": "-",
          "Out of Stock": "-",
        };
      }),
      // Menu stock status summary
      {
        Section: "Kitchen Inventory Summary",
        Name: "In Stock",
        "Total Value": "-",
        "Item Count": menuStockData.inStock || 0,
        "Low Stock": "-",
        "Out of Stock": "-",
      },
      {
        Section: "Kitchen Inventory Summary",
        Name: "Low Stock",
        "Total Value": "-",
        "Item Count": menuStockData.lowStock || 0,
        "Low Stock": "-",
        "Out of Stock": "-",
      },
      {
        Section: "Kitchen Inventory Summary",
        Name: "Out of Stock",
        "Total Value": "-",
        "Item Count": menuStockData.outOfStock || 0,
        "Low Stock": "-",
        "Out of Stock": "-",
      },
    ];

    exportKPIsToPDF(kpis, exportData, {
      title: "Inventory Analytics Report",
      subtitle: "Comprehensive inventory breakdown with stock status and procurement metrics",
      dateRange: { start: startDate, end: endDate },
    });

    toast({ title: "Export Successful", description: "Inventory report exported as PDF" });
  };

  const handleExportExcel = () => {
    const kpis = [
      { label: "Total Items", value: stats.totalItems },
      { label: "Low Stock Alerts", value: stats.lowStockItems },
      { label: "Out of Stock", value: stats.outOfStockItems },
      { label: "Total Value", value: formatCurrency(stats.totalValue) },
      { label: "Consumables", value: stats.consumables },
      { label: "Assets", value: stats.assets },
      { label: "Purchase Orders (Period)", value: filteredPurchaseOrders.length },
      { label: "Menu Items", value: menuItems.length },
    ];

    // Comprehensive data for Excel export
    const exportData = [
      // All inventory items with full details
      ...items.map(item => ({
        Sheet: "Inventory Items",
        Name: item.name || "Unknown",
        Category: item.category || "Unknown",
        Type: item.type || "Unknown",
        "Current Stock": item.currentStock || 0,
        "Max Stock": item.maxStock || 0,
        "Restock Threshold": item.restockThreshold || 0,
        Unit: item.unit || "",
        "Unit Cost": item.cost || 0,
        "Total Value": (item.currentStock && item.cost) ? item.currentStock * item.cost : 0,
        Location: item.location || "Unknown",
        Supplier: item.supplier || "Unknown",
        Status: item.currentStock === 0 ? "Out of Stock" : 
                (item.restockThreshold && item.currentStock && item.currentStock <= item.restockThreshold ? "Low Stock" : "In Stock"),
      })),
      // Category summary
      ...categoryChartData.map(d => ({
        Sheet: "Category Summary",
        Category: d.name || "Unknown",
        "Total Value": d.value || 0,
        "Item Count": d.count || 0,
        "Low Stock Items": d.lowStock || 0,
        "Out of Stock Items": d.outOfStock || 0,
      })),
      // Purchase orders
      ...filteredPurchaseOrders.map(po => ({
        Sheet: "Purchase Orders",
        "Order Number": po.orderNumber || "Unknown",
        Status: po.status || "Unknown",
        Priority: po.priority || "Normal",
        Supplier: po.supplier?.name || "Unknown",
        "Item Count": po.items?.length || 0,
        "Total Amount": po.totalAmount || 0,
        "Expected Delivery": po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : "N/A",
        "Created Date": po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "N/A",
      })),
      // Menu items
      ...menuItems.map(item => ({
        Sheet: "Kitchen Inventory",
        Name: item.name || "Unknown",
        Category: item.category || "Unknown",
        "Current Stock": item.currentStock || 0,
        "Restock Threshold": item.restockThreshold || 0,
        Unit: item.unit || "",
        Cost: item.cost || 0,
        Location: item.location || "Unknown",
        Supplier: item.supplier || "Unknown",
        Available: item.isAvailable ? "Yes" : "No",
        Status: item.currentStock === 0 ? "Out of Stock" : 
                (item.currentStock <= item.restockThreshold ? "Low Stock" : "In Stock"),
      })),
    ];

    exportKPIsToExcel(kpis, exportData, {
      title: "Inventory Analytics Report",
      dateRange: { start: startDate, end: endDate },
    });

    toast({ title: "Export Successful", description: "Inventory report exported as Excel" });
  };

  if (loading || poLoading || menuLoading) {
    return (
      <PageContainer title="Inventory Analytics" subtitle="Track inventory levels, costs, and procurement insights">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Inventory Analytics" subtitle="Track inventory levels, costs, and procurement insights">
      {/* Date Filter */}
      <div className="mb-6">
        <DateRangeFilter 
          startDate={startDate} 
          endDate={endDate} 
          onStartDateChange={setStartDate} 
          onEndDateChange={setEndDate} 
          onExportPDF={handleExportPDF} 
          onExportExcel={handleExportExcel} 
          reportTitle="Inventory Report" 
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard 
          title="Total Items" 
          value={stats.totalItems.toString()} 
          icon={<Package className="h-6 w-6" />} 
          variant="primary" 
        />
        <KPICard 
          title="Low Stock Alerts" 
          value={stats.lowStockItems.toString()} 
          icon={<AlertTriangle className="h-6 w-6" />} 
          variant="warning"
        />
        <KPICard 
          title="Out of Stock" 
          value={stats.outOfStockItems.toString()} 
          icon={<TrendingDown className="h-6 w-6" />} 
        />
        <KPICard 
          title="Total Value" 
          value={formatCurrencyShort(stats.totalValue)} 
          icon={<Wallet className="h-6 w-6" />} 
          variant="success"
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Inventory Value by Category */}
        <ChartCard title="Inventory Value by Category" description="Top categories by total value">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis dataKey="name" stroke="#8A8A8A" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip content={<CategoryTooltip />} />
                <Bar dataKey="value" fill="#111111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Stock Status Distribution */}
        <ChartCard title="Stock Status Distribution" description="Current inventory health overview">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<StockStatusTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Procurement & Kitchen Inventory */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Purchase Orders Status */}
        <ChartCard title="Purchase Orders by Status" description="Current procurement pipeline">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                <XAxis type="number" stroke="#8A8A8A" fontSize={12} />
                <YAxis dataKey="status" type="category" stroke="#8A8A8A" fontSize={12} width={100} />
                <Tooltip content={<POStatusTooltip />} />
                <Bar dataKey="count" fill="#4B4B4B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Kitchen Inventory Status */}
        <ChartCard title="Kitchen Inventory Status" description="Menu items stock levels">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <p className="text-sm text-green-700 mb-2">In Stock</p>
              <p className="text-4xl font-bold text-green-900">{menuStockData.inStock}</p>
              <p className="text-xs text-green-600 mt-2">Available items</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-6 text-center">
              <p className="text-sm text-yellow-700 mb-2">Low Stock</p>
              <p className="text-4xl font-bold text-yellow-900">{menuStockData.lowStock}</p>
              <p className="text-xs text-yellow-600 mt-2">Need restock</p>
            </div>
            <div className="rounded-lg bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700 mb-2">Out of Stock</p>
              <p className="text-4xl font-bold text-red-900">{menuStockData.outOfStock}</p>
              <p className="text-xs text-red-600 mt-2">Unavailable</p>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            Total Menu Items: <span className="font-semibold text-black">{menuItems.length}</span>
          </div>
        </ChartCard>
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Low Stock Alerts */}
        <ChartCard title="Low Stock Alerts" description="Items requiring immediate attention">
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">All items are well stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => {
                const percentage = item.restockThreshold ? (item.currentStock! / item.restockThreshold) * 100 : 0;
                return (
                  <div key={item.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-black">{item.name}</span>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {item.category.replace("-", " ")} • {item.location}
                        </div>
                      </div>
                      <Badge variant="warning">Low Stock</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>Current: {item.currentStock} {item.unit}</span>
                      <span>Threshold: {item.restockThreshold} {item.unit}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className="h-full rounded-full bg-yellow-500" 
                        style={{ width: `${Math.min(percentage, 100)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        {/* Recent Purchase Orders */}
        <ChartCard title="Recent Purchase Orders" description="Latest procurement activity">
          {recentPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No purchase orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPOs.map((po) => {
                const statusColors: Record<string, "warning" | "outline" | "success" | "destructive"> = {
                  pending: "warning",
                  approved: "outline",
                  ordered: "outline",
                  delivered: "success",
                  cancelled: "destructive",
                };
                return (
                  <div key={po.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-black">{po.orderNumber}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {po.supplier.name} • {po.items.length} item{po.items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <Badge variant={statusColors[po.status]}>
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Expected: {new Date(po.expectedDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="font-medium text-black">{formatCurrency(po.totalAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Inventory Type Summary */}
        <ChartCard title="Inventory by Type" description="Consumables vs Assets">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-black">Consumables</span>
              <span className="text-2xl font-bold text-black">{stats.consumables}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-black">Assets</span>
              <span className="text-2xl font-bold text-black">{stats.assets}</span>
            </div>
          </div>
        </ChartCard>

        {/* Procurement Summary */}
        <ChartCard title="Procurement Summary" description="Purchase order metrics">
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Total Orders (Period)</p>
              <p className="text-2xl font-bold text-black">{filteredPurchaseOrders.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Pending Delivery</p>
              <p className="text-2xl font-bold text-black">
                {filteredPurchaseOrders.filter(po => po.status === "approved" || po.status === "ordered").length}
              </p>
            </div>
          </div>
        </ChartCard>

        {/* Total Valuation */}
        <ChartCard title="Total Valuation" description="Current inventory worth">
          <div className="flex flex-col items-center justify-center py-6">
            <Wallet className="h-12 w-12 text-green-600 mb-4" />
            <span className="text-3xl font-bold text-black">{formatCurrency(stats.totalValue)}</span>
            <span className="text-sm text-gray-500 mt-2">Total inventory value</span>
            <div className="mt-4 pt-4 border-t border-gray-200 w-full text-center">
              <span className="text-xs text-gray-500">{stats.totalItems} items tracked</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </PageContainer>
  );
}
