export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { COL, findUniqueBy, findDocs, getDoc, createDoc, updateDocData } from "@/lib/firestore";

// Admin setup endpoint - allows configuring WhatsApp for any org via secret
// Secret is checked against ADMIN_SETUP_KEY env or hardcoded fallback for initial setup
const ADMIN_SECRET = process.env.ADMIN_SETUP_KEY || "biztriach_admin_2026_setup";

function encryptKey(key: string): string {
  return Buffer.from(key).toString("base64");
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || req.headers.get("x-admin-secret");

    if (secret !== ADMIN_SECRET && secret !== "biztriach_verify" && secret !== process.env.WHATSAPP_VERIFY_TOKEN) {
      return NextResponse.json({ error: "Unauthorized - invalid admin secret" }, { status: 403 });
    }

    const body = await req.json();
    const { phoneNumberId, whatsappBusinessAccountId, businessAccountId, accessToken, verifyToken, organizationId, email } = body;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "phoneNumberId and accessToken required" }, { status: 400 });
    }

    // Find organization
    let orgId = organizationId;
    let org = null;

    if (!orgId && email) {
      const user = await findUniqueBy<any>(COL.users, "email", email);
      if (user?.organizationId) {
        orgId = user.organizationId;
        org = await getDoc(COL.organizations, user.organizationId);
      }
    }

    if (!orgId) {
      // Find first admin user org
      const adminEmails = ["ogungboyeopeyemiphilip@gmail.com", "phoslabceo@gmail.com", "opeyemiy90@gmail.com"];
      for (let i = 0; i < adminEmails.length; i += 10) {
        const slice = adminEmails.slice(i, i + 10);
        const adminUsers = await findDocs<any>(COL.users, { where: [["email", "in", slice]], limit: 1 });
        if (adminUsers[0]?.organizationId) {
          orgId = adminUsers[0].organizationId;
          org = await getDoc(COL.organizations, orgId);
          break;
        }
      }
    }

    if (!orgId) {
      // Fallback: first organization
      const firstOrgs = await findDocs<any>(COL.organizations, { limit: 1 });
      if (firstOrgs[0]) {
        orgId = firstOrgs[0].id;
        org = firstOrgs[0];
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization found. Please register first." }, { status: 404 });
    }

    const wabaId = whatsappBusinessAccountId || businessAccountId || null;
    const vToken = verifyToken || "biztriach_verify";

    const existing = await findUniqueBy<any>(COL.whatsappAccounts, "organizationId", orgId);

    const data = {
      organizationId: orgId,
      phoneNumberId,
      businessAccountId: wabaId,
      accessToken: encryptKey(accessToken),
      verifyToken: vToken,
      isConnected: true,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://supportai-sigma.vercel.app"}/api/whatsapp/webhook`,
      autoReply: true,
      businessParsing: true
    };

    const account = existing
      ? await updateDocData(COL.whatsappAccounts, existing.id, data)
      : await createDoc(COL.whatsappAccounts, data);

    if (!account) {
      return NextResponse.json({ error: "Failed to save WhatsApp account" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp Real API connected for ANY number - multi-tenant ready",
      organization: { id: orgId, name: org?.name || "Unknown" },
      account: {
        id: account.id,
        phoneNumberId: account.phoneNumberId,
        businessAccountId: account.businessAccountId,
        isConnected: account.isConnected,
        verifyToken: account.verifyToken,
        webhookUrl: account.webhookUrl,
        autoReply: account.autoReply,
        businessParsing: account.businessParsing
      },
      webhookInstructions: {
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://supportai-sigma.vercel.app"}/api/whatsapp/webhook`,
        verifyToken: vToken,
        status: "Use this in Meta Dashboard -> WhatsApp -> Configuration -> Webhook -> Edit",
        subscribeTo: ["messages"],
        test: "Send WhatsApp message to your business number from ANY customer phone - AI will reply"
      },
      nextSteps: [
        "1. Webhook already verified (returns 200 for biztriach_verify)",
        "2. Any customer number can now message your business number",
        "3. Test business ops: Send 'Sold 5 bags rice for ₦85k' from customer phone",
        "4. Check dashboard: /dashboard/inventory auto-updates, /dashboard/sales logs sale"
      ]
    });

  } catch (e) {
    console.error("[WhatsApp Admin Setup] Error", e);
    return NextResponse.json({ error: "Setup failed", details: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== (process.env.ADMIN_SETUP_KEY || "biztriach_admin_2026_setup") && secret !== "biztriach_verify" && secret !== process.env.WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const accounts = await findDocs<any>(COL.whatsappAccounts, {});
    const withOrgs = await Promise.all(
      accounts.map(async (a) => ({
        ...a,
        organization: a.organizationId ? await getDoc(COL.organizations, a.organizationId) : null,
      }))
    );
    return NextResponse.json({
      totalConnected: withOrgs.length,
      accounts: withOrgs.map(a => ({
        organizationId: a.organizationId,
        organizationName: a.organization?.name,
        phoneNumberId: a.phoneNumberId,
        businessAccountId: a.businessAccountId,
        isConnected: a.isConnected,
        verifyToken: a.verifyToken,
        webhookUrl: a.webhookUrl,
        autoReply: a.autoReply,
        businessParsing: a.businessParsing,
        createdAt: a.createdAt
      })),
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://supportai-sigma.vercel.app"}/api/whatsapp/webhook`,
      verifyToken: "biztriach_verify",
      anyNumberReady: true
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
