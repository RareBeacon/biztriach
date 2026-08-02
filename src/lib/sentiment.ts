/**
 * SupportIQ - Sentiment & Urgency Engine v2
 * Lightweight, deterministic sentiment detection + LLM-enhanced fallback
 */

export type Sentiment = "positive" | "neutral" | "frustrated" | "angry" | "critical";
export type Urgency = "low" | "medium" | "high" | "critical";

interface SentimentResult {
  sentiment: Sentiment;
  urgency: Urgency;
  score: number; // -1 to 1
  isEscalationNeeded: boolean;
  flags: string[];
  confidence: number;
}

const ANGRY_KEYWORDS = [
  "furious", "angry", "terrible", "worst", "hate", "disgusting", "unacceptable",
  "ridiculous", "fucking", "shit", "awful", "useless", "sucks", "pathetic",
  "incompetent", "fraud", "scam", "lawsuit", "lawyer", "refund now"
];

const FRUSTRATED_KEYWORDS = [
  "frustrated", "annoyed", "disappointed", "waiting", "again", "still not",
  "no response", "ignored", "third time", "second time", "tired", "sick of",
  "why is", "never works", "keeps failing", "broken again"
];

const POSITIVE_KEYWORDS = [
  "thank", "thanks", "great", "awesome", "love", "excellent", "amazing",
  "perfect", "wonderful", "helpful", "appreciate", "fantastic"
];

const CRITICAL_INDICATORS = [
  "legal", "lawsuit", "attorney", "lawyer", "gdpr", "privacy violation",
  "data breach", "chargeback", "fraud", "urgent", "immediately", "critical",
  "emergency", "blocking", "down", "outage", "security", "breach"
];

const URGENCY_PHRASES = {
  critical: ["asap", "immediately", "right now", "urgent", "emergency", "blocking business", "can't work", "production down"],
  high: ["today", "need quickly", "important", "priority", "soon as possible", "deadline"],
  medium: ["when you can", "at your convenience", "couple days"]
};

export function analyzeSentiment(message: string): SentimentResult {
  const lower = message.toLowerCase();
  const flags: string[] = [];

  let angryScore = 0, frustratedScore = 0, positiveScore = 0, criticalScore = 0;

  // Count keyword matches
  for (const kw of ANGRY_KEYWORDS) if (lower.includes(kw)) { angryScore += 1; flags.push(`angry:${kw}`); }
  for (const kw of FRUSTRATED_KEYWORDS) if (lower.includes(kw)) { frustratedScore += 0.7; flags.push(`frustrated:${kw}`); }
  for (const kw of POSITIVE_KEYWORDS) if (lower.includes(kw)) positiveScore += 0.6;
  for (const kw of CRITICAL_INDICATORS) if (lower.includes(kw)) { criticalScore += 1.5; flags.push(`critical:${kw}`); }

  // Punctuation & capitalization intensity
  const exclamationCount = (message.match(/!/g) || []).length;
  const capsRatio = (message.match(/[A-Z]/g) || []).length / Math.max(message.length, 1);
  const isAllCaps = message.length > 10 && message === message.toUpperCase();

  if (exclamationCount >= 2) { angryScore += 0.5; flags.push("punct:multiple_exclamation"); }
  if (exclamationCount >= 4) { angryScore += 1.0; flags.push("punct:excessive_exclamation"); }
  if (capsRatio > 0.4) { angryScore += 0.4; flags.push("style:caps_ratio_high"); }
  if (isAllCaps) { angryScore += 0.8; flags.push("style:all_caps"); }

  // Length + repetition heuristic
  const repeatedChar = /(.)\1{3,}/.test(message);
  if (repeatedChar) { frustratedScore += 0.3; flags.push("style:repeated_chars"); }

  // Determine sentiment
  let sentiment: Sentiment = "neutral";
  let score = 0;

  if (positiveScore > 1 && angryScore === 0) {
    sentiment = "positive";
    score = 0.6 + Math.min(positiveScore * 0.1, 0.4);
  } else if (angryScore >= 2 || criticalScore >= 1.5) {
    sentiment = angryScore >= 3 || criticalScore >= 2 ? "critical" : "angry";
    score = -0.7 - Math.min(angryScore * 0.1, 0.3);
  } else if (angryScore >= 0.8 || frustratedScore >= 1) {
    sentiment = frustratedScore >= 1.5 ? "frustrated" : angryScore > 0 ? "angry" : "frustrated";
    score = -0.3 - Math.min(frustratedScore * 0.1, 0.4);
  } else if (frustratedScore >= 0.5) {
    sentiment = "frustrated";
    score = -0.2;
  }

  // Determine urgency
  let urgency: Urgency = "low";
  if (criticalScore >= 1.5 || sentiment === "critical" || exclamationCount >= 3) urgency = "critical";
  else if (angryScore >= 1.5 || lower.includes("today") || URGENCY_PHRASES.critical.some(p => lower.includes(p))) urgency = "critical";
  else if (URGENCY_PHRASES.high.some(p => lower.includes(p)) || frustratedScore >= 1 || sentiment === "angry") urgency = "high";
  else if (URGENCY_PHRASES.medium.some(p => lower.includes(p)) || lower.includes("question")) urgency = "medium";

  // Escalation decision
  const isEscalationNeeded =
    sentiment === "critical" ||
    sentiment === "angry" && urgency === "critical" ||
    criticalScore >= 2 ||
    (angryScore >= 2.5 && urgency !== "low") ||
    lower.includes("human") && (lower.includes("speak") || lower.includes("talk") || lower.includes("agent") || lower.includes("manager"));

  const confidence = Math.min(0.5 + (Math.max(angryScore, frustratedScore, positiveScore, criticalScore) * 0.15), 0.95);

  return {
    sentiment,
    urgency,
    score,
    isEscalationNeeded,
    flags,
    confidence
  };
}

// Async LLM-enhanced sentiment for high-value conversations (optional, uses OpenRouter)
export async function analyzeSentimentLLM(message: string): Promise<SentimentResult> {
  const base = analyzeSentiment(message);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || message.length < 15) return base;

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
            role: "user",
            content: `Analyze sentiment for customer support. Return JSON only: {sentiment: "positive|neutral|frustrated|angry|critical", urgency: "low|medium|high|critical", score: -1 to 1, isEscalationNeeded: boolean}. Message: "${message.slice(0, 500)}"`
          }
        ],
        max_tokens: 120,
        response_format: { type: "json_object" } as any
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          sentiment: parsed.sentiment || base.sentiment,
          urgency: parsed.urgency || base.urgency,
          score: typeof parsed.score === "number" ? parsed.score : base.score,
          isEscalationNeeded: typeof parsed.isEscalationNeeded === "boolean" ? parsed.isEscalationNeeded : base.isEscalationNeeded,
          flags: base.flags,
          confidence: 0.9
        };
      }
    }
  } catch (e) {
    console.warn("[Sentiment] LLM analysis failed, using deterministic fallback");
  }

  return base;
}
