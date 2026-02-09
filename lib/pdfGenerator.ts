import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type ReportContent = "pos_revenue" | "room_revenue" | "occupancy" | "bookings" | "inventory";

interface ReportData {
  hotelName: string;
  periodStart: string;
  periodEnd: string;
  metrics: {
    totalRevenue: number;
    roomRevenue: number;
    posRevenue: number;
    occupancyRate: number;
    totalBookings: number;
    onlineBookings: number;
    walkInBookings: number;
    averageStayDuration: number;
  };
  topRoom?: string;
  alerts?: string[];
}

interface PDFAttachment {
  filename: string;
  content: string; // Base64 encoded PDF
}

const COLORS = {
  black: [0, 0, 0] as [number, number, number],
  darkGray: [60, 60, 60] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
}

function drawHeader(doc: jsPDF, hotelName: string, reportTitle: string, periodStart: string, periodEnd: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.black);
  doc.text(hotelName.toUpperCase(), 14, 15);
  
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.8);
  doc.line(14, 19, pageWidth - 14, 19);
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(reportTitle, 14, 28);
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`${periodStart} - ${periodEnd}`, pageWidth - 14, 15, { align: "right" });
  
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), "PPpp")}`, pageWidth - 14, 28, { align: "right" });
}

function drawFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text("Minima Hotel Reports", 14, pageHeight - 6);
  doc.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 6, { align: "right" });
}

function generatePOSRevenueReport(data: ReportData): string {
  const doc = new jsPDF();
  
  drawHeader(doc, data.hotelName, "POS Revenue Report", data.periodStart, data.periodEnd);
  
  let startY = 38;
  
  // Summary
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text("Revenue Summary", 14, startY);
  
  const summaryData = [
    ["POS Revenue", formatCurrency(data.metrics.posRevenue)],
    ["Total Revenue", formatCurrency(data.metrics.totalRevenue)],
    ["POS Contribution", `${data.metrics.totalRevenue > 0 ? ((data.metrics.posRevenue / data.metrics.totalRevenue) * 100).toFixed(1) : 0}%`],
  ];
  
  autoTable(doc, {
    startY: startY + 6,
    head: [["Metric", "Value"]],
    body: summaryData,
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
    theme: "grid",
    margin: { left: 14, right: 14 },
  });
  
  drawFooter(doc, 1);
  
  return doc.output("datauristring").split(",")[1];
}

function generateRoomRevenueReport(data: ReportData): string {
  const doc = new jsPDF();
  
  drawHeader(doc, data.hotelName, "Room Revenue Report", data.periodStart, data.periodEnd);
  
  let startY = 38;
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text("Revenue Summary", 14, startY);
  
  const summaryData = [
    ["Room Revenue", formatCurrency(data.metrics.roomRevenue)],
    ["Total Bookings", data.metrics.totalBookings.toString()],
    ["Average per Booking", formatCurrency(data.metrics.totalBookings > 0 ? data.metrics.roomRevenue / data.metrics.totalBookings : 0)],
    ["Total Revenue", formatCurrency(data.metrics.totalRevenue)],
    ["Room Contribution", `${data.metrics.totalRevenue > 0 ? ((data.metrics.roomRevenue / data.metrics.totalRevenue) * 100).toFixed(1) : 0}%`],
  ];
  
  if (data.topRoom) {
    summaryData.push(["Top Performing Room", data.topRoom]);
  }
  
  autoTable(doc, {
    startY: startY + 6,
    head: [["Metric", "Value"]],
    body: summaryData,
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
    theme: "grid",
    margin: { left: 14, right: 14 },
  });
  
  drawFooter(doc, 1);
  
  return doc.output("datauristring").split(",")[1];
}

function generateOccupancyReport(data: ReportData): string {
  const doc = new jsPDF();
  
  drawHeader(doc, data.hotelName, "Occupancy Report", data.periodStart, data.periodEnd);
  
  let startY = 38;
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text("Occupancy Metrics", 14, startY);
  
  const summaryData = [
    ["Occupancy Rate", `${data.metrics.occupancyRate}%`],
    ["Total Bookings", data.metrics.totalBookings.toString()],
    ["Average Stay Duration", `${data.metrics.averageStayDuration} nights`],
    ["Online Bookings", data.metrics.onlineBookings.toString()],
    ["Walk-in Bookings", data.metrics.walkInBookings.toString()],
  ];
  
  autoTable(doc, {
    startY: startY + 6,
    head: [["Metric", "Value"]],
    body: summaryData,
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
    theme: "grid",
    margin: { left: 14, right: 14 },
  });
  
  drawFooter(doc, 1);
  
  return doc.output("datauristring").split(",")[1];
}

function generateBookingsReport(data: ReportData): string {
  const doc = new jsPDF();
  
  drawHeader(doc, data.hotelName, "Bookings Summary", data.periodStart, data.periodEnd);
  
  let startY = 38;
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text("Booking Statistics", 14, startY);
  
  const summaryData = [
    ["Total Bookings", data.metrics.totalBookings.toString()],
    ["Online Bookings", `${data.metrics.onlineBookings} (${data.metrics.totalBookings > 0 ? ((data.metrics.onlineBookings / data.metrics.totalBookings) * 100).toFixed(1) : 0}%)`],
    ["Walk-in Bookings", `${data.metrics.walkInBookings} (${data.metrics.totalBookings > 0 ? ((data.metrics.walkInBookings / data.metrics.totalBookings) * 100).toFixed(1) : 0}%)`],
    ["Average Stay Duration", `${data.metrics.averageStayDuration} nights`],
    ["Total Revenue", formatCurrency(data.metrics.totalRevenue)],
    ["Average Revenue per Booking", formatCurrency(data.metrics.totalBookings > 0 ? data.metrics.totalRevenue / data.metrics.totalBookings : 0)],
  ];
  
  autoTable(doc, {
    startY: startY + 6,
    head: [["Metric", "Value"]],
    body: summaryData,
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
    theme: "grid",
    margin: { left: 14, right: 14 },
  });
  
  drawFooter(doc, 1);
  
  return doc.output("datauristring").split(",")[1];
}

function generateInventoryReport(data: ReportData): string {
  const doc = new jsPDF();
  
  drawHeader(doc, data.hotelName, "Inventory Report", data.periodStart, data.periodEnd);
  
  let startY = 38;
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text("Inventory Overview", 14, startY);
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text("Note: Detailed inventory data requires database access.", 14, startY + 10);
  doc.text("This report shows summary information for the selected period.", 14, startY + 16);
  
  const summaryData = [
    ["Report Period", `${data.periodStart} - ${data.periodEnd}`],
    ["Status", "Inventory tracking active"],
  ];
  
  autoTable(doc, {
    startY: startY + 24,
    head: [["Item", "Value"]],
    body: summaryData,
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
    theme: "grid",
    margin: { left: 14, right: 14 },
  });
  
  drawFooter(doc, 1);
  
  return doc.output("datauristring").split(",")[1];
}

export async function generateReportPDFs(
  reportTypes: ReportContent[],
  data: ReportData
): Promise<PDFAttachment[]> {
  const attachments: PDFAttachment[] = [];
  
  const generators: Record<ReportContent, (data: ReportData) => string> = {
    pos_revenue: generatePOSRevenueReport,
    room_revenue: generateRoomRevenueReport,
    occupancy: generateOccupancyReport,
    bookings: generateBookingsReport,
    inventory: generateInventoryReport,
  };
  
  const filenames: Record<ReportContent, string> = {
    pos_revenue: "POS_Revenue_Report",
    room_revenue: "Room_Revenue_Report",
    occupancy: "Occupancy_Report",
    bookings: "Bookings_Summary",
    inventory: "Inventory_Report",
  };
  
  for (const reportType of reportTypes) {
    const generator = generators[reportType];
    if (generator) {
      const pdfBase64 = generator(data);
      const dateStr = format(new Date(), "yyyy-MM-dd");
      attachments.push({
        filename: `${filenames[reportType]}_${dateStr}.pdf`,
        content: pdfBase64,
      });
    }
  }
  
  return attachments;
}
