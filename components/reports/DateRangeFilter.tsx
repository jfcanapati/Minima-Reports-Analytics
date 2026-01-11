"use client";

import { format } from "date-fns";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  reportTitle?: string;
}

export function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onExportPDF, onExportExcel }: DateRangeFilterProps) {
  const presetRanges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }, { label: "This Year", days: 365 }];

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-300 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">From:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !startDate && "text-gray-500")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus className="pointer-events-auto" /></PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">To:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !endDate && "text-gray-500")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus className="pointer-events-auto" /></PopoverContent>
        </Popover>
      </div>

      <div className="hidden md:flex items-center gap-2 border-l border-gray-300 pl-4">
        {presetRanges.map((preset) => <Button key={preset.label} variant="ghost" size="sm" onClick={() => applyPreset(preset.days)} className="text-xs">{preset.label}</Button>)}
      </div>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button className="gap-2"><Download className="h-4 w-4" />Export</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer"><FileText className="h-4 w-4 text-red-600" />Export as PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer"><FileSpreadsheet className="h-4 w-4 text-green-600" />Export as Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
