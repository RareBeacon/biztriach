export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase";
import { COL, findDocs, getDoc, updateDocData, deleteDocById } from "@/lib/firestore";
import { sendEmail, emailTemplates } from "@/lib/email";

function isAdminEmail(email: string) {
  const admins = ["ogungboyeopeyemiphilip@gmail.com", "phoslabceo@gmail.com", "admin@biztriach.com"];
  return admins.includes(email);
}

async function isAdmin(req: Request) {
  const user = await getUserFromRequest(req);
  return user && (user.role === "ADMIN" || isAdminEmail(user.email)) ? user : null;
}

/** Attach organization objects to a list of user profiles. */
async function withOrganizations(users: any[]): Promise<any[]> {
  const orgIds = [...new Set(users.map((u) => u.organizationId).filter(Boolean))];
  const orgs = await Promise.all(orgIds.map((id: string) => getDoc(COL.organizations, id)));
  const orgMap = new Map<string, any>();
  orgIds.forEach((id: string, i: number) => {
    const org = orgs[i];
    if (org) orgMap.set(id, org);
  });
  return users.map((u) => ({ ...u, organization: u.organizationId ? orgMap.get(u.organizationId) || null : null }));
}

export async function GET(req: Request) {
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const users = await findDocs(COL.users, { orderBy: [["createdAt", "desc"]], limit: 200 });
    const withOrgs = await withOrganizations(users);

    const stats = {
      total: withOrgs.length,
      pending: withOrgs.filter(u => u.status === "PENDING").length,
      approved: withOrgs.filter(u => u.status === "APPROVED").length,
      suspended: withOrgs.filter(u => u.status === "SUSPENDED").length,
    };

    return NextResponse.json({ users: withOrgs, stats });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const { userId, action, reason } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

    let updated;
    switch (action) {
      case "APPROVE":
        updated = await updateDocData(COL.users, userId, {
          status: "APPROVED",
          approvedAt: new Date().toISOString(),
          approvedBy: admin.id,
        });
        if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
        try {
          await firebaseAuth().setCustomUserClaims(userId, { role: updated.role || "USER", status: "APPROVED" });
        } catch (e) { console.warn("Claims update failed", e); }
        // Send approval email
        try {
          const tmpl = emailTemplates.accountApproved(updated.name);
          await sendEmail({ to: updated.email, subject: tmpl.subject, html: tmpl.html });
        } catch (e) { console.error("Approval email failed", e); }
        break;
      case "REJECT":
        updated = await updateDocData(COL.users, userId, { status: "REJECTED", suspendedReason: reason });
        if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
        try {
          await firebaseAuth().setCustomUserClaims(userId, { role: updated.role || "USER", status: "REJECTED" });
        } catch (e) { console.warn("Claims update failed", e); }
        break;
      case "SUSPEND":
        updated = await updateDocData(COL.users, userId, {
          status: "SUSPENDED",
          suspendedReason: reason || "Suspended by admin",
        });
        if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
        try {
          // Revoke live sessions + reflect status in claims
          await firebaseAuth().revokeRefreshTokens(userId);
          await firebaseAuth().setCustomUserClaims(userId, { role: updated.role || "USER", status: "SUSPENDED" });
        } catch (e) { console.warn("Claims update failed", e); }
        break;
      case "REACTIVATE":
        updated = await updateDocData(COL.users, userId, { status: "APPROVED", suspendedReason: null });
        if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
        try {
          await firebaseAuth().setCustomUserClaims(userId, { role: updated.role || "USER", status: "APPROVED" });
        } catch (e) { console.warn("Claims update failed", e); }
        break;
      case "DELETE":
        await deleteDocById(COL.users, userId);
        try {
          await firebaseAuth().deleteUser(userId);
        } catch (e) {
          console.warn("Firebase Auth user deletion failed (may already be gone):", e);
        }
        return NextResponse.json({ success: true, deleted: true });
      case "MAKE_ADMIN":
        updated = await updateDocData(COL.users, userId, { role: "ADMIN" });
        if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
        try {
          await firebaseAuth().setCustomUserClaims(userId, { role: "ADMIN", status: updated.status || "PENDING" });
        } catch (e) { console.warn("Claims update failed", e); }
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
