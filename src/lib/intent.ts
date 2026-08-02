/**
 * SupportIQ - Intent Classification Engine
 * Hybrid keyword + LLM intent detection
 */

export type Intent =
  | "refund"
  | "shipping"
  | "account"
  | "billing"
  | "bug"
  | "feature_request"
  | "integration"
  | "pricing"
  | "cancellation"
  | "complaint"
  | "general"
  | "human_handoff";

export interface IntentResult {
  intent: Intent;
  confidence: number;
  keywords: string[];
  shouldEscalate: boolean;
}

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  refund: ["refund", "money back", "return", "returning", "reimburse", "charge back", "get my money"],
  shipping: ["ship", "shipping", "delivery", "track", "tracking", "where is my order", "order status", "arrive", "parcel"],
  account: ["password", "login", "account", "sign in", "locked", "reset", "access", "profile", "forgot"],
  billing: ["billing", "charge", "charged twice", "invoice", "payment", "credit card", "subscription charge", "overcharged"],
  bug: ["bug", "crash", "not working", "broken", "error", "issue", "fails", "doesn't work", "glitch", "500", "404"],
  feature_request: ["feature", "add", "wish", "could you", "improvement", "suggestion", "would be great if"],
  integration: ["integrate", "integration", "api", "webhook", "zapier", "slack", "connect to", "salesforce", "hubspot"],
  pricing: ["price", "pricing", "cost", "plan", "how much", "enterprise", "discount", "coupon", "student"],
  cancellation: ["cancel", "cancellation", "unsubscribe", "stop subscription", "end plan"],
  complaint: ["complaint", "terrible", "worst", "angry", "unacceptable", "disappointed", "frustrated"],
  human_handoff: ["human", "speak to", "talk to", "real person", "agent", "manager", "representative", "support person"],
  general: []
};

const ESCALATION_INTENTS: Intent[] = ["complaint", "human_handoff"];

export function classifyIntentKeyword(message: string): IntentResult {
  const lower = message.toLowerCase();
  const scores: Record<string, { count: number; kws: string[] }> = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = { count: 0, kws: [] };
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[intent].count += 1;
        scores[intent].kws.push(kw);
        // Boost for exact phrase matches vs single word
        if (kw.includes(" ")) scores[intent].count += 0.5;
      }
    }
  }

  // Find best intent
  let bestIntent: Intent = "general";
  let bestScore = 0;
  let bestKws: string[] = [];

  for (const [intent, data] of Object.entries(scores)) {
    if (data.count > bestScore) {
      bestScore = data.count;
      bestIntent = intent as Intent;
      bestKws = data.kws;
    }
  }

  // If no clear intent, default to general
  if (bestScore === 0) {
    return {
      intent: "general",
      confidence: 0.3,
      keywords: [],
      shouldEscalate: false
    };
  }

  const confidence = Math.min(0.4 + bestScore * 0.2, 0.95);
  const shouldEscalate = ESCALATION_INTENTS.includes(bestIntent) || bestIntent === "complaint";

  return {
    intent: bestIntent,
    confidence,
    keywords: bestKws,
    shouldEscalate
  };
}

// LLM-enhanced intent classification (optional)
export async function classifyIntentLLM(message: string): Promise<IntentResult> {
  const fallback = classifyIntentKeyword(message);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || message.trim().length < 8) return fallback;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an intent classifier for customer support. Classify into one of: refund, shipping, account, billing, bug, feature_request, integration, pricing, cancellation, complaint, human_handoff, general. Return JSON: {"intent": "...", "confidence": 0-1}`
          },
          { role: "user", content: message.slice(0, 600) }
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.intent && Object.keys(INTENT_KEYWORDS).includes(parsed.intent)) {
            return {
              intent: parsed.intent as Intent,
              confidence: parsed.confidence || 0.85,
              keywords: fallback.keywords,
              shouldEscalate: ESCALATION_INTENTS.includes(parsed.intent as Intent)
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn("[Intent] LLM classification failed, using keyword fallback");
  }

  return fallback;
}

// Combined analyzer that merges intent + sentiment for escalation decision
export function shouldEscalateConversation(intent: IntentResult, sentiment: { sentiment: string; urgency: string; isEscalationNeeded: boolean }): boolean {
  if (sentiment.isEscalationNeeded) return true;
  if (intent.shouldEscalate) return true;
  if (intent.intent === "human_handoff") return true;
  if (intent.intent === "complaint" && sentiment.urgency !== "low") return true;
  return false;
}
