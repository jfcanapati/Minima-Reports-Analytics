import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

// Ink-friendly colors (minimal ink usage)
const COLORS = {
  black: [0, 0, 0] as [number, number, number],
  darkGray: [60, 60, 60] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [34, 120, 60] as [number, number, number],
  red: [180, 50, 50] as [number, number, number],
};

interface ExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: { start: Date | undefined; end: Date | undefined };
}

// Helper to draw header (ink-friendly - no filled backgrounds)
function drawHeader(doc: jsPDF, options: ExportOptions) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Hotel name
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.black);
  doc.text("MINIMA HOTEL", 14, 15);
  
  // Thin line under brand
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.8);
  doc.line(14, 19, pageWidth - 14, 19);
  
  // Report title
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(options.title, 14, 28);
  
  // Date range on right side
  if (options.dateRange?.start && options.dateRange?.end) {
    const dateText = `${format(options.dateRange.start, "MMM dd, yyyy")} - ${format(options.dateRange.end, "MMM dd, yyyy")}`;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(dateText, pageWidth - 14, 15, { align: "right" });
  }
  
  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated: ${format(new Date(), "PPpp")}`, pageWidth - 14, 28, { align: "right" });
}

// Helper to draw footer
function drawFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Thin footer line
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  
  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text("Minima Hotel Reports", 14, pageHeight - 6);
  doc.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 6, { align: "right" });
}

export const exportToPDF = (
  data: any[], 
  columns: { key: string; label: string }[], 
  options: ExportOptions
) => {
  const doc = new jsPDF();
  
  drawHeader(doc, options);
  
  // Subtitle if provided
  let startY = 38;
  if (options.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(options.subtitle, 14, startY);
    startY += 8;
  }
  
  // Table
  const tableColumns = columns.map((col) => col.label);
  const tableRows = data.map((row) => 
    columns.map((col) => {
      const value = row[col.key];
      if (typeof value === "number") {
        return value.toLocaleString();
      }
      return value?.toString() || "";
    })
  );
  
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: startY,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.black,
      lineColor: COLORS.lightGray,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.white,
      textColor: COLORS.black,
      fontStyle: "bold",
      fontSize: 9,
      lineWidth: 0.5,
      lineColor: COLORS.black,
    },
    bodyStyles: {
      fillColor: COLORS.white,
    },
    theme: "grid",
    margin: { top: 38, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Draw header on every page
      drawHeader(doc, options);
      drawFooter(doc, data.pageNumber);
    },
  });
  
  doc.save(`${options.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const exportKPIsToPDF = (
  kpis: { label: string; value: string | number; change?: number }[], 
  chartData: any[], 
  options: ExportOptions
) => {
  const doc = new jsPDF();
  
  drawHeader(doc, options);
  
  // KPI Section Title
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text("Key Performance Indicators", 14, 42);
  
  // KPIs as simple table - centered
  const kpiRows = kpis.map((kpi) => [
    kpi.label,
    String(kpi.value),
    kpi.change !== undefined ? `${kpi.change >= 0 ? "+" : ""}${kpi.change}%` : "-"
  ]);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 140; // total width of KPI table
  const marginLeft = (pageWidth - tableWidth) / 2;
  
  autoTable(doc, {
    head: [["Metric", "Value", "Change"]],
    body: kpiRows,
    startY: 48,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.black,
      lineColor: COLORS.lightGray,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.white,
      textColor: COLORS.black,
      fontStyle: "bold",
      lineWidth: 0.5,
      lineColor: COLORS.black,
    },
    bodyStyles: {
      fillColor: COLORS.white,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
    },
    theme: "grid",
    margin: { left: marginLeft, right: marginLeft },
    tableWidth: tableWidth,
  });
  
  // Data Table Section
  if (chartData.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.black);
    doc.text("Detailed Data", 14, finalY + 12);
    
    const columns = Object.keys(chartData[0]);
    const headers = columns.map((col) => col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, " $1"));
    const rows = chartData.map((row) => 
      columns.map((col) => {
        const value = row[col];
        if (typeof value === "number") {
          return value.toLocaleString();
        }
        return String(value);
      })
    );
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: finalY + 18,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.black,
        lineColor: COLORS.lightGray,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.white,
        textColor: COLORS.black,
        fontStyle: "bold",
        lineWidth: 0.5,
        lineColor: COLORS.black,
      },
      bodyStyles: {
        fillColor: COLORS.white,
      },
      theme: "grid",
      margin: { top: 38, left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        // Draw header on every page
        drawHeader(doc, options);
        drawFooter(doc, data.pageNumber);
      },
    });
  }
  
  // Only draw footer on page 1 if no chart data (otherwise didDrawPage handles it)
  if (chartData.length === 0) {
    drawFooter(doc, 1);
  }
  
  doc.save(`${options.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const exportToExcel = (
  data: any[], 
  columns: { key: string; label: string }[], 
  options: ExportOptions
) => {
  const workbook = XLSX.utils.book_new();
  
  // Main data sheet
  const headers = columns.map((col) => col.label);
  const rows = data.map((row) => columns.map((col) => row[col.key]));
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Column widths
  worksheet["!cols"] = columns.map(() => ({ wch: 18 }));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
  
  // Summary sheet
  const summaryData = [
    ["MINIMA HOTEL"],
    [""],
    ["Report Information"],
    ["Report Name", options.title],
    ["Generated", format(new Date(), "PPpp")],
    ...(options.dateRange?.start && options.dateRange?.end 
      ? [["Date Range", `${format(options.dateRange.start, "MMM dd, yyyy")} - ${format(options.dateRange.end, "MMM dd, yyyy")}`]] 
      : []),
    ["Total Records", data.length],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  
  XLSX.writeFile(workbook, `Minima_${options.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportKPIsToExcel = (
  kpis: { label: string; value: string | number; change?: number }[], 
  chartData: any[], 
  options: ExportOptions
) => {
  const workbook = XLSX.utils.book_new();
  
  // KPIs sheet
  const kpiData = [
    ["MINIMA HOTEL - KEY PERFORMANCE INDICATORS"],
    [""],
    ["Metric", "Value", "Change"],
    ...kpis.map((kpi) => [
      kpi.label, 
      kpi.value, 
      kpi.change !== undefined ? `${kpi.change >= 0 ? "+" : ""}${kpi.change}%` : "-"
    ])
  ];
  const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
  kpiSheet["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, kpiSheet, "KPIs");
  
  // Data sheet
  if (chartData.length > 0) {
    const columns = Object.keys(chartData[0]);
    const headers = columns.map((col) => col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, " $1"));
    const rows = chartData.map((row) => columns.map((col) => row[col]));
    const dataSheet = XLSX.utils.aoa_to_sheet([
      ["MINIMA HOTEL - DETAILED DATA"],
      [""],
      headers, 
      ...rows
    ]);
    dataSheet["!cols"] = columns.map(() => ({ wch: 15 }));
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Data");
  }
  
  // Summary sheet
  const summaryData = [
    ["MINIMA HOTEL"],
    [""],
    ["Report Information"],
    ["Report Name", options.title],
    ["Generated", format(new Date(), "PPpp")],
    ...(options.dateRange?.start && options.dateRange?.end 
      ? [["Date Range", `${format(options.dateRange.start, "MMM dd, yyyy")} - ${format(options.dateRange.end, "MMM dd, yyyy")}`]] 
      : []),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  
  XLSX.writeFile(workbook, `Minima_${options.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};
