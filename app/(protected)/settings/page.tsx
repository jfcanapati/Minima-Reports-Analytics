"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { RefreshCw, Check, Clock, Zap } from "lucide-react";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { useState } from "react";

export default function SettingsPage() {
  const { autoRefresh, refreshInterval, lastRefresh, setAutoRefresh, setRefreshInterval, refreshAllData } = useDataRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const handleRefreshNow = async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);
    try {
      await refreshAllData();
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return "Never";
    const date = new Date(lastRefresh);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <PageContainer title="Settings" subtitle="Configure your reports and analytics preferences">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-sand/30">
              <RefreshCw className="h-5 w-5 text-black" />
            </div>
            <div>
              <CardTitle className="text-lg">Data Refresh</CardTitle>
              <CardDescription>Configure how often your data updates automatically</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column - Settings */}
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="font-medium">Auto Refresh</Label>
                    <p className="text-sm text-gray-500">Keep data up to date automatically</p>
                  </div>
                </div>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Label>Refresh Interval</Label>
                </div>
                <Select value={String(refreshInterval)} onValueChange={(val) => setRefreshInterval(Number(val))}>
                  <SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every 1 minute</SelectItem>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {autoRefresh 
                    ? `Data will refresh every ${refreshInterval} minute${refreshInterval > 1 ? 's' : ''}`
                    : 'Enable auto refresh to update data periodically'
                  }
                </p>
              </div>
            </div>

            {/* Right column - Status & Action */}
            <div className="flex flex-col justify-between rounded-lg bg-gray-50 p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium text-black">
                      {autoRefresh ? 'Auto refresh enabled' : 'Manual refresh only'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last refreshed</p>
                  <p className="mt-1 font-medium text-black">{formatLastRefresh()}</p>
                </div>
              </div>

              <Button 
                className="mt-6 w-full" 
                onClick={handleRefreshNow} 
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Refreshing...</>
                ) : refreshSuccess ? (
                  <><Check className="mr-2 h-4 w-4" />Data Refreshed!</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />Refresh Now</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
