export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { encryptKey } from "@/lib/apiKeys";
import { COL, findUniqueBy, createDoc, updateDocData } from "@/lib/firestore";
import { randomBytes } from "crypto";

/**
 * Meta WhatsApp Embedded Signup — server side.
 *
 * GET  → configuration status for the dashboard checklist UI
 * POST → { code } exchange the Embedded Signup code for a business token,
 *        discover the new WABA + phone number, subscribe webhooks, and
 *        save the account for this organization. No copy-pasting needed.
 *
 * Required env vars:
 *   NEXT_PUBLIC_FB_APP_ID   — the Meta app id
 *   META_APP_SECRET         — the Meta app secret (server-only)
 *   NEXT_PUBLIC_ES_CONFIG_ID — the Embedded Signup config id from
 *                              Facebook Login for Business (Meta dashboard)
 */

const GRAPH = "https://graph.facebook.com/v20.0";
const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || "1499843165493946";

function appToken(): string | null {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return null;
  return `${FB_APP_ID}|${secret}`;
}

/** The redirect URI must exactly match what is configured in Facebook Login
 *  settings. Prefer the origin the customer is actually browsing. */
function redirectUriFrom(req: Request): string {
  try {
    const url = new URL(req.url);
    if (url.hostname.includes("vercel.app") || process.env.NEXT_PUBLIC_APP_URL === undefined) {
      return url.origin + "/";
    }
  } catch {}
  return (process.env.NEXT_PUBLIC_APP_URL || "https://biztriach.vercel.app") + "/";
}

export async function GET(req: Request) {
  const appId = FB_APP_ID;
  const hasSecret = !!process.env.META_APP_SECRET;
  const configId = process.env.NEXT_PUBLIC_ES_CONFIG_ID || null;
  const redirectUri = redirectUriFrom(req);
  return NextResponse.json({
    appId,
    hasSecret,
    configId,
    configured: !!(appId && hasSecret && configId),
    redirectUri,
  });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = FB_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json(
      { error: "Server not configured: META_APP_SECRET missing on Vercel. Add it in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 503 }
    );
  }
  const redirectUri = redirectUriFrom(req);

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing signup code" }, { status: 400 });
    }

    // 1. Exchange the code for a business access token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[ES] token exchange failed:", JSON.stringify(tokenData).slice(0, 300));
      return NextResponse.json(
        { error: "Could not exchange signup code. It may have expired — please try connecting again.", details: tokenData },
        { status: 400 }
      );
    }
    const businessToken = tokenData.access_token as string;

    // 2. Discover the WABA via granular scopes on the new token
    const debugRes = await fetch(
      `${GRAPH}/debug_token?input_token=${encodeURIComponent(businessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`
    );
    const debugData = await debugRes.json();
    const scopes: Array<{ scope: string; target_ids?: string[] }> =
      debugData?.data?.granular_scopes || [];

    const wabaIds: string[] = [];
    for (const s of scopes) {
      if (
        (s.scope === "whatsapp_business_management" ||
          s.scope === "whatsapp_business_messaging") &&
        Array.isArray(s.target_ids)
      ) {
        for (const tid of s.target_ids) {
          if (!wabaIds.includes(tid)) wabaIds.push(tid);
        }
      }
    }

    if (wabaIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Signup completed but no WhatsApp Business Account was shared with the app. During the Meta popup, make sure you select/create a WhatsApp Business Account and register a phone number.",
        },
        { status: 400 }
      );
    }

    // 3. Find the phone number on the (first) WABA
    let phoneId: string | null = null;
    let displayPhone = "";
    let wabaId = wabaIds[0];
    for (const wid of wabaIds) {
      const phonesRes = await fetch(
        `${GRAPH}/${wid}/phone_numbers?access_token=${encodeURIComponent(businessToken)}`
      );
      const phonesData = await phonesRes.json();
      const phones = phonesData?.data || [];
      if (phones.length > 0) {
        wabaId = wid;
        phoneId = phones[0].id;
        displayPhone = phones[0].display_phone_number || "";
        break;
      }
    }

    if (!phoneId) {
      return NextResponse.json(
        {
          error:
            "Your WhatsApp Business Account has no phone number registered yet. Open the Meta popup again and complete the phone registration step (you'll get an SMS code).",
        },
        { status: 400 }
      );
    }

    // 4. Subscribe our app to the WABA so messages hit our webhook
    try {
      const subRes = await fetch(
        `${GRAPH}/${wabaId}/subscribed_apps?access_token=${encodeURIComponent(businessToken)}`,
        { method: "POST", body: new URLSearchParams({ subscribed_fields: "messages" }) }
      );
      const subData = await subRes.json();
      console.log("[ES] subscribed_apps:", JSON.stringify(subData).slice(0, 200));
    } catch (e) {
      console.warn("[ES] subscribe failed (can retry later):", e);
    }

    // 5. Save the account for this organization
    const verifyToken = randomBytes(12).toString("hex");
    const existing = await findUniqueBy<any>(
      COL.whatsappAccounts,
      "organizationId",
      user.organizationId
    );

    const payload = {
      organizationId: user.organizationId,
      phoneNumberId: phoneId,
      businessAccountId: wabaId,
      accessToken: encryptKey(businessToken),
      verifyToken,
      autoReply: true,
      businessParsing: true,
      isConnected: true,
      displayPhone,
      source: "embedded_signup",
      connectedAt: new Date().toISOString(),
    };

    if (existing) {
      await updateDocData(COL.whatsappAccounts, existing.id, payload);
    } else {
      await createDoc(COL.whatsappAccounts, payload);
    }

    return NextResponse.json({
      connected: true,
      phone: displayPhone,
      wabaId,
      phoneId,
    });
  } catch (e: any) {
    console.error("[ES] critical error", e);
    return NextResponse.json(
      { error: "Embedded signup failed: " + (e?.message || "unknown error") },
      { status: 500 }
    );
  }
}
