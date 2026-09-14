export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, createDoc } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chatbots = await findDocs(COL.chatbots, {
      where: [["organizationId", "==", user.organizationId]],
      orderBy: [["createdAt", "desc"]],
    });
    return NextResponse.json(chatbots);
  } catch (error) {
    console.error("Error fetching chatbots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, instructions, greetingMessage, themeColor, suggestions } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const chatbot = await createDoc(COL.chatbots, {
      name,
      organizationId: user.organizationId,
      instructions: instructions || "You are a customer support AI assistant. Assist users with questions using the provided knowledge base.",
      greetingMessage: greetingMessage || "Hello! How can I help you today?",
      themeColor: themeColor || "#2563eb",
      suggestions: suggestions || JSON.stringify(["What services do you offer?", "How do I contact support?"]),
      personality: null,
      welcomeDelayMs: 2500,
      enableSound: true,
      enableCsat: true,
      enableHumanTakeover: true,
      deploymentChannels: '["website"]',
    });

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
