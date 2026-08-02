export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseBusinessMessage } from "@/lib/businessParser";
import { generateEmbedding, retrieveRelevantChunks } from "@/lib/rag";
import { decryptKey } from "@/lib/apiKeys";

const VERIFY_TOKEN_FALLBACK = "biztriach_verify";

// GET - Webhook verification from Meta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Allow any org's verify token
  if (mode === "subscribe") {
    const accounts = await prisma.whatsAppAccount.findMany();
    const validTokens = accounts.map(a => a.verifyToken).filter(Boolean);
    validTokens.push(VERIFY_TOKEN_FALLBACK);
    validTokens.push(process.env.WHATSAPP_VERIFY_TOKEN || "");

    if (validTokens.includes(token || "")) {
      console.log("[WhatsApp] Webhook verified");
      return new NextResponse(challenge || "", { status: 200 });
    }
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST - Inbound messages
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[WhatsApp] Inbound webhook:", JSON.stringify(body).slice(0, 1000));

    // Meta Cloud API structure
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    const contacts = value?.contacts;

    if (!messages || messages.length === 0) {
      // Could be status update
      return NextResponse.json({ status: "ok" });
    }

    for (const msg of messages) {
      const from = msg.from; // customer phone
      const text = msg.text?.body || msg.button?.text || "";
      const type = msg.type || "text";
      if (!text) continue;

      // Find organization by phoneNumberId
      const phoneNumberId = value.metadata?.phone_number_id;
      let account = null;
      if (phoneNumberId) {
        account = await prisma.whatsAppAccount.findFirst({ where: { phoneNumberId } });
      }
      if (!account) {
        account = await prisma.whatsAppAccount.findFirst({ where: { isConnected: true } });
      }
      if (!account) continue;

      const orgId = account.organizationId;

      // Find or create conversation
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: { organizationId: orgId, phoneNumber: from },
        orderBy: { updatedAt: "desc" }
      });

      if (!conversation) {
        const contactName = contacts?.[0]?.profile?.name || from;
        conversation = await prisma.whatsAppConversation.create({
          data: { organizationId: orgId, phoneNumber: from, customerName: contactName, status: "ACTIVE" }
        });
      }

      // Parse business operation
      let isBusinessOp = false;
      let parsedData = null;

      if (account.businessParsing) {
        const parsed = parseBusinessMessage(text);
        if (parsed.type !== "UNKNOWN" && parsed.confidence > 0.5) {
          isBusinessOp = true;
          parsedData = parsed;

          // Auto-process business ops
          try {
            await processBusinessOperation(orgId, parsed, from);
          } catch (e) {
            console.error("[WhatsApp] Business op processing failed", e);
          }
        }
      }

      // Save inbound message
      const inboundMsg = await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "INBOUND",
          type,
          content: text,
          isBusinessOp,
          parsedData: parsedData ? JSON.stringify(parsedData) : null
        }
      });

      // Generate AI reply if autoReply enabled and not business op (or even if business op, confirm)
      if (account.autoReply) {
        try {
          const aiReply = await generateWhatsAppAIReply(orgId, text, conversation.id);
          
          // Save outbound
          await prisma.whatsAppMessage.create({
            data: {
              conversationId: conversation.id,
              direction: "OUTBOUND",
              type: "text",
              content: aiReply,
              aiResponse: aiReply
            }
          });

          // Send via Meta API
          if (account.accessToken && account.phoneNumberId) {
            const token = decryptKey(account.accessToken);
            await sendWhatsAppMessage(account.phoneNumberId, token, from, aiReply);
          }

          // Update conversation
          await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

        } catch (aiError) {
          console.error("[WhatsApp] AI reply failed", aiError);
        }
      } else {
        await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("[WhatsApp] Webhook error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function processBusinessOperation(orgId: string, parsed: any, customerPhone: string) {
  if (parsed.type === "SALE") {
    // Find or product
    let product = await prisma.product.findFirst({ where: { organizationId: orgId, name: { contains: parsed.productName || "", mode: "insensitive" } } });
    if (!product && parsed.productName) {
      product = await prisma.product.create({
        data: { organizationId: orgId, name: parsed.productName, sellingPrice: parsed.unitPrice || 0, costPrice: (parsed.unitPrice || 0) * 0.8, quantity: 100 }
      });
    }

    const saleNumber = `WA-${Date.now()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
    await prisma.sale.create({
      data: {
        organizationId: orgId,
        saleNumber,
        totalAmount: parsed.totalAmount || 0,
        profit: parsed.totalAmount ? parsed.totalAmount * 0.2 : 0,
        channel: "whatsapp",
        paymentMethod: parsed.paymentMethod || "cash",
        notes: `WhatsApp: ${parsed.rawText}`,
        items: {
          create: [{
            productId: product?.id || null,
            productName: product?.name || parsed.productName || "Product",
            quantity: parsed.quantity || 1,
            unitPrice: parsed.unitPrice || 0,
            totalPrice: parsed.totalAmount || 0,
            profit: parsed.totalAmount ? parsed.totalAmount * 0.2 : 0
          }]
        }
      }
    });

    if (product && parsed.quantity) {
      await prisma.product.update({ where: { id: product.id }, data: { quantity: { decrement: parsed.quantity } } }).catch(() => {});
    }
  } else if (parsed.type === "PURCHASE") {
    let product = await prisma.product.findFirst({ where: { organizationId: orgId, name: { contains: parsed.productName || "", mode: "insensitive" } } });
    if (product) {
      await prisma.product.update({ where: { id: product.id }, data: { quantity: { increment: parsed.quantity || 0 } } });
    }
    await prisma.expense.create({
      data: { organizationId: orgId, title: `Purchase: ${parsed.productName}`, amount: parsed.totalAmount || 0, description: parsed.rawText, paymentMethod: "cash", date: new Date() }
    });
  } else if (parsed.type === "EXPENSE") {
    await prisma.expense.create({
      data: { organizationId: orgId, title: parsed.description?.slice(0, 100) || "WhatsApp Expense", amount: parsed.totalAmount || 0, description: parsed.rawText, paymentMethod: "cash", date: new Date() }
    });
  }
}

async function generateWhatsAppAIReply(orgId: string, message: string, conversationId: string): Promise<string> {
  try {
    // Find default chatbot for org
    const chatbot = await prisma.chatbot.findFirst({ where: { organizationId: orgId }, orderBy: { createdAt: "asc" } });
    if (!chatbot) return "Hello! Thanks for messaging us. Our team will reply shortly.";

    // RAG retrieval
    const queryVector = await generateEmbedding(message);
    const chunks = await prisma.documentChunk.findMany({
      where: { document: { organizationId: orgId, status: "TRAINED" } },
      include: { document: true },
      take: 50
    });

    const relevant = retrieveRelevantChunks(queryVector, message, chunks as any, 3);
    const context = relevant.map(c => c.content).join("\n\n") || "No specific documents found.";

    // Check if it's business op, provide confirmation
    const parsed = parseBusinessMessage(message);
    if (parsed.type !== "UNKNOWN" && parsed.confidence > 0.6) {
      if (parsed.type === "SALE") return `✅ Recorded sale: ${parsed.quantity} x ${parsed.productName} = ₦${parsed.totalAmount?.toLocaleString()}. Inventory updated, profit calculated. Anything else you'd like to log?`;
      if (parsed.type === "EXPENSE") return `✅ Expense logged: ₦${parsed.totalAmount?.toLocaleString()} for ${parsed.expenseCategory}. Your daily report is updated.`;
      if (parsed.type === "PURCHASE") return `✅ Purchase logged: ${parsed.quantity} x ${parsed.productName}. Stock increased. Expense of ₦${parsed.totalAmount?.toLocaleString()} recorded.`;
    }

    // Use OpenRouter if available
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: process.env.AI_MODEL || "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `You are ${chatbot.name}, an AI employee for this business. Instructions: ${chatbot.instructions}. Knowledge: ${context}. Keep reply under 100 words, friendly, professional. Use WhatsApp-friendly formatting. Business: ${orgId}` },
              { role: "user", content: message }
            ],
            max_tokens: 300
          })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return reply;
        }
      } catch {}
    }

    // Fallback
    if (relevant.length > 0) return `${relevant[0].content.slice(0, 300)}...\n\nLet me know if you need more help!`;
    return `Thanks for reaching out! I'm ${chatbot.name}, your AI business assistant. I've received your message and will help you shortly. You can also log sales via WhatsApp like "Sold 5 bags rice for ₦85k each".`;
  } catch (e) {
    console.error("AI Reply generation failed", e);
    return "Thanks for messaging us! Our team has received your message and will respond shortly. 🙏";
  }
}

async function sendWhatsAppMessage(phoneNumberId: string, token: string, to: string, message: string) {
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      })
    });
    const data = await res.json();
    console.log("[WhatsApp] Send result:", data);
    return data;
  } catch (e) {
    console.error("[WhatsApp] Send failed", e);
    return null;
  }
}
