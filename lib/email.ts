import * as Brevo from "@getbrevo/brevo";

export type ReportContent = "pos_revenue" | "room_revenue" | "occupancy" | "bookings" | "inventory";

export interface ReportEmailData {
  to: string;
  reportContents: ReportContent[]; // Changed to array
  reportTitles: string[]; // Array of titles
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
  alerts?: string[];
  topRoom?: string;
  forecast?: {
    nextMonthRevenue: number;
    trend: "up" | "down" | "stable";
  };
  pdfAttachments?: Array<{
    filename: string;
    content: string; // Base64
  }>;
}

// Legacy function - kept for backward compatibility but not used
export async function sendReportEmail(data: any) {
  // This function is deprecated - use sendReportEmailWithPDFs instead
  return sendReportEmailWithPDFs({
    ...data,
    reportContents: [data.reportContent || "room_revenue"],
    reportTitles: [data.reportTitle || "Room Revenue Report"],
  });
}


// New function to send email with multiple PDF reports
export async function sendReportEmailWithPDFs(data: ReportEmailData) {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  
  const apiKey = process.env.BREVO_API_KEY || "";
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  // Build list of reports
  const reportsList = data.reportTitles.map((title, idx) => 
    `<li style="margin: 5px 0;">${title}</li>`
  ).join("");

  const alertsHtml =
    data.alerts && data.alerts.length > 0
      ? `
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #92400E;">⚠️ Alerts</h3>
        <ul style="margin: 0; padding-left: 20px; color: #92400E;">
          ${data.alerts.map((alert) => `<li>${alert}</li>`).join("")}
        </ul>
      </div>
    `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1C1C1C; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #111111; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${data.hotelName}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.8;">Reports Package</p>
      </div>
      
      <div style="background-color: #F7F7F7; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #8A8A8A; margin-top: 0;">
          Report Period: <strong style="color: #1C1C1C;">${data.periodStart} - ${data.periodEnd}</strong>
        </p>

        <div style="background-color: white; border: 1px solid #D1D1D1; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h2 style="margin: 0 0 15px 0; color: #111111;">📊 Included Reports (${data.reportTitles.length})</h2>
          <ul style="margin: 0; padding-left: 20px; color: #1C1C1C;">
            ${reportsList}
          </ul>
          <p style="margin: 15px 0 0 0; color: #8A8A8A; font-size: 14px;">
            📎 Detailed PDF reports are attached to this email
          </p>
        </div>

        <h2 style="color: #111111; border-bottom: 2px solid #E6E1DA; padding-bottom: 10px;">Quick Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 12px; background-color: white; border: 1px solid #D1D1D1;">Total Revenue</td>
            <td style="padding: 12px; background-color: white; border: 1px solid #D1D1D1; text-align: right; font-weight: bold; color: #111111;">${formatCurrency(data.metrics.totalRevenue)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: white; border: 1px solid #D1D1D1;">Occupancy Rate</td>
            <td style="padding: 12px; background-color: white; border: 1px solid #D1D1D1; text-align: right; font-weight: bold;">${data.metrics.occupancyRate}%</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: white; border: 1px solid #D1D1D1;">Total Bookings</td>
            <td style="padding: 12px; background-color: white; border: 1px solid #D1D1D1; text-align: right; font-weight: bold;">${data.metrics.totalBookings}</td>
          </tr>
        </table>

        ${alertsHtml}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #D1D1D1; text-align: center; color: #8A8A8A; font-size: 12px;">
          <p>This is an automated report from Minima Reports Analytics.</p>
          <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `${data.hotelName} - Reports Package (${data.periodStart} - ${data.periodEnd})`;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = { 
    name: "Minima Reports", 
    email: process.env.BREVO_SENDER_EMAIL || "noreply@minimahotel.com" 
  };
  sendSmtpEmail.to = [{ email: data.to }];

  // Attach PDFs if provided
  if (data.pdfAttachments && data.pdfAttachments.length > 0) {
    sendSmtpEmail.attachment = data.pdfAttachments.map(pdf => ({
      name: pdf.filename,
      content: pdf.content,
    }));
  }

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  return result;
}
