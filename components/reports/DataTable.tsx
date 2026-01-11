"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
}

const statusColors: Record<string, string> = {
  confirmed: "bg-gray-100 text-black border-gray-300",
  "checked-in": "bg-black text-white border-black",
  pending: "bg-gray-100 text-gray-500 border-gray-300",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
};

export function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="rounded-md border border-gray-300 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-300 bg-gray-100/50">
            {columns.map((column) => <TableHead key={column.key} className="text-xs font-medium text-gray-500">{column.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className="border-b border-gray-300 transition-colors duration-200 hover:bg-gray-100/30">
              {columns.map((column) => (
                <TableCell key={column.key} className="py-4">
                  {column.render ? column.render(row[column.key], row) : column.key === "status" ? (
                    <Badge variant="outline" className={cn("font-normal capitalize", statusColors[row[column.key]] || "bg-gray-100 text-gray-500")}>{row[column.key]}</Badge>
                  ) : (
                    <span className="text-sm text-black">{row[column.key]}</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
