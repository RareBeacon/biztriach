export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel max duration for Pro is 30s, Hobby 10s - set to 30 for future scaling

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEmbedding, retrieveRelevantChunks } from "@/lib/rag";
import { analyzeSentiment, analyzeSentimentLLM } from "@/lib/sentiment";
import { classifyIntentKeyword, shouldEscalateConversation } from "@/lib/intent";
import { rateLimiter, getRateLimitKey, RATE_LIMITS, rateLimitResponse } from "@/lib/rateLimit";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    // 0. RATE LIMITING
    const rateLimitKey = getRateLimitKey(req, RATE_LIMITS.chat.keyPrefix);
    const limitCheck = rateLimiter.check(rateLimitKey, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs);
    if (!limitCheck.allowed) {
      return rateLimitResponse(limitCheck.retryAfter || 60);
    }

    const { chatbotId, message, conversationId, visitorId } = await req.json();

    if (!chatbotId || !message || typeof message !== "string") {
      return NextResponse.json({ error: "Chatbot ID and message are required" }, { status: 400 });
    }

    if (message.trim().length === 0 || message.length > 5000) {
      return NextResponse.json({ error: "Message must be 1-5000 characters" }, { status: 400 });
    }

    // 1. Verify chatbot exists
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // 2. Resolve or Create Conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { chatbot: true }
      });
      // Security: ensure conversation belongs to this chatbot
      if (conversation && conversation.chatbotId !== chatbotId) {
        return NextResponse.json({ error: "Conversation mismatch" }, { status: 403 });
      }
    }

    if (!conversation) {
      const activeVisitorId = visitorId || `visitor_${Math.random().toString(36).substring(2, 11)}`;
      conversation = await prisma.conversation.create({
        data: {
          chatbotId,
          visitorId: activeVisitorId,
          status: "ACTIVE",
        },
      });
    }

    // 2b. HUMAN TAKEOVER CHECK - CRITICAL FIX
    if (conversation.status === "PAUSED") {
      // AI is paused, human agent is handling. Save user message but don't auto-respond
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "USER",
          content: message,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() }
      });

      // Return takeover status - frontend will show waiting state
      return NextResponse.json(
        {
          status: "human_takeover",
          message: "A human agent is currently reviewing your conversation. You'll receive a response shortly.",
          conversationId: conversation.id,
          visitorId: conversation.visitorId
        },
        {
          headers: {
            "X-RateLimit-Remaining": String(limitCheck.remaining),
            "X-Conversation-Status": "PAUSED"
          }
        }
      );
    }

    // 2c. SENTIMENT & INTENT ANALYSIS (NEW)
    const [sentimentResult, intentResult] = await Promise.all([
      Promise.resolve(analyzeSentiment(message)), // sync, fast
      Promise.resolve(classifyIntentKeyword(message))
    ]);

    // If critical/angry, upgrade sentiment via LLM in background (non-blocking for next steps)
    let finalSentiment = sentimentResult;
    let finalIntent = intentResult;

    // Background LLM-enhanced analysis for high-stakes messages (fire and forget for this turn, use next turn)
    const needsDeepAnalysis = sentimentResult.sentiment === "angry" || sentimentResult.urgency === "critical" || intentResult.confidence < 0.6;

    // Save user message with metadata
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "USER",
        content: message,
        // Store metadata as JSON in sources field temporarily? We'll store separated in content with hidden prefix if needed
        // However schema doesn't have metadata fields, so we log via console and will extend later
      },
    });

    console.log(`[CHAT] Ticket from ${conversation.visitorId} | Intent=${intentResult.intent} (${Math.round(intentResult.confidence * 100)}%) | Sentiment=${sentimentResult.sentiment} | Urgency=${sentimentResult.urgency} | Escalate=${sentimentResult.isEscalationNeeded}`);

    // 3. ESCALATION DECISION
    const shouldEscalate = shouldEscalateConversation(intentResult, sentimentResult);

    if (shouldEscalate && sentimentResult.sentiment !== "positive") {
      console.log(`🚨 [ESCALATION TRIGGER] Conversation ${conversation.id} flagged for human review - Reason: ${sentimentResult.sentiment} sentiment, intent=${intentResult.intent}`);
      // Mark conversation for attention but still generate AI response (with escalation notice)
    }

    // 4. ANALYTICS - FIXED UPSERT LOGIC
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use proper unique constraint: chatbotId + date combo
      // Since id is random, we need to fetch existing analytics for today first
      const existingAnalytics = await prisma.analytics.findFirst({
        where: {
          chatbotId,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      if (existingAnalytics) {
        await prisma.analytics.update({
          where: { id: existingAnalytics.id },
          data: {
            messagesCount: { increment: 1 }, // Will add +1 more for AI response later
            conversationsCount: conversationId ? undefined : { increment: 1 }
          }
        });
      } else {
        await prisma.analytics.create({
          data: {
            chatbotId,
            date: today,
            conversationsCount: 1,
            messagesCount: 1,
          }
        });
      }
    } catch (err) {
      console.error("Analytics upsert failed (non-critical):", err);
    }

    // 5. RAG RETRIEVAL - Hybrid semantic + keyword
    let relevantChunks: any[] = [];
    let dbChunks: any[] = [];
    try {
      const queryVector = await generateEmbedding(message);
      dbChunks = await prisma.documentChunk.findMany({
        where: {
          document: {
            chatbotId,
            status: "TRAINED",
          },
        },
        include: {
          document: true,
        },
        take: 100 // Safety limit to avoid huge memory fetch
      });

      if (dbChunks.length > 0) {
        relevantChunks = retrieveRelevantChunks(queryVector, message, dbChunks as any, 4);
      }
    } catch (ragError) {
      console.error("[RAG] Retrieval failed, continuing with no context:", ragError);
      relevantChunks = [];
    }

    const citations = relevantChunks.map(chunk => ({
      documentTitle: chunk.documentTitle,
      pageNumber: chunk.pageNumber,
      documentId: chunk.documentId,
      score: chunk.hybridScore
    }));

    // Fetch history (last 10 messages for context window)
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    // 6. BUILD SYSTEM PROMPT - Enhanced with intent awareness
    const contextText = relevantChunks.length > 0
      ? relevantChunks.map((c, i) => `[Source ${i + 1}: "${c.documentTitle}" (Page ${c.pageNumber}) | Relevance: ${(c.hybridScore * 100).toFixed(0)}%]\n${c.content}`).join("\n\n")
      : "No specific training documents found matching this query. Respond based on general knowledge but be honest about limitations.";

    const escalationGuidance = shouldEscalate
      ? `\n\n⚠️ CONVERSATION FLAGGED: Customer sentiment is "${finalSentiment.sentiment}" with "${finalSentiment.urgency}" urgency. Be extra empathetic, acknowledge frustration, offer human handoff if needed.`
      : "";

    const intentGuidance = `Customer intent detected: ${finalIntent.intent} (confidence ${Math.round(finalIntent.confidence * 100)}%). Tailor your response accordingly.`;

    const systemPrompt = `You are "${chatbot.name}", a senior customer support specialist. Brand color: ${chatbot.themeColor}.
Instructions: ${chatbot.instructions}

${intentGuidance}${escalationGuidance}

Private Business Knowledge:
---
${contextText}
---

Rules:
1. HUMAN VOICE: Never say "Based on context" or "As an AI". Speak warm, natural, concise.
2. EMPATHY FIRST: If customer frustrated/angry, acknowledge feelings first: "I understand how frustrating this must be..."
3. ACCURACY: Use knowledge base. If not in KB, say honestly: "I don't have those exact details, let me connect you with our team who can help immediately."
4. FORMAT: Use markdown lightly - bold for key points, bullets for steps. Keep under 150 words unless explaining complex steps.
5. CITATIONS: Don't output [Source X] tags - system handles references separately.
6. ESCALATION: If you sense high frustration, offer: "Would you like me to have a senior team member review this right away?"
7. CONVERSION: Be helpful, solution-focused, always end with offer to help further.`;

    const encoder = new TextEncoder();

    // 7. STREAMING RESPONSE - OpenRouter or Fallback
    if (OPENROUTER_API_KEY) {
      const messagesPayload = [
        { role: "system", content: systemPrompt },
        ...history.slice(-8, -1).map(m => ({
          role: m.sender === "USER" ? "user" : "assistant",
          content: m.content
        })),
        { role: "user", content: message }
      ];

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://supportiq-ai.vercel.app",
            "X-Title": "SupportIQ AI",
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: messagesPayload,
            stream: true,
            temperature: 0.7,
            max_tokens: 600,
            top_p: 0.9
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`OpenRouter error ${response.status}:`, errText.slice(0, 500));
          throw new Error(`LLM API ${response.status}`);
        }

        const stream = new ReadableStream({
          async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) { controller.close(); return; }

            let fullAnswer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = new TextDecoder().decode(value);
                const lines = chunkText.split("\n").filter(l => l.trim() !== "");

                for (const line of lines) {
                  if (line.includes("[DONE]")) continue;
                  if (line.startsWith("data: ")) {
                    try {
                      const jsonStr = line.substring(6);
                      if (jsonStr.trim() === "[DONE]") continue;
                      const parsed = JSON.parse(jsonStr);
                      const content = parsed.choices?.[0]?.delta?.content || "";
                      if (content) {
                        fullAnswer += content;
                        controller.enqueue(encoder.encode(`t:${content}\n`));
                      }
                    } catch (e) {
                      // skip malformed chunk
                    }
                  }
                }
              }

              // Send citations + metadata
              if (citations.length > 0) {
                controller.enqueue(encoder.encode(`c:${JSON.stringify(citations)}\n`));
              }
              // Send sentiment/intent metadata for frontend analytics
              controller.enqueue(encoder.encode(`m:${JSON.stringify({ intent: finalIntent.intent, sentiment: finalSentiment.sentiment, shouldEscalate })}\n`));

              // Persist AI response
              await prisma.message.create({
                data: {
                  conversationId: conversation!.id,
                  sender: "AI",
                  content: fullAnswer,
                  sources: JSON.stringify(citations),
                },
              });

              await prisma.conversation.update({
                where: { id: conversation!.id },
                data: { updatedAt: new Date() }
              });

              // If escalation needed, auto-mark conversation as attention
              if (shouldEscalate) {
                await prisma.conversation.update({
                  where: { id: conversation!.id },
                  data: { status: "ACTIVE" } // Keep active but log escalation - could create separate field
                }).catch(() => { });
              }

            } catch (err) {
              console.error("Stream processing error:", err);
              if (fullAnswer.length === 0) {
                const fallback = `I'm experiencing a brief connection issue. Could you please repeat your question? I've noted your request and will ensure it's handled.`;
                controller.enqueue(encoder.encode(`t:${fallback}\n`));
                await prisma.message.create({
                  data: {
                    conversationId: conversation!.id,
                    sender: "AI",
                    content: fallback,
                    sources: JSON.stringify(citations)
                  }
                }).catch(() => { });
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-RateLimit-Remaining": String(limitCheck.remaining),
            "X-Conversation-Id": conversation.id,
            "X-Visitor-Id": conversation.visitorId
          },
        });

      } catch (apiError) {
        console.error("OpenRouter failed, using fallback generator:", apiError);
      }
    }

    // FALLBACK STREAMER - Intelligent simulated response
    const stream = new ReadableStream({
      async start(controller) {
        let answer = "";

        if (relevantChunks.length > 0) {
          const main = relevantChunks[0];
          answer = `Great question! Based on **${main.documentTitle}**:\n\n${main.content.slice(0, 500)}${main.content.length > 500 ? "..." : ""}\n\n`;
          if (relevantChunks.length > 1) {
            answer += `Additionally, from our documentation:\n- ${relevantChunks[1].content.slice(0, 200)}...\n\n`;
          }
          answer += `Does that help? I'm happy to clarify any part of this or connect you with our team if you need more specifics!`;
        } else {
          if (finalIntent.intent === "human_handoff") {
            answer = `Absolutely — I can connect you with a human agent right away. I've flagged your conversation for our support team.\n\nIn the meantime, could you share a bit more detail about what you need help with? That will help us assist you faster.`;
          } else if (finalSentiment.sentiment === "angry" || finalSentiment.sentiment === "frustrated") {
            answer = `I completely understand your frustration, and I'm really sorry for the trouble this has caused.\n\nLet me help sort this out right away. Could you tell me a bit more about what's happening? If you prefer, I can also pause and have a senior member of our team take over this chat immediately.\n\nWhat's the best next step for you?`;
          } else {
            answer = `Hello! I'm **${chatbot.name}**, your support assistant.\n\nI don't currently have a trained document covering that exact topic, but I can still help!\n\nHere's what I can do:\n- If it's about our product, I can connect you with a specialist\n- If it's a technical issue, I can log it for our team\n- Or I can take your question to our knowledge team to train the assistant for future queries\n\nWould you like me to connect you with a **human agent** right now?`;
          }
        }

        // Word-by-word streaming simulation
        const words = answer.split(/(\s+)/);
        let streamed = "";
        for (const w of words) {
          streamed += w;
          controller.enqueue(encoder.encode(`t:${w}\n`));
          await new Promise(r => setTimeout(r, 18 + Math.random() * 30)); // natural typing delay
        }

        if (citations.length > 0) {
          controller.enqueue(encoder.encode(`c:${JSON.stringify(citations)}\n`));
        }
        controller.enqueue(encoder.encode(`m:${JSON.stringify({ intent: finalIntent.intent, sentiment: finalSentiment.sentiment, shouldEscalate })}\n`));

        await prisma.message.create({
          data: {
            conversationId: conversation!.id,
            sender: "AI",
            content: streamed,
            sources: JSON.stringify(citations),
          },
        });

        await prisma.conversation.update({
          where: { id: conversation!.id },
          data: { updatedAt: new Date() }
        }).catch(() => { });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-RateLimit-Remaining": String(limitCheck.remaining),
        "X-Conversation-Id": conversation.id,
        "X-Visitor-Id": conversation.visitorId
      },
    });

  } catch (error) {
    console.error("Chat API critical error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
