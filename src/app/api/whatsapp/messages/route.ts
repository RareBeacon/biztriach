export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { parseBusinessMessage } from "@/lib/businessParser";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const messages = await prisma.whatsAppMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take: 200 });
    return NextResponse.json(messages);
  }

  const conversations = await prisma.whatsAppConversation.findMany({
    where: { organizationId: user.organizationId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { conversationId, content, phoneNumber } = await req.json();
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    let convId = conversationId;
    if (!convId && phoneNumber) {
      const conv = await prisma.whatsAppConversation.findFirst({ where: { organizationId: user.organizationId, phoneNumber } });
      if (conv) convId = conv.id;
    }

    if (!convId) return NextResponse.json({ error: "Conversation required" }, { status: 400 });

    // Business parsing for outbound too (in case owner sends business op)
    const parsed = parseBusinessMessage(content);
    const isBusinessOp = parsed.type !== "UNKNOWN" && parsed.confidence > 0.5;

    const msg = await prisma.whatsAppMessage.create({
      data: { conversationId: convId, direction: "OUTBOUND", type: "text", content, isBusinessOp, parsedData: isBusinessOp ? JSON.stringify(parsed) : null }
    });

    await prisma.whatsAppConversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

    // TODO: Send via WhatsApp Cloud API if connected

    return NextResponse.json(msg);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
