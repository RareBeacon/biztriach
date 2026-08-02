import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter using provided Gmail SMTP
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "ogungboyeopeyemiphilip@gmail.com";
  const pass = process.env.SMTP_PASS || "xzke heza ejyf gjfn";

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // STARTTLS
    auth: { user, pass },
    tls: { ciphers: "SSLv3" }
  });
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || `"Biztriach" <${process.env.SMTP_USER || "ogungboyeopeyemiphilip@gmail.com"}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""),
      html
    });

    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Email templates for Biztriach branding
export const emailTemplates = {
  welcomePending: (name: string) => ({
    subject: "Welcome to Biztriach - Account Pending Approval 🎉",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Biztriach</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">AI Business Platform</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 16px;">Hi ${name}! 👋</h2>
          <p style="color: #475569; line-height: 1.6;">Thank you for joining Biztriach - the complete AI Business Platform that transforms your business operations.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #0f172a; font-weight: 600;">⏳ Your account status: <span style="color: #f59e0b;">PENDING APPROVAL</span></p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Our team is reviewing your registration. You'll receive access within a few hours after payment verification.</p>
          </div>
          <h3 style="color: #0f172a; font-size: 16px; margin: 24px 0 12px;">What happens next?</h3>
          <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
            <li>Make your subscription payment (instructions in dashboard)</li>
            <li>Admin verifies and approves your account</li>
            <li>You get full access to AI agents, inventory, sales, WhatsApp, landing pages & more</li>
          </ul>
          <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Questions? Reply to this email - we respond within 2 hours.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">© 2026 Biztriach - AI Business Platform</p>
        </div>
      </div>
    `
  }),
  accountApproved: (name: string) => ({
    subject: "✅ Your Biztriach Account is Approved - Let's Build!",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Biztriach! 🚀</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 16px 16px;">
          <p>Hi ${name},</p>
          <p><strong>Great news! Your account has been approved.</strong></p>
          <p>You now have full access to:</p>
          <ul>
            <li>🤖 AI Customer Support Agents</li>
            <li>📦 Inventory & Sales Management</li>
            <li>💬 WhatsApp Business Integration</li>
            <li>🎨 Landing Page & Funnel Builder</li>
            <li>📧 Email Campaigns & Leads</li>
            <li>📊 Financial Dashboard & AI Reports</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://biztriach.vercel.app"}/login" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 16px;">Access Dashboard →</a>
        </div>
      </div>
    `
  }),
  dailyReport: (businessName: string, report: any) => ({
    subject: `📊 Daily Business Report - ${businessName} - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="padding: 20px; background: #0f172a; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0;">📊 Biztriach Daily Report</h2>
          <p style="color: #94a3b8; margin: 4px 0 0;">${businessName} - ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;"><div style="color: #166534; font-size: 12px;">Revenue</div><div style="font-size: 18px; font-weight: 700;">₦${(report.revenue || 0).toLocaleString()}</div></div>
            <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca;"><div style="color: #991b1b; font-size: 12px;">Expenses</div><div style="font-size: 18px; font-weight: 700;">₦${(report.expenses || 0).toLocaleString()}</div></div>
            <div style="background: #f5f3ff; padding: 12px; border-radius: 8px; border: 1px solid #ddd6fe;"><div style="color: #5b21b6; font-size: 12px;">Profit</div><div style="font-size: 18px; font-weight: 700;">₦${(report.profit || 0).toLocaleString()}</div></div>
            <div style="background: #eff6ff; padding: 12px; border-radius: 8px; border: 1px solid #bfdbfe;"><div style="color: #1e40af; font-size: 12px;">Sales</div><div style="font-size: 18px; font-weight: 700;">${report.salesCount || 0} sales</div></div>
          </div>
          <p style="margin-top: 16px; color: #475569; font-size: 14px;">💡 <strong>AI Insight:</strong> ${report.insight || "Your best selling product today drove 40% of revenue. Consider restocking."}</p>
          ${report.lowStock && report.lowStock.length ? `<div style="margin-top: 12px; padding: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;"><strong style="color: #92400e;">⚠️ Low Stock Alert:</strong><br/>${report.lowStock.map((p: any) => `${p.name}: ${p.quantity} left`).join("<br/>")}</div>` : ""}
        </div>
      </div>
    `
  })
};
