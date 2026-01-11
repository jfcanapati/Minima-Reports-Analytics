"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useScheduledReports,
  useCreateScheduledReport,
  useDeleteScheduledReport,
  useUpdateScheduledReport,
  useSendReportNow,
} from "@/hooks/useEmailReports";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Plus, Trash2, Send, Clock, Calendar, ToggleLeft, ToggleRight } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function EmailReportsPage() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(8); // 8 AM

  const [sendNowEmail, setSendNowEmail] = useState("");
  const [sendNowType, setSendNowType] = useState<"daily" | "weekly" | "monthly">("weekly");

  const { user } = useAuth();
  const { data: schedules, isLoading } = useScheduledReports();
  const createSchedule = useCreateScheduledReport();
  const deleteSchedule = useDeleteScheduledReport();
  const updateSchedule = useUpdateScheduledReport();
  const sendNow = useSendReportNow();

  const handleCreateSchedule = async () => {
    if (!email || !user) return;

    await createSchedule.mutateAsync({
      email,
      frequency,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      hour,
      enabled: true,
      createdBy: user.uid,
    });

    setShowForm(false);
    setEmail("");
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    await updateSchedule.mutateAsync({ id, enabled: !currentEnabled });
  };

  const handleSendNow = async () => {
    if (!sendNowEmail) return;
    await sendNow.mutateAsync({ email: sendNowEmail, reportType: sendNowType });
  };

  const formatScheduleTime = (schedule: any) => {
    const hourStr = schedule.hour.toString().padStart(2, "0") + ":00";
    if (schedule.frequency === "daily") {
      return `Daily at ${hourStr}`;
    } else if (schedule.frequency === "weekly") {
      return `Every ${DAY_NAMES[schedule.dayOfWeek]} at ${hourStr}`;
    } else {
      return `Monthly on day ${schedule.dayOfMonth} at ${hourStr}`;
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Email Reports" subtitle="Automated report delivery">
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Email Reports" subtitle="Schedule automated report delivery to your inbox">
      {/* Send Report Now */}
      <ChartCard title="Send Report Now" description="Instantly send a report to any email">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={sendNowEmail}
              onChange={(e) => setSendNowEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="mt-1"
            />
          </div>
          <div className="w-40">
            <Label>Report Type</Label>
            <select
              value={sendNowType}
              onChange={(e) => setSendNowType(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Button onClick={handleSendNow} disabled={!sendNowEmail || sendNow.isPending}>
            <Send className="h-4 w-4 mr-2" />
            {sendNow.isPending ? "Sending..." : "Send Now"}
          </Button>
        </div>
      </ChartCard>

      {/* Scheduled Reports */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-black">Scheduled Reports</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "Add Schedule"}
          </Button>
        </div>

        {/* Add Schedule Form */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-heading font-semibold text-black mb-4">Create New Schedule</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {frequency === "weekly" && (
                <div>
                  <Label>Day of Week</Label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  >
                    {DAY_NAMES.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}
              {frequency === "monthly" && (
                <div>
                  <Label>Day of Month</Label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label>Time (Hour)</Label>
                <select
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCreateSchedule} disabled={!email || createSchedule.isPending}>
                {createSchedule.isPending ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </div>
        )}

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules && schedules.length > 0 ? (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`rounded-lg border bg-white p-6 transition-opacity ${
                  schedule.enabled ? "border-gray-200" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      schedule.enabled ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{schedule.email}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatScheduleTime(schedule)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {schedule.frequency} report
                        </span>
                      </div>
                      {schedule.lastSent && (
                        <p className="mt-1 text-xs text-gray-400">
                          Last sent: {new Date(schedule.lastSent).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEnabled(schedule.id, schedule.enabled)}
                      className={schedule.enabled ? "text-green-600" : "text-gray-400"}
                    >
                      {schedule.enabled ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchedule.mutate(schedule.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No scheduled reports</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create a schedule to automatically receive reports in your inbox.
              </p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-800">About Email Reports</h4>
        <p className="mt-1 text-sm text-blue-600">
          Scheduled reports are sent automatically at the specified time. Reports include revenue summary, 
          occupancy rates, booking statistics, and any active alerts. Make sure to add a valid email address 
          to receive reports.
        </p>
        <p className="mt-2 text-xs text-blue-500">
          Note: Email delivery requires Resend API configuration. Contact your administrator if emails are not being delivered.
        </p>
      </div>
    </PageContainer>
  );
}
