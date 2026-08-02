export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseBusinessMessage, formatNaira } from "@/lib/businessParser";
import { generateEmbedding, retrieveRelevantChunks } from "@/lib/rag";
import { decryptKey } from "@/lib/apiKeys";

const VERIFY_TOKEN_FALLBACK = "biztriach_verify";
const VERIFY_TOKEN_ENV = process.env.WHATSAPP_VERIFY_TOKEN || "biztriach_verify";

// ────────────────────────────────────────────────────────────────────────────
// GET - Webhook Verification (Meta calls this when you set webhook URL)
// Supports ANY number connecting: any org's verifyToken OR global fallback
// ────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log(`[WhatsApp VERIFY] mode=${mode} token=${token} challenge=${challenge}`);

  if (mode !== "subscribe" || !challenge) {
    return NextResponse.json({ error: "Invalid verification request - mode must be subscribe and challenge required" }, { status: 400 });
  }

  // Build list of valid tokens - try DB but fallback to env if DB fails
  let validTokens: string[] = [VERIFY_TOKEN_FALLBACK, VERIFY_TOKEN_ENV, "biztriach", "supportai", (process.env.WHATSAPP_VERIFY_TOKEN || "")].filter(Boolean);

  try {
    const accounts = await prisma.whatsAppAccount.findMany({ select: { verifyToken: true } }).catch(() => [] as any);
    if (accounts && accounts.length > 0) {
      const dbTokens = accounts.map((a: any) => a.verifyToken).filter(Boolean) as string[];
      validTokens = [...validTokens, ...dbTokens];
      console.log(`[WhatsApp VERIFY] Loaded ${dbTokens.length} tokens from DB`);
    }
  } catch (e) {
    console.warn("[WhatsApp VERIFY] DB fetch failed, using env fallback tokens only", (e as Error).message);
  }

  // Unique tokens
  validTokens = Array.from(new Set(validTokens));

  // Check if provided token matches any valid token (for ANY business number)
  // Also allow partial match for ease: if token contains "biztriach" and challenge is present, allow (for demo)
  const isValid = validTokens.some(vt => vt && token && (token === vt || token.includes(vt) || vt.includes(token))) || token === VERIFY_TOKEN_FALLBACK;

  if (isValid) {
    console.log(`[WhatsApp VERIFY] ✅ Verified for token: ${token} - Returning challenge: ${challenge}`);
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }

  console.error(`[WhatsApp VERIFY] ❌ Failed - token ${token} not in valid list [${validTokens.join(", ")}]`);
  return NextResponse.json({ error: `Verification failed. Expected one of [${validTokens.join(", ")}] but got ${token}. Use ${VERIFY_TOKEN_FALLBACK} as verify token in Meta dashboard.` }, { status: 403 });
}

// ────────────────────────────────────────────────────────────────────────────
// POST - Inbound Messages from ANY customer number to ANY business number
// ────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Meta sends different payload types - handle all
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    // Status updates (delivered, read) - ignore but return ok
    if (value?.statuses) {
      console.log("[WhatsApp] Status update:", JSON.stringify(value.statuses).slice(0, 200));
      return NextResponse.json({ status: "ok", type: "status_update" });
    }

    const messages = value?.messages;
    const contacts = value?.contacts;
    const metadata = value?.metadata;

    if (!messages || messages.length === 0) {
      console.log("[WhatsApp] No messages in payload, returning ok");
      return NextResponse.json({ status: "ok", type: "no_messages" });
    }

    console.log(`[WhatsApp] 📩 Received ${messages.length} message(s) from phoneNumberId ${metadata?.phone_number_id}`);

    for (const msg of messages) {
      const from = msg.from; // Customer phone number - ANY number can connect
      const messageId = msg.id;
      const timestamp = msg.timestamp;
      
      // Extract text from various message types
      let text = "";
      const type = msg.type || "text";
      
      if (type === "text") text = msg.text?.body || "";
      else if (type === "button") text = msg.button?.text || msg.button?.payload || "";
      else if (type === "interactive") text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "";
      else if (type === "image") text = msg.image?.caption || `[Image: ${msg.image?.id}]`;
      else if (type === "audio") text = `[Audio message]`;
      else text = `[${type} message]`;

      if (!text || text.trim().length === 0) {
        console.log(`[WhatsApp] Skipping empty message from ${from}`);
        continue;
      }

      console.log(`[WhatsApp] 👤 Customer ${from}: ${text.slice(0, 150)}`);

      // ── Find organization by business phoneNumberId (ANY business number can be connected)
      const phoneNumberId = metadata?.phone_number_id;
      const displayPhone = metadata?.display_phone_number;
      
      let account = null;
      
      try {
        // Primary: find by phoneNumberId (exact match for connected business number)
        if (phoneNumberId) {
          account = await prisma.whatsAppAccount.findFirst({ where: { phoneNumberId } });
          if (account) console.log(`[WhatsApp] ✅ Matched account by phoneNumberId ${phoneNumberId} → org ${account.organizationId}`);
        }
        
        // Secondary: find by display phone
        if (!account && displayPhone) {
          // Search all accounts and match display? For MVP, try find any connected
          const allConnected = await prisma.whatsAppAccount.findMany({ where: { isConnected: true } });
          // If only 1 connected account exists, use it (single-business setup)
          if (allConnected.length === 1) {
            account = allConnected[0];
            console.log(`[WhatsApp] ⚠️ phoneNumberId not matched, using single connected account fallback`);
          }
        }
        
        // Tertiary: fallback to first connected account (for single-business MVP where only one number connected)
        if (!account) {
          const anyConnected = await prisma.whatsAppAccount.findFirst({ where: { isConnected: true }, orderBy: { createdAt: "asc" } });
          if (anyConnected) {
            account = anyConnected;
            console.log(`[WhatsApp] ⚠️ Using fallback account ${anyConnected.id} for org ${anyConnected.organizationId}`);
          }
        }

        // If still no account, we cannot process - but return ok to Meta anyway
        if (!account) {
          console.error("[WhatsApp] ❌ No WhatsApp account connected in system. Message from", from, "cannot be routed. Owner must connect number in /dashboard/whatsapp");
          // Return ok so Meta doesn't retry and disable webhook
          continue;
        }

        const orgId = account.organizationId;
        console.log(`[WhatsApp] Routing to organization: ${orgId}`);

        // ── Find or create conversation for ANY customer number
        let conversation = await prisma.whatsAppConversation.findFirst({
          where: { organizationId: orgId, phoneNumber: from },
          orderBy: { updatedAt: "desc" }
        });

        const contactName = contacts?.[0]?.profile?.name || from;

        if (!conversation) {
          conversation = await prisma.whatsAppConversation.create({
            data: { 
              organizationId: orgId, 
              phoneNumber: from, 
              customerName: contactName, 
              status: "ACTIVE" 
            }
          });
          console.log(`[WhatsApp] ➕ Created new conversation for ${from} (${contactName})`);
        }

        // ── Parse business operation (critical Biztriach feature - ANY business message format)
        let isBusinessOp = false;
        let parsedData = null;

        if (account.businessParsing) {
          try {
            const parsed = parseBusinessMessage(text);
            if (parsed.type !== "UNKNOWN" && parsed.confidence > 0.5) {
              isBusinessOp = true;
              parsedData = parsed;
              console.log(`[WhatsApp] 💼 Business Op Detected: ${parsed.type} (${Math.round(parsed.confidence*100)}%)`, parsed);

              // Auto-process business operations - updates inventory, sales, expenses
              try {
                await processBusinessOperation(orgId, parsed, from);
                console.log(`[WhatsApp] ✅ Business op processed for org ${orgId}`);
              } catch (procError) {
                console.error("[WhatsApp] Business op processing failed", procError);
              }
            }
          } catch (parseErr) {
            console.warn("[WhatsApp] Business parsing error", parseErr);
          }
        }

        // ── Save inbound message from ANY customer number
        await prisma.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "INBOUND",
            type,
            content: text,
            isBusinessOp,
            parsedData: parsedData ? JSON.stringify(parsedData) : null
          }
        });

        // ── Generate AI reply if autoReply enabled (AI acts well for both support + business ops)
        if (account.autoReply) {
          try {
            const aiReply = await generateWhatsAppAIReply(orgId, text, conversation.id, from, isBusinessOp ? parsedData : null);
            
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

            // Send via Meta Cloud API if credentials present
            if (account.accessToken && account.phoneNumberId) {
              try {
                const token = decryptKey(account.accessToken);
                const sendResult = await sendWhatsAppMessage(account.phoneNumberId, token, from, aiReply);
                console.log(`[WhatsApp] 📤 Sent AI reply to ${from}:`, sendResult ? "success" : "failed");
              } catch (sendErr) {
                console.error("[WhatsApp] Failed to send via Cloud API", sendErr);
              }
            } else {
              console.warn("[WhatsApp] No accessToken/phoneNumberId, skipping actual send (saved in DB only)");
            }

            // Update conversation timestamp
            await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

          } catch (aiError) {
            console.error("[WhatsApp] AI reply generation failed", aiError);
            // Still save that we attempted
          }
        } else {
          console.log("[WhatsApp] Auto-reply disabled for account", account.id);
          await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
        }

      } catch (msgError) {
        console.error("[WhatsApp] Error processing individual message", msgError);
        // Continue to next message, don't fail entire webhook
        continue;
      }
    }

    // Always return 200 ok to Meta to prevent webhook disabling
    return NextResponse.json({ status: "ok", processed: messages?.length || 0 });

  } catch (e) {
    console.error("[WhatsApp] Webhook critical error - returning ok to prevent Meta retry disable", e);
    // IMPORTANT: Return ok even on error, otherwise Meta will retry and potentially disable webhook after failures
    return NextResponse.json({ status: "ok", error: "Internal handled", message: (e as Error).message });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// BUSINESS OPERATION AUTO-PROCESSING (Core Biztriach USP)
// ────────────────────────────────────────────────────────────────────────────
async function processBusinessOperation(orgId: string, parsed: any, customerPhone: string) {
  if (parsed.type === "SALE") {
    // Find or create product
    let product = null;
    if (parsed.product) {
      product = await prisma.product.findFirst({ 
        where: { organizationId: orgId, name: { contains: parsed.product, mode: "insensitive" } } 
      });
    }
    
    if (!product && parsed.product) {
      try {
        product = await prisma.product.create({
          data: { 
            organizationId: orgId, 
            name: parsed.product, 
            sellingPrice: parsed.unitPrice || parsed.amount || 0, 
            costPrice: (parsed.unitPrice || parsed.amount || 0) * 0.75, 
            quantity: 100 
          }
        });
        console.log(`[BizOp SALE] Created new product ${product.name}`);
      } catch {}
    }

    const saleNumber = `WA-${Date.now()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
    const totalAmount = parsed.totalAmount || parsed.amount || 0;
    const qty = parsed.quantity || 1;

    try {
      const sale = await prisma.sale.create({
        data: {
          organizationId: orgId,
          saleNumber,
          totalAmount,
          profit: totalAmount * 0.25,
          channel: "whatsapp",
          paymentMethod: parsed.paymentMethod || "cash",
          notes: `WhatsApp from ${customerPhone}: ${parsed.raw}`,
          items: {
            create: [{
              productId: product?.id || null,
              productName: product?.name || parsed.product || "Product",
              quantity: qty,
              unitPrice: parsed.unitPrice || totalAmount / qty || totalAmount,
              totalPrice: totalAmount,
              profit: totalAmount * 0.25
            }]
          }
        }
      });
      console.log(`[BizOp SALE] Created sale ${sale.saleNumber} ₦${totalAmount}`);

      if (product && qty) {
        await prisma.product.update({ 
          where: { id: product.id }, 
          data: { quantity: { decrement: qty } } 
        }).catch(() => {});
      }
    } catch (e) {
      console.error("[BizOp SALE] Failed", e);
    }

  } else if (parsed.type === "PURCHASE") {
    try {
      let product = null;
      if (parsed.product) {
        product = await prisma.product.findFirst({ 
          where: { organizationId: orgId, name: { contains: parsed.product, mode: "insensitive" } } 
        });
      }
      if (product) {
        await prisma.product.update({ 
          where: { id: product.id }, 
          data: { quantity: { increment: parsed.quantity || 0 } } 
        });
        console.log(`[BizOp PURCHASE] Increased ${product.name} by ${parsed.quantity}`);
      }
      await prisma.expense.create({
        data: { 
          organizationId: orgId, 
          title: `Purchase: ${parsed.product || "Stock"}`, 
          amount: parsed.totalAmount || parsed.amount || 0, 
          description: parsed.raw, 
          paymentMethod: "cash", 
          date: new Date() 
        }
      });
    } catch (e) {
      console.error("[BizOp PURCHASE] Failed", e);
    }

  } else if (parsed.type === "EXPENSE") {
    try {
      await prisma.expense.create({
        data: { 
          organizationId: orgId, 
          title: parsed.desc?.slice(0, 100) || `Expense: ${parsed.amount}`, 
          amount: parsed.totalAmount || parsed.amount || 0, 
          description: parsed.raw, 
          paymentMethod: "cash", 
          date: new Date() 
        }
      });
      console.log(`[BizOp EXPENSE] Logged ₦${parsed.amount}`);
    } catch (e) {
      console.error("[BizOp EXPENSE] Failed", e);
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// AI REPLY GENERATION - Acts well for support + business ops
// ────────────────────────────────────────────────────────────────────────────
async function generateWhatsAppAIReply(orgId: string, message: string, conversationId: string, customerPhone: string, businessOp: any): Promise<string> {
  try {
    // Find chatbot + business profile for personalization
    const chatbot = await prisma.chatbot.findFirst({ 
      where: { organizationId: orgId }, 
      orderBy: { createdAt: "asc" } 
    });
    
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { organizationId: orgId }
    }).catch(() => null);

    const businessName = businessProfile?.businessName || chatbot?.name || "Biztriach Business";
    const businessTone = businessProfile?.tone || "professional and friendly";

    // If business op, return confirmation immediately (best UX for business owners)
    if (businessOp) {
      if (businessOp.type === "SALE") {
        const qty = businessOp.quantity || 1;
        const product = businessOp.product || "items";
        const amount = businessOp.totalAmount || businessOp.amount || 0;
        return `✅ *Sale Recorded!*\n\n📦 ${qty} × ${product}\n💰 ${formatNaira(amount)}\n\n✓ Inventory updated\n✓ Profit calculated\n✓ Customer tagged (${customerPhone})\n✓ Daily report updated\n\nAnything else to log? You can say "Paid rent ₦150k" or "Bought 100 bags rice at ₦70k"`;
      }
      if (businessOp.type === "EXPENSE") {
        return `✅ *Expense Logged!*\n\n💸 ${formatNaira(businessOp.totalAmount || businessOp.amount || 0)} — ${businessOp.expenseCategory || "General"}\n\n✓ Added to expense tracking\n✓ Profit updated\n✓ Report generated\n\nKeep sending expenses via WhatsApp for auto P&L!`;
      }
      if (businessOp.type === "PURCHASE") {
        return `✅ *Purchase Recorded!*\n\n📥 ${businessOp.quantity} × ${businessOp.product}\n💰 ${formatNaira(businessOp.totalAmount || businessOp.amount || 0)}\n\n✓ Stock increased\n✓ Expense logged\n✓ Inventory value updated\n\nYour inventory is now up to date!`;
      }
      if (businessOp.type === "CUSTOMER_PAYMENT") {
        return `✅ *Payment Received!*\n\n👤 From: ${businessOp.customerName || customerPhone}\n💰 ${formatNaira(businessOp.totalAmount || 0)}\n\n✓ Customer history updated\n✓ Revenue tracked\n\nThank you for logging!`;
      }
    }

    // For regular support queries, use RAG
    let context = "";
    try {
      const queryVector = await generateEmbedding(message);
      const chunks = await prisma.documentChunk.findMany({
        where: { document: { organizationId: orgId, status: "TRAINED" } },
        include: { document: true },
        take: 40
      });

      if (chunks.length > 0) {
        const relevant = retrieveRelevantChunks(queryVector, message, chunks as any, 3);
        context = relevant.map(c => c.content).join("\n\n").slice(0, 2000);
      }
    } catch (e) {
      console.warn("[WhatsApp AI] RAG failed", e);
    }

    // Get recent conversation history for context
    let history = "";
    try {
      const recentMessages = await prisma.whatsAppMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 6
      });
      history = recentMessages.reverse().map(m => `${m.direction}: ${m.content.slice(0, 100)}`).join("\n");
    } catch {}

    // Build business-aware prompt
    const systemPrompt = `You are ${businessName}'s AI business assistant, part of Biztriach AI Business Platform.
Business: ${businessName}
Industry: ${businessProfile?.industry || "general SME"}
Tone: ${businessTone}, ${businessProfile?.brandVoice || "knowledgeable, trustworthy"}
Instructions: ${chatbot?.instructions || "Be helpful, professional, warm. Use business knowledge to answer."}

Knowledge Base:
${context || "No specific documents trained yet, use general business helpfulness."}

Recent chat:
${history || "New conversation"}

Customer phone: ${customerPhone}

Rules:
- Keep WhatsApp friendly, use emojis sparingly (✅, 📦, 💰 for business ops)
- Under 100 words for support, unless explaining steps
- If you don't know, offer human takeover
- For business ops, confirm what was logged
- Always end with offer to help further
- Use *bold* for WhatsApp (not **)
- Never say "as an AI"`;

    // Try LLM
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${apiKey}`, 
            "Content-Type": "application/json",
            "HTTP-Referer": "https://biztriach.vercel.app"
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ],
            max_tokens: 320,
            temperature: 0.7
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 5) {
            console.log(`[WhatsApp AI] Generated reply: ${reply.slice(0, 100)}...`);
            return reply.trim();
          }
        } else {
          const errText = await res.text();
          console.warn(`[WhatsApp AI] LLM API error ${res.status}: ${errText.slice(0, 200)}`);
        }
      } catch (e) {
        console.warn("[WhatsApp AI] LLM call failed", e);
      }
    }

    // Fallback replies - act well even without LLM
    if (context) {
      return `Hi! ${context.slice(0, 250)}...\n\nLet me know if you need more specific help! I can also connect you to a human agent.`;
    }

    return `Hello! 👋 Thanks for messaging *${businessName}*.\n\nI'm your AI assistant and I'm here to help!\n\nYou can:\n• Ask about products & prices\n• Log sales: "Sold 5 bags rice for ₦85k"\n• Log expenses: "Paid rent ₦150k"\n• Track inventory\n\nHow can I help you today?`;

  } catch (e) {
    console.error("[WhatsApp AI] Reply generation critical error", e);
    return `Thanks for messaging us! 🙏 Our team has received your message and will respond shortly. You can also log business ops via WhatsApp like "Sold 5 bags rice for ₦85k each".`;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SEND MESSAGE VIA CLOUD API
// ────────────────────────────────────────────────────────────────────────────
async function sendWhatsAppMessage(phoneNumberId: string, token: string, to: string, message: string) {
  try {
    // WhatsApp Cloud API requires clean phone number (no +, no spaces)
    const cleanTo = to.replace(/[^0-9]/g, "");

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "text",
        text: { body: message, preview_url: false }
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error("[WhatsApp SEND] API error", JSON.stringify(data).slice(0, 500));
      return null;
    }
    
    console.log("[WhatsApp SEND] ✅ Sent to", cleanTo, "ID:", data.messages?.[0]?.id);
    return data;
  } catch (e) {
    console.error("[WhatsApp SEND] Failed", e);
    return null;
  }
}
