/**
 * Biztriach - API Key Management & BYOK
 * Securely handle platform API vs Bring Your Own Keys
 */

import { prisma } from "./db";

export type ApiProvider = "openai" | "openrouter" | "gemini" | "claude" | "custom";

interface ApiKeyConfig {
  provider: ApiProvider;
  key: string;
  baseUrl?: string; // for custom OpenAI-compatible
  model?: string;
}

// Simple obfuscation - in production use proper encryption (AES)
export function encryptKey(key: string): string {
  // Base64 encode for MVP (replace with real encryption later)
  return Buffer.from(key).toString("base64");
}

export function decryptKey(encrypted: string): string {
  try {
    return Buffer.from(encrypted, "base64").toString("utf-8");
  } catch {
    return encrypted; // fallback if not base64
  }
}

export function validateApiKey(provider: ApiProvider, key: string): { valid: boolean; message?: string } {
  if (!key || key.trim().length < 10) return { valid: false, message: "API key too short" };

  const patterns: Record<ApiProvider, RegExp> = {
    openai: /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/,
    openrouter: /^sk-or-v1-[A-Za-z0-9_-]{20,}$/,
    gemini: /^[A-Za-z0-9_-]{30,}$/,
    claude: /^sk-ant-[A-Za-z0-9_-]{30,}$/,
    custom: /^.+$/ // any non-empty
  };

  const regex = patterns[provider];
  if (provider !== "custom" && !regex.test(key)) {
    return { valid: false, message: `Invalid ${provider} API key format. Please check your key.` };
  }

  return { valid: true };
}

export async function getEffectiveApiConfig(organizationId: string, preferredProvider?: ApiProvider) {
  // 1. Check if org has BYOK keys
  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId, isActive: true },
    orderBy: { createdAt: "desc" }
  });

  // 2. Check user's BYOK stored in User table (legacy path)
  const users = await prisma.user.findMany({
    where: { organizationId, status: "APPROVED" },
    take: 1
  });

  const user = users[0];
  const byokMap: Record<string, string> = {};

  if (user) {
    if (user.openaiApiKey) byokMap["openai"] = decryptKey(user.openaiApiKey);
    if (user.openrouterApiKey) byokMap["openrouter"] = decryptKey(user.openrouterApiKey);
    if (user.geminiApiKey) byokMap["gemini"] = decryptKey(user.geminiApiKey);
    if (user.claudeApiKey) byokMap["claude"] = decryptKey(user.claudeApiKey);
  }

  for (const k of apiKeys) {
    byokMap[k.provider] = decryptKey(k.key);
  }

  // Determine provider to use
  let provider: ApiProvider = preferredProvider || "openrouter";
  let apiKey: string | null = null;

  if (byokMap[provider]) {
    apiKey = byokMap[provider];
  } else if (Object.keys(byokMap).length > 0) {
    // Use first available BYOK
    provider = Object.keys(byokMap)[0] as ApiProvider;
    apiKey = byokMap[provider];
  } else {
    // Use platform shared keys from env
    provider = "openrouter";
    apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || null;
  }

  return {
    provider,
    apiKey,
    model: provider === "openai" ? "gpt-4o-mini" : provider === "gemini" ? "gemini-1.5-flash" : provider === "claude" ? "claude-3-5-sonnet-20241022" : process.env.AI_MODEL || "google/gemini-2.5-flash",
    isBYOK: !!byokMap[provider],
    source: byokMap[provider] ? "byok" : "platform"
  };
}

export async function saveApiKey(organizationId: string, provider: ApiProvider, rawKey: string, baseUrl?: string) {
  const validation = validateApiKey(provider, rawKey);
  if (!validation.valid) throw new Error(validation.message);

  const encrypted = encryptKey(rawKey);

  // Upsert
  const existing = await prisma.apiKey.findFirst({
    where: { organizationId, provider }
  });

  if (existing) {
    return prisma.apiKey.update({
      where: { id: existing.id },
      data: { key: encrypted, isActive: true, updatedAt: new Date() }
    });
  } else {
    return prisma.apiKey.create({
      data: { organizationId, provider, key: encrypted }
    });
  }
}
