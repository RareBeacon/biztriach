export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";

function isAdminEmail(email: string) {
  const admins = ["ogungboyeopeyemiphilip@gmail.com", "phoslabceo@gmail.com", "admin@biztriach.com"];
  return admins.includes(email);
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    const stats = {
      total: users.length,
      pending: users.filter(u => u.status === "PENDING").length,
      approved: users.filter(u => u.status === "APPROVED").length,
      suspended: users.filter(u => u.status === "SUSPENDED").length,
    };

    return NextResponse.json({ users, stats });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const { userId, action, reason } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

    let updated;
    switch (action) {
      case "APPROVE":
        updated = await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED", approvedAt: new Date(), approvedBy: user.id } });
        // Send approval email
        try {
          const tmpl = emailTemplates.accountApproved(updated.name);
          await sendEmail({ to: updated.email, subject: tmpl.subject, html: tmpl.html });
        } catch (e) { console.error("Approval email failed", e); }
        break;
      case "REJECT":
        updated = await prisma.user.update({ where: { id: userId }, data: { status: "REJECTED", suspendedReason: reason } });
        break;
      case "SUSPEND":
        updated = await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED", suspendedReason: reason || "Suspended by admin" } });
        break;
      case "REACTIVATE":
        updated = await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED", suspendedReason: null } });
        break;
      case "DELETE":
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true, deleted: true });
      case "MAKE_ADMIN":
        updated = await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
