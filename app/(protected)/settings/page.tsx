"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Bell, Database, RefreshCw, Download } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageContainer title="Settings" subtitle="Configure your reports and analytics preferences">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100"><Database className="h-5 w-5 text-black" /></div>
              <div><CardTitle className="text-lg">Data Sources</CardTitle><CardDescription>Configure connected systems</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><Label className="font-medium">Booking System</Label><p className="text-sm text-gray-500">Reservation data sync</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><Label className="font-medium">POS System</Label><p className="text-sm text-gray-500">Sales transaction data</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><Label className="font-medium">Inventory System</Label><p className="text-sm text-gray-500">Stock and usage data</p></div><Switch defaultChecked /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-sand/30"><RefreshCw className="h-5 w-5 text-black" /></div>
              <div><CardTitle className="text-lg">Data Refresh</CardTitle><CardDescription>Automatic data update settings</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Refresh Interval</Label>
              <Select defaultValue="5">
                <SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><div><Label className="font-medium">Auto Refresh</Label><p className="text-sm text-gray-500">Automatically update data</p></div><Switch defaultChecked /></div>
            <Button className="w-full" variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Refresh Now</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-100"><Bell className="h-5 w-5 text-yellow-600" /></div>
              <div><CardTitle className="text-lg">Notifications</CardTitle><CardDescription>Alert and notification preferences</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><Label className="font-medium">Low Occupancy Alert</Label><p className="text-sm text-gray-500">When rate drops below 60%</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><Label className="font-medium">Revenue Target Alert</Label><p className="text-sm text-gray-500">Daily revenue updates</p></div><Switch /></div>
            <div className="flex items-center justify-between"><div><Label className="font-medium">Inventory Low Stock</Label><p className="text-sm text-gray-500">Critical stock level alerts</p></div><Switch defaultChecked /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100"><Download className="h-5 w-5 text-green-600" /></div>
              <div><CardTitle className="text-lg">Export Reports</CardTitle><CardDescription>Download report data</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Email for Scheduled Reports</Label><Input placeholder="reports@hotel.com" type="email" /></div>
            <Button className="w-full"><Download className="mr-2 h-4 w-4" />Export All Reports</Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
