export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  COL,
  getDoc,
  updateDocData,
  deleteManyDocs,
  deleteDocById,
  findDocs,
} from "@/lib/firestore";

/** Verify a chatbot exists and belongs to the caller's organization. */
async function getOwnedChatbot(chatbotId: string, organizationId: string | null | undefined) {
  const chatbot = await getDoc(COL.chatbots, chatbotId);
  if (!chatbot || chatbot.organizationId !== organizationId) return null;
  return chatbot;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chatbot = await getOwnedChatbot(params.id, user.organizationId);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    const { name, instructions, greetingMessage, themeColor, suggestions } = await req.json();

    const updatedChatbot = await updateDocData(COL.chatbots, params.id, {
      name: name !== undefined ? name : chatbot.name,
      instructions: instructions !== undefined ? instructions : chatbot.instructions,
      greetingMessage: greetingMessage !== undefined ? greetingMessage : chatbot.greetingMessage,
      themeColor: themeColor !== undefined ? themeColor : chatbot.themeColor,
      suggestions: suggestions !== undefined ? suggestions : chatbot.suggestions,
    });

    return NextResponse.json(updatedChatbot);
  } catch (error) {
    console.error("Error updating chatbot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatbotId = params.id;

  try {
    const chatbot = await getOwnedChatbot(chatbotId, user.organizationId);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    // Cascade delete (replaces Prisma onDelete: Cascade):
    // documents -> chunks, conversations -> messages, analytics, knowledge gaps
    const documents = await findDocs<{ id: string }>(COL.documents, {
      where: [["chatbotId", "==", chatbotId]],
    });
    for (const doc of documents) {
      await deleteManyDocs(COL.documentChunks, { where: [["documentId", "==", doc.id]] });
    }
    await deleteManyDocs(COL.documents, { where: [["chatbotId", "==", chatbotId]] });

    const conversations = await findDocs<{ id: string }>(COL.conversations, {
      where: [["chatbotId", "==", chatbotId]],
    });
    for (const conv of conversations) {
      await deleteManyDocs(COL.messages, { where: [["conversationId", "==", conv.id]] });
    }
    await deleteManyDocs(COL.conversations, { where: [["chatbotId", "==", chatbotId]] });

    await deleteManyDocs(COL.analytics, { where: [["chatbotId", "==", chatbotId]] });
    await deleteManyDocs(COL.knowledgeGaps, { where: [["chatbotId", "==", chatbotId]] });

    await deleteDocById(COL.chatbots, chatbotId);

    return NextResponse.json({ success: true, message: "Chatbot deleted successfully" });
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
