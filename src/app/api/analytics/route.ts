export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, getDoc, findDocs, countDocs } from "@/lib/firestore";

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

    // 1. Fetch historical analytics records
    const history = await findDocs<any>(COL.analytics, {
      where: [["chatbotId", "==", chatbotId]],
      orderBy: [["date", "asc"]],
      limit: 30, // Last 30 days
    });

    // 2. Fetch all conversations to aggregate metrics
    const conversations = await findDocs<any>(COL.conversations, {
      where: [["chatbotId", "==", chatbotId]],
    });

    const totalConversations = conversations.length;
    let totalMessages = 0;
    let ratedCount = 0;
    let sumRating = 0;

    // Count messages per conversation (replaces Prisma's _count include)
    const messageCounts = await Promise.all(
      conversations.map(c => countDocs(COL.messages, { where: [["conversationId", "==", c.id]] }))
    );
    conversations.forEach((c, i) => {
      totalMessages += messageCounts[i];
      if (c.rating) {
        ratedCount++;
        sumRating += c.rating;
      }
    });

    // Average rating
    const averageRating = ratedCount > 0 ? Number((sumRating / ratedCount).toFixed(1)) : 4.5; // default fallback demo

    // 3. Extract top asked questions (frequently occurring user messages)
    // Two-step join: conversations of this chatbot -> their user messages
    const convIds = conversations.map(c => c.id);
    const userMessages: { content: string }[] = [];
    for (let i = 0; i < convIds.length; i += 10) {
      const slice = convIds.slice(i, i + 10);
      const msgs = await findDocs<any>(COL.messages, {
        where: [["conversationId", "in", slice], ["sender", "==", "USER"]],
        limit: 100,
      });
      userMessages.push(...msgs.map(m => ({ content: m.content })));
      if (userMessages.length >= 100) break;
    }
    const limitedMessages = userMessages.slice(0, 100);

    // Simple frequency grouping of queries
    const questionFrequencies: Record<string, number> = {};
    for (const msg of limitedMessages) {
      const clean = msg.content
        .toLowerCase()
        .trim()
        .replace(/[?.]/g, "");

      if (clean.length < 5) continue;

      // Group similar questions
      let foundGroup = false;
      for (const existingQuery in questionFrequencies) {
        // Simple word overlap checker
        const existingWords = existingQuery.split(" ");
        const currentWords = clean.split(" ");
        const overlap = currentWords.filter(w => existingWords.includes(w) && w.length > 3);
        if (overlap.length >= 2 || clean.includes(existingQuery) || existingQuery.includes(clean)) {
          questionFrequencies[existingQuery]++;
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        questionFrequencies[clean] = 1;
      }
    }

    const topQuestions = Object.entries(questionFrequencies)
      .map(([question, count]) => ({
        question: question.charAt(0).toUpperCase() + question.slice(1) + "?",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Provide default mockup top questions if database is brand new
    if (topQuestions.length === 0) {
      topQuestions.push(
        { question: "What is your refund policy?", count: 12 },
        { question: "How do I hook up the widget script?", count: 8 },
        { question: "Do you have custom pricing for enterprise?", count: 5 },
        { question: "How does the AI training work?", count: 3 }
      );
    }

    // Default trend data if history is empty
    const trendData = history.map(h => ({
      date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      conversations: h.conversationsCount,
      messages: h.messagesCount,
    }));

    if (trendData.length === 0) {
      // Mock history for dashboard visuals
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        trendData.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          conversations: Math.floor(Math.random() * 8) + 2,
          messages: Math.floor(Math.random() * 20) + 10,
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalConversations,
        totalMessages,
        averageRating,
        avgResponseTimeSec: totalConversations > 0 ? 12 : 0, // Mocked response speed (12 seconds)
        accuracyRate: 94, // Mock metric representing AI confidence
      },
      trend: trendData,
      topQuestions,
    });
  } catch (error) {
    console.error("Error loading analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
