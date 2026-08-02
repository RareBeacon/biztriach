export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { encryptKey, decryptKey, validateApiKey } from "@/lib/apiKeys";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({ where: { organizationId: user.organizationId }, orderBy: { provider: "asc" } });
  
  // Also get BYOK from User table
  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });

  const byok = {
    openai: userRecord?.openaiApiKey ? "***" + decryptKey(userRecord.openaiApiKey).slice(-6) : null,
    openrouter: userRecord?.openrouterApiKey ? "***" + decryptKey(userRecord.openrouterApiKey).slice(-6) : null,
    gemini: userRecord?.geminiApiKey ? "***" + decryptKey(userRecord.geminiApiKey).slice(-6) : null,
    claude: userRecord?.claudeApiKey ? "***" + decryptKey(userRecord.claudeApiKey).slice(-6) : null,
  };

  return NextResponse.json({
    keys: keys.map(k => ({ ...k, key: "***" + decryptKey(k.key).slice(-6) })),
    byok,
    preference: userRecord?.apiKeyPreference || "PLATFORM"
  });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { provider, apiKey, preference } = await req.json();

    if (preference) {
      await prisma.user.update({ where: { id: user.id }, data: { apiKeyPreference: preference } });
      return NextResponse.json({ success: true, preference });
    }

    if (!provider || !apiKey) return NextResponse.json({ error: "Provider and apiKey required" }, { status: 400 });

    const validation = validateApiKey(provider, apiKey);
    if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });

    const encrypted = encryptKey(apiKey);

    // Save to both ApiKey table and User table for compatibility
    const fieldMap: any = {
      openai: "openaiApiKey",
      openrouter: "openrouterApiKey",
      gemini: "geminiApiKey",
      claude: "claudeApiKey"
    };

    if (fieldMap[provider]) {
      await prisma.user.update({ where: { id: user.id }, data: { [fieldMap[provider]]: encrypted } });
    }

    const existing = await prisma.apiKey.findFirst({ where: { organizationId: user.organizationId, provider } });
    const saved = existing
      ? await prisma.apiKey.update({ where: { id: existing.id }, data: { key: encrypted, isActive: true } })
      : await prisma.apiKey.create({ data: { organizationId: user.organizationId, provider, key: encrypted } });

    return NextResponse.json({ success: true, key: { ...saved, key: "***" + apiKey.slice(-6) } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save API key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "Provider required" }, { status: 400 });

  await prisma.apiKey.deleteMany({ where: { organizationId: user.organizationId, provider } });

  const fieldMap: any = { openai: "openaiApiKey", openrouter: "openrouterApiKey", gemini: "geminiApiKey", claude: "claudeApiKey" };
  if (fieldMap[provider]) {
    await prisma.user.update({ where: { id: user.id }, data: { [fieldMap[provider]]: null } });
  }

  return NextResponse.json({ success: true });
}
