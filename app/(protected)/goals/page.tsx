"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChartCard } from "@/components/reports/ChartCard";
import { KPICard } from "@/components/reports/KPICard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useGoals, useGoalProgress, useCreateGoal, useDeleteGoal, Goal } from "@/hooks/useGoals";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatCurrencyShort } from "@/lib/localization";
import { Target, Plus, Trash2, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function GoalsPage() {
  const [showForm, setShowForm] = useState(false);
  const [goalType, setGoalType] = useState<"revenue" | "occupancy" | "bookings">("revenue");
  const [target, setTarget] = useState("");
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: progress, isLoading: progressLoading } = useGoalProgress(goals || []);
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();

  const isLoading = goalsLoading || progressLoading;

  const handleCreateGoal = async () => {
    if (!target || parseFloat(target) <= 0) {
      toast({ variant: "destructive", title: "Invalid target", description: "Please enter a valid target value." });
      return;
    }

    try {
      await createGoal.mutateAsync({
        type: goalType,
        target: parseFloat(target),
        period,
        month: selectedMonth,
        year: selectedYear,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Goal created", description: "Your goal has been set successfully." });
      setShowForm(false);
      setTarget("");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to create goal." });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal.mutateAsync(goalId);
      toast({ title: "Goal deleted", description: "The goal has been removed." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete goal." });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "achieved": return "text-green-600 bg-green-100";
      case "on-track": return "text-blue-600 bg-blue-100";
      case "at-risk": return "text-yellow-600 bg-yellow-100";
      case "behind": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "achieved": return <CheckCircle className="h-4 w-4" />;
      case "on-track": return <TrendingUp className="h-4 w-4" />;
      case "at-risk": return <AlertTriangle className="h-4 w-4" />;
      case "behind": return <Clock className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatGoalValue = (goal: Goal, value: number) => {
    if (goal.type === "revenue") return formatCurrency(value);
    if (goal.type === "occupancy") return `${value}%`;
    return value.toString();
  };

  const formatGoalTarget = (goal: Goal) => {
    if (goal.type === "revenue") return formatCurrencyShort(goal.target);
    if (goal.type === "occupancy") return `${goal.target}%`;
    return goal.target.toString();
  };

  // Summary stats
  const achievedCount = progress?.filter(p => p.status === "achieved").length || 0;
  const onTrackCount = progress?.filter(p => p.status === "on-track").length || 0;
  const atRiskCount = progress?.filter(p => p.status === "at-risk" || p.status === "behind").length || 0;

  if (isLoading) {
    return (
      <PageContainer title="Goals & Targets" subtitle="Set and track your performance goals">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Goals & Targets" subtitle="Set and track your performance goals">
      {/* Summary KPIs */}
      <div className="grid gap-6 md:grid-cols-4">
        <KPICard
          title="Total Goals"
          value={(goals?.length || 0).toString()}
          icon={<Target className="h-6 w-6" />}
        />
        <KPICard
          title="Achieved"
          value={achievedCount.toString()}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
        <KPICard
          title="On Track"
          value={onTrackCount.toString()}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="primary"
        />
        <KPICard
          title="Needs Attention"
          value={atRiskCount.toString()}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      {/* Add Goal Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "Add Goal"}
        </Button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-heading font-semibold text-black mb-4">Create New Goal</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label>Goal Type</Label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as any)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="revenue">Revenue</option>
                <option value="occupancy">Occupancy Rate</option>
                <option value="bookings">Number of Bookings</option>
              </select>
            </div>
            <div>
              <Label>Target {goalType === "revenue" ? "(₱)" : goalType === "occupancy" ? "(%)" : ""}</Label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={goalType === "revenue" ? "100000" : goalType === "occupancy" ? "80" : "50"}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Period</Label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <Label>Month</Label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                {MONTH_NAMES.map((month, i) => (
                  <option key={i} value={i}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Year</Label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                {[2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreateGoal} disabled={createGoal.isPending}>
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="mt-6 space-y-4">
        {progress && progress.length > 0 ? (
          progress.map((p) => (
            <div key={p.goal.id} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-heading font-semibold text-black capitalize">
                      {p.goal.type} Goal
                    </h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(p.status)}`}>
                      {getStatusIcon(p.status)}
                      {p.status.replace("-", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {MONTH_NAMES[p.goal.month]} {p.goal.year} • {p.goal.period}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGoal(p.goal.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-black">
                    {formatGoalValue(p.goal, p.current)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Target: {formatGoalTarget(p.goal)}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.status === "achieved" ? "bg-green-500" :
                      p.status === "on-track" ? "bg-blue-500" :
                      p.status === "at-risk" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(p.percentage, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">{p.percentage}% complete</span>
                  <span className="text-gray-500">{p.daysRemaining} days remaining</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No goals set</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first goal to start tracking your hotel's performance.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
