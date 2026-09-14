// ────────────────────────────────────────────────────────────────────────────
// Unified LLM provider layer with automatic failover
//
// Chat priority:  OpenAI → OpenRouter → Hugging Face
//   - OpenAI:      api.openai.com          (OPENAI_API_KEY, default gpt-4o-mini)
//   - OpenRouter:  openrouter.ai           (OPENROUTER_API_KEY)
//   - HuggingFace: router.huggingface.co   (HUGGINGFACE_API_KEY, default Llama-3.1-8B)
//
// If the primary provider errors (quota, outage), chatCompletion automatically
// tries the next one before giving up.
// ────────────────────────────────────────────────────────────────────────────

export type LlmProvider = "openai" | "openrouter" | "huggingface";

function chatProviders(): LlmProvider[] {
  const providers: LlmProvider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");
  if (process.env.HUGGINGFACE_API_KEY) providers.push("huggingface");
  return providers;
}

/** Primary (first available) provider — used for gating and streaming. */
export function llmProvider(): LlmProvider | null {
  return chatProviders()[0] || null;
}

export function llmApiKey(): string | null {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.HUGGINGFACE_API_KEY ||
    null
  );
}

function providerBaseUrl(p: LlmProvider): string {
  switch (p) {
    case "openai":
      return "https://api.openai.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "huggingface":
      return "https://router.huggingface.co/v1";
  }
}

function providerHeaders(p: LlmProvider): Record<string, string> {
  const key =
    p === "openai"
      ? process.env.OPENAI_API_KEY
      : p === "openrouter"
        ? process.env.OPENROUTER_API_KEY
        : process.env.HUGGINGFACE_API_KEY;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (p === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_APP_URL || "https://biztriach-app.vercel.app";
    headers["X-Title"] = "Philip Opeyemi AI Assistant";
  }
  return headers;
}

const OPENAI_MODEL_RE = /^(gpt-|o[134](-mini|-pro)?|chatgpt-)/;

function providerChatModel(p: LlmProvider): string {
  const m = process.env.AI_MODEL || "";
  switch (p) {
    case "openai":
      return OPENAI_MODEL_RE.test(m) ? m : "gpt-4o-mini";
    case "huggingface":
      // HF model ids look like "org/model-name"
      return m.includes("/") && !OPENAI_MODEL_RE.test(m)
        ? m
        : "meta-llama/Llama-3.1-8B-Instruct";
    case "openrouter":
      return m && !m.includes("/") ? m : m || "google/gemini-2.5-flash";
  }
}

// Single-provider variants (used by the streaming chat route)
export function llmBaseUrl(): string {
  const p = llmProvider();
  return p ? providerBaseUrl(p) : "https://api.openai.com/v1";
}

export function llmHeaders(): Record<string, string> {
  const p = llmProvider();
  return p
    ? providerHeaders(p)
    : { "Content-Type": "application/json" };
}

export function chatModel(): string {
  const p = llmProvider();
  return p ? providerChatModel(p) : "gpt-4o-mini";
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

/**
 * Non-streaming chat completion with automatic provider failover.
 * Returns the reply text, or null if every provider fails.
 */
export async function chatCompletion(
  messages: LlmMessage[],
  opts: ChatCompletionOpts = {}
): Promise<string | null> {
  for (const p of chatProviders()) {
    try {
      const body: Record<string, unknown> = {
        model: providerChatModel(p),
        messages,
        max_tokens: opts.maxTokens ?? 400,
        temperature: opts.temperature ?? 0.7,
      };
      if (opts.responseFormatJson) {
        body.response_format = { type: "json_object" };
      }
      const res = await fetch(`${providerBaseUrl(p)}/chat/completions`, {
        method: "POST",
        headers: providerHeaders(p),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(
          `[LLM] ${p} error ${res.status}: ${errText.slice(0, 300)} — trying next provider…`
        );
        continue;
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply && reply.trim().length > 0) return reply.trim();
    } catch (e) {
      console.error(`[LLM] ${p} call failed:`, e);
    }
  }
  return null;
}

// ── Embeddings (OpenAI preferred, OpenRouter fallback; HF not supported) ────

function embeddingProviders(): Array<"openai" | "openrouter"> {
  const providers: Array<"openai" | "openrouter"> = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");
  return providers;
}

/** Provider-aware embeddings for an array of inputs. Returns null on failure. */
export async function createEmbeddings(
  inputs: string[]
): Promise<number[][] | null> {
  const trimmed = inputs.map((t) => t.slice(0, 8000));
  for (const p of embeddingProviders()) {
    try {
      const model =
        p === "openai" ? "text-embedding-3-small" : "cohere/embed-english-v3.0";
      const res = await fetch(`${providerBaseUrl(p)}/embeddings`, {
        method: "POST",
        headers: providerHeaders(p),
        body: JSON.stringify({ model, input: trimmed }),
      });
      if (!res.ok) {
        console.error(
          `[LLM] ${p} embeddings error ${res.status}: ${(await res.text()).slice(0, 200)}`
        );
        continue;
      }
      const data = await res.json();
      if (
        data.data &&
        Array.isArray(data.data) &&
        data.data.length === trimmed.length
      ) {
        return data.data.map((d: { embedding?: number[] }) => d.embedding || []);
      }
    } catch (e) {
      console.error(`[LLM] ${p} embeddings failed:`, e);
    }
  }
  return null;
}
