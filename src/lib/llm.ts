// ────────────────────────────────────────────────────────────────────────────
// Unified LLM provider layer — OpenAI (preferred) or OpenRouter (fallback)
//
// Set OPENAI_API_KEY to use OpenAI directly (api.openai.com).
// Otherwise set OPENROUTER_API_KEY to route through OpenRouter.
// AI_MODEL is honored per provider (OpenAI models must start with gpt-/o1/o3/
// o4/chatgpt-, otherwise gpt-4o-mini is used as the OpenAI default).
// ────────────────────────────────────────────────────────────────────────────

export type LlmProvider = "openai" | "openrouter";

export function llmProvider(): LlmProvider | null {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return null;
}

export function llmApiKey(): string | null {
  return process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || null;
}

export function llmBaseUrl(): string {
  return llmProvider() === "openai"
    ? "https://api.openai.com/v1"
    : "https://openrouter.ai/api/v1";
}

export function llmHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${llmApiKey()}`,
    "Content-Type": "application/json",
  };
  if (llmProvider() === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_APP_URL || "https://biztriach-app.vercel.app";
    headers["X-Title"] = "Philip Opeyemi AI Assistant";
  }
  return headers;
}

const OPENAI_MODEL_RE = /^(gpt-|o[134](-mini|-pro)?|chatgpt-)/;

export function chatModel(): string {
  const m = process.env.AI_MODEL || "";
  if (llmProvider() === "openai") {
    return OPENAI_MODEL_RE.test(m) ? m : "gpt-4o-mini";
  }
  return m || "google/gemini-2.5-flash";
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOpts {
  maxTokens?: number;
  temperature?: number;
  responseFormatJson?: boolean;
}

/** Non-streaming chat completion. Returns the reply text, or null on any failure. */
export async function chatCompletion(
  messages: LlmMessage[],
  opts: ChatCompletionOpts = {}
): Promise<string | null> {
  const provider = llmProvider();
  if (!provider) return null;
  try {
    const body: Record<string, unknown> = {
      model: chatModel(),
      messages,
      max_tokens: opts.maxTokens ?? 400,
      temperature: opts.temperature ?? 0.7,
    };
    if (opts.responseFormatJson) {
      body.response_format = { type: "json_object" };
    }
    const res = await fetch(`${llmBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: llmHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[LLM] ${provider} error ${res.status}: ${errText.slice(0, 300)}`
      );
      return null;
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    return reply && reply.trim().length > 0 ? reply.trim() : null;
  } catch (e) {
    console.error(`[LLM] ${provider} call failed:`, e);
    return null;
  }
}

// ── Embeddings ──────────────────────────────────────────────────────────────

export function embedModel(): string {
  return llmProvider() === "openai"
    ? "text-embedding-3-small"
    : "cohere/embed-english-v3.0";
}

/** Provider-aware embeddings for an array of inputs. Returns null on failure. */
export async function createEmbeddings(
  inputs: string[]
): Promise<number[][] | null> {
  const provider = llmProvider();
  if (!provider || inputs.length === 0) return null;
  try {
    const res = await fetch(`${llmBaseUrl()}/embeddings`, {
      method: "POST",
      headers: llmHeaders(),
      body: JSON.stringify({
        model: embedModel(),
        input: inputs.map((t) => t.slice(0, 8000)),
      }),
    });
    if (!res.ok) {
      console.error(
        `[LLM] ${provider} embeddings error ${res.status}: ${(await res.text()).slice(0, 200)}`
      );
      return null;
    }
    const data = await res.json();
    if (data.data && Array.isArray(data.data) && data.data.length === inputs.length) {
      return data.data.map((d: { embedding?: number[] }) => d.embedding || []);
    }
    return null;
  } catch (e) {
    console.error(`[LLM] ${provider} embeddings failed:`, e);
    return null;
  }
}
