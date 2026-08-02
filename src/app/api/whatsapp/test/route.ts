export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { decryptKey } from "@/lib/apiKeys";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { to, message } = await req.json();
    if (!to || !message) return NextResponse.json({ error: "to and message required" }, { status: 400 });

    const account = await prisma.whatsAppAccount.findUnique({ where: { organizationId: user.organizationId } });
    if (!account || !account.phoneNumberId || !account.accessToken) {
      return NextResponse.json({ error: "WhatsApp account not connected. Please connect in /dashboard/whatsapp" }, { status: 400 });
    }

    const token = decryptKey(account.accessToken);
    const phoneNumberId = account.phoneNumberId;

    const cleanTo = to.replace(/[^0-9]/g, "");

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "text",
        text: { body: message }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp Test] Send failed", data);
      return NextResponse.json({ error: "Failed to send via WhatsApp API", details: data }, { status: 400 });
    }

    // Save as outbound message
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { organizationId: user.organizationId, phoneNumber: cleanTo }
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: { organizationId: user.organizationId, phoneNumber: cleanTo, customerName: to, status: "ACTIVE" }
      });
    }

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        type: "text",
        content: message
      }
    });

    return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id, data });

  } catch (e) {
    console.error("[WhatsApp Test] Error", e);
    return NextResponse.json({ error: "Internal error", details: (e as Error).message }, { status: 500 });
  }
}
