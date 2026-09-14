export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, getDoc, createDoc, updateDocData, findDocs } from "@/lib/firestore";

/** Two-hop ownership check: conversation -> chatbot -> organization. */
async function getOwnedConversation(conversationId: string, organizationId: string | null | undefined) {
  const conversation = await getDoc<any>(COL.conversations, conversationId);
  if (!conversation) return null;
  const chatbot = await getDoc<any>(COL.chatbots, conversation.chatbotId);
  if (!chatbot || chatbot.organizationId !== organizationId) return null;
  return conversation;
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatbotId = searchParams.get("chatbotId");

  if (!chatbotId) {
    return NextResponse.json({ error: "Chatbot ID is required" }, { status: 400 });
  }

  try {
    // Verify chatbot ownership
    const chatbot = await getDoc(COL.chatbots, chatbotId);
    if (!chatbot || chatbot.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    const conversations = await findDocs(COL.conversations, {
      where: [["chatbotId", "==", chatbotId]],
      orderBy: [["updatedAt", "desc"]],
    });

    // Attach messages per conversation (replaces Prisma include)
    const withMessages = await Promise.all(
      conversations.map(async (conv: any) => ({
        ...conv,
        messages: await findDocs(COL.messages, {
          where: [["conversationId", "==", conv.id]],
          orderBy: [["createdAt", "asc"]],
        }),
      }))
    );

    return NextResponse.json(withMessages);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, status, rating } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Verify conversation belongs to chatbot owned by user's organization
    const conversation = await getOwnedConversation(conversationId, user.organizationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
    }

    const updated = await updateDocData(COL.conversations, conversationId, {
      status: status !== undefined ? status : conversation.status,
      rating: rating !== undefined ? rating : conversation.rating,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json({ error: "Conversation ID and message content are required" }, { status: 400 });
    }

    // Verify ownership
    const conversation = await getOwnedConversation(conversationId, user.organizationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
    }

    // Save human agent response
    const agentMsg = await createDoc(COL.messages, {
      conversationId,
      sender: "AGENT",
      content: message,
      tokenCount: 0,
      responseTimeMs: 0,
      channel: "website",
    });

    // Make sure status is active or paused (takeover)
    await updateDocData(COL.conversations, conversationId, {});

    return NextResponse.json(agentMsg);
  } catch (error) {
    console.error("Error posting agent message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
