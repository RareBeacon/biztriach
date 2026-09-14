export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { encryptKey, decryptKey, validateApiKey } from "@/lib/apiKeys";
import { COL, findDocs, getDoc, updateDocData, createDoc, deleteManyDocs } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await findDocs(COL.apiKeys, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["provider", "asc"]],
  });

  // Also get BYOK from User table
  const userRecord = await getDoc<any>(COL.users, user.id);

  const byok = {
    openai: userRecord?.openaiApiKey ? "***" + decryptKey(userRecord.openaiApiKey).slice(-6) : null,
    openrouter: userRecord?.openrouterApiKey ? "***" + decryptKey(userRecord.openrouterApiKey).slice(-6) : null,
    gemini: userRecord?.geminiApiKey ? "***" + decryptKey(userRecord.geminiApiKey).slice(-6) : null,
    claude: userRecord?.claudeApiKey ? "***" + decryptKey(userRecord.claudeApiKey).slice(-6) : null,
  };

  return NextResponse.json({
    keys: keys.map((k: any) => ({ ...k, key: "***" + decryptKey(k.key).slice(-6) })),
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
      await updateDocData(COL.users, user.id, { apiKeyPreference: preference });
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
      await updateDocData(COL.users, user.id, { [fieldMap[provider]]: encrypted });
    }

    const existing = await findDocs<any>(COL.apiKeys, {
      where: [["organizationId", "==", user.organizationId], ["provider", "==", provider]],
      limit: 1,
    });
    const saved = existing[0]
      ? await updateDocData(COL.apiKeys, existing[0].id, { key: encrypted, isActive: true })
      : await createDoc(COL.apiKeys, { organizationId: user.organizationId, provider, key: encrypted, isActive: true });

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

  await deleteManyDocs(COL.apiKeys, {
    where: [["organizationId", "==", user.organizationId], ["provider", "==", provider]],
  });

  const fieldMap: any = { openai: "openaiApiKey", openrouter: "openrouterApiKey", gemini: "geminiApiKey", claude: "claudeApiKey" };
  if (fieldMap[provider]) {
    await updateDocData(COL.users, user.id, { [fieldMap[provider]]: null });
  }

  return NextResponse.json({ success: true });
}
