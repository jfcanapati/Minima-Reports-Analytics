"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { useGuestAnalytics } from "@/hooks/useGuestAnalytics";
import { useRoomPerformance } from "@/hooks/useRoomPerformance";
import { usePeakAnalysis } from "@/hooks/usePeakAnalysis";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { Users, Repeat, Clock, BedDouble, TrendingUp, Calendar, Sun, Moon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";

const COLORS = ["#111111", "#4B4B4B", "#8A8A8A", "#D1D1D1", "#E6E1DA"];

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: guestData, isLoading: guestLoading } = useGuestAnalytics(startDate, endDate);
  const { data: roomData, isLoading: roomLoading } = useRoomPerformance(startDate, endDate);
  const { data: peakData, isLoading: peakLoading } = usePeakAnalysis(startDate, endDate);

  const isLoading = guestLoading || roomLoading || peakLoading;

  if (isLoading) {
    return (
      <PageContainer title="Analytics" subtitle="Guest, room, and peak analysis">
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  const sourceData = [
    { name: "Online", value: guestData?.onlineBookings || 0 },
    { name: "Walk-in", value: guestData?.walkInBookings || 0 },
  ];

  const guestTypeData = [
    { name: "New Guests", value: guestData?.newGuests || 0 },
    { name: "Repeat Guests", value: guestData?.repeatGuests || 0 },
  ];

  return (
    <PageContainer title="Analytics" subtitle="Guest behavior, room performance, and peak analysis">
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        showExport={false}
      />

      {/* Guest Analytics Section */}
      <div className="mt-6">
        <h2 className="text-lg font-heading font-semibold text-black mb-4">Guest Analytics</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Guests"
            value={guestData?.totalGuests?.toString() || "0"}
            icon={<Users className="h-6 w-6" />}
          />
          <KPICard
            title="Repeat Guests"
            value={`${guestData?.repeatGuestPercentage || 0}%`}
            subtitle={`${guestData?.repeatGuests || 0} guests`}
            icon={<Repeat className="h-6 w-6" />}
            variant="success"
          />
          <KPICard
            title="Avg Stay Duration"
            value={`${guestData?.averageStayDuration || 0} nights`}
            icon={<Clock className="h-6 w-6" />}
          />
          <KPICard
            title="Online vs Walk-in"
            value={`${guestData?.onlinePercentage || 0}% / ${guestData?.walkInPercentage || 0}%`}
            icon={<Users className="h-6 w-6" />}
            variant="primary"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Booking Source" description="Online vs Walk-in bookings">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Guest Type" description="New vs Repeat guests">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={guestTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {guestTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="mt-6">
          <ChartCard title="Stay Duration Distribution" description="How long guests typically stay">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={guestData?.stayDurationDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="range" stroke="#8A8A8A" fontSize={12} />
                  <YAxis stroke="#8A8A8A" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1" }} />
                  <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Top Guests Table */}
        {guestData?.topGuests && guestData.topGuests.length > 0 && (
          <div className="mt-6">
            <ChartCard title="Top Guests" description="By total spending">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Guest</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Bookings</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestData.topGuests.map((guest, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-black">{guest.name}</td>
                        <td className="py-3 px-4 text-gray-500">{guest.email}</td>
                        <td className="py-3 px-4 text-center">{guest.bookings}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(guest.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      {/* Room Performance Section */}
      <div className="mt-10">
        <h2 className="text-lg font-heading font-semibold text-black mb-4">Room Performance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Room Revenue"
            value={formatCurrencyShort(roomData?.totalRoomRevenue || 0)}
            icon={<BedDouble className="h-6 w-6" />}
            variant="primary"
          />
          <KPICard
            title="Avg Occupancy"
            value={`${roomData?.averageOccupancy || 0}%`}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <KPICard
            title="Top Room"
            value={roomData?.topPerformer?.roomType || "N/A"}
            subtitle={formatCurrency(roomData?.topPerformer?.totalRevenue || 0)}
            icon={<BedDouble className="h-6 w-6" />}
            variant="success"
          />
          <KPICard
            title="Needs Attention"
            value={roomData?.lowestPerformer?.roomType || "N/A"}
            subtitle={formatCurrency(roomData?.lowestPerformer?.totalRevenue || 0)}
            icon={<BedDouble className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        <div className="mt-6">
          <ChartCard title="Room Performance Ranking" description="Revenue and bookings by room">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Room Type</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Bookings</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Occupancy</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Avg Stay</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {roomData?.rooms.map((room) => (
                    <tr key={room.roomId} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          room.rank === 1 ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          {room.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-black">{room.roomType}</td>
                      <td className="py-3 px-4 text-center">{room.totalBookings}</td>
                      <td className="py-3 px-4 text-center">{room.occupancyRate}%</td>
                      <td className="py-3 px-4 text-center">{room.averageStay} nights</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(room.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Peak Analysis Section */}
      <div className="mt-10">
        <h2 className="text-lg font-heading font-semibold text-black mb-4">Peak Hours & Days</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Peak Booking Hour"
            value={peakData?.peakHour || "N/A"}
            icon={<Clock className="h-6 w-6" />}
          />
          <KPICard
            title="Busiest Day"
            value={peakData?.peakDay || "N/A"}
            icon={<Calendar className="h-6 w-6" />}
            variant="primary"
          />
          <KPICard
            title="Slowest Day"
            value={peakData?.slowestDay || "N/A"}
            icon={<Calendar className="h-6 w-6" />}
            variant="warning"
          />
          <KPICard
            title="Weekday vs Weekend"
            value={`${peakData?.weekdayVsWeekend.weekday || 0} / ${peakData?.weekdayVsWeekend.weekend || 0}`}
            subtitle="bookings"
            icon={<Sun className="h-6 w-6" />}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Bookings by Day of Week" description="Check-in distribution">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakData?.bookingsByDayOfWeek || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="day" stroke="#8A8A8A" fontSize={11} />
                  <YAxis stroke="#8A8A8A" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1" }} />
                  <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Revenue by Day of Week" description="Which days generate most revenue">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakData?.bookingsByDayOfWeek || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="day" stroke="#8A8A8A" fontSize={11} />
                  <YAxis stroke="#8A8A8A" fontSize={12} tickFormatter={(v) => formatCurrencyShort(v)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1" }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#4B4B4B" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="mt-6">
          <ChartCard title="Booking Activity by Hour" description="When bookings are typically made">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakData?.checkInsByHour || []}>
                  <defs>
                    <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D1D1" />
                  <XAxis dataKey="hour" stroke="#8A8A8A" fontSize={10} interval={2} />
                  <YAxis stroke="#8A8A8A" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #D1D1D1" }} />
                  <Area type="monotone" dataKey="count" stroke="#111111" fill="url(#hourGradient)" name="Bookings" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </PageContainer>
  );
}
