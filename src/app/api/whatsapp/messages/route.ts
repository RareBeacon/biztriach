export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { parseBusinessMessage } from "@/lib/businessParser";
import { COL, findDocs, createDoc, updateDocData } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const messages = await findDocs(COL.whatsappMessages, {
      where: [["conversationId", "==", conversationId]],
      orderBy: [["createdAt", "asc"]],
      limit: 200,
    });
    return NextResponse.json(messages);
  }

  const conversations = await findDocs<any>(COL.whatsappConversations, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["updatedAt", "desc"]],
    limit: 100,
  });

  // Attach latest message per conversation (replaces Prisma include with take: 1)
  const withMessages = await Promise.all(
    conversations.map(async (conv) => {
      const msgs = await findDocs(COL.whatsappMessages, {
        where: [["conversationId", "==", conv.id]],
        orderBy: [["createdAt", "desc"]],
        limit: 1,
      });
      return { ...conv, messages: msgs };
    })
  );
  return NextResponse.json(withMessages);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { conversationId, content, phoneNumber } = await req.json();
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    let convId = conversationId;
    if (!convId && phoneNumber) {
      const convs = await findDocs(COL.whatsappConversations, {
        where: [["organizationId", "==", user.organizationId], ["phoneNumber", "==", phoneNumber]],
        limit: 1,
      });
      if (convs[0]) convId = convs[0].id;
    }

    if (!convId) return NextResponse.json({ error: "Conversation required" }, { status: 400 });

    // Business parsing for outbound too (in case owner sends business op)
    const parsed = parseBusinessMessage(content);
    const isBusinessOp = parsed.type !== "UNKNOWN" && parsed.confidence > 0.5;

    const msg = await createDoc(COL.whatsappMessages, {
      conversationId: convId,
      direction: "OUTBOUND",
      type: "text",
      content,
      isBusinessOp,
      parsedData: isBusinessOp ? JSON.stringify(parsed) : null,
      aiResponse: null,
    });

    await updateDocData(COL.whatsappConversations, convId, {});

    // TODO: Send via WhatsApp Cloud API if connected

    return NextResponse.json(msg);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
