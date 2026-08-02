export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { encryptKey, decryptKey } from "@/lib/apiKeys";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await prisma.whatsAppAccount.findUnique({ where: { organizationId: user.organizationId } });
  if (!account) return NextResponse.json(null);
  // Hide token in response
  return NextResponse.json({ ...account, accessToken: account.accessToken ? "***" + account.accessToken.slice(-6) : null });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { phoneNumberId, businessAccountId, accessToken, verifyToken, autoReply, businessParsing } = await req.json();

    const existing = await prisma.whatsAppAccount.findUnique({ where: { organizationId: user.organizationId } });

    const data = {
      organizationId: user.organizationId,
      phoneNumberId: phoneNumberId || null,
      businessAccountId: businessAccountId || null,
      accessToken: accessToken ? encryptKey(accessToken) : existing?.accessToken || null,
      verifyToken: verifyToken || existing?.verifyToken || `biztriach_${Math.random().toString(36).slice(2,10)}`,
      autoReply: autoReply !== undefined ? autoReply : true,
      businessParsing: businessParsing !== undefined ? businessParsing : true,
      isConnected: !!(phoneNumberId && accessToken),
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://biztriach.vercel.app"}/api/whatsapp/webhook`
    };

    const account = existing ? await prisma.whatsAppAccount.update({ where: { organizationId: user.organizationId }, data }) : await prisma.whatsAppAccount.create({ data });

    return NextResponse.json(account);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save WhatsApp account" }, { status: 500 });
  }
}
