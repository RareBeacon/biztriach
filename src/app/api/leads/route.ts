export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await prisma.lead.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) {
    // Allow public lead capture without auth if coming from landing page
    try {
      const body = await req.json();
      if (body.organizationId && body.email) {
        const lead = await prisma.lead.create({ data: { organizationId: body.organizationId, email: body.email, name: body.name, phone: body.phone, source: body.source || "landing_page", sourceId: body.sourceId, metadata: body.metadata ? JSON.stringify(body.metadata) : null } });
        return NextResponse.json(lead);
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { email, name, phone, source, metadata } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const lead = await prisma.lead.create({ data: { organizationId: user.organizationId, email, name, phone, source: source || "manual", metadata: metadata ? JSON.stringify(metadata) : null } });
    return NextResponse.json(lead);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
