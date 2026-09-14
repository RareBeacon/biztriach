export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, createDoc } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await findDocs(COL.leads, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["createdAt", "desc"]],
    limit: 200,
  });
  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) {
    // Allow public lead capture without auth if coming from landing page
    try {
      const body = await req.json();
      if (body.organizationId && body.email) {
        const lead = await createDoc(COL.leads, {
          organizationId: body.organizationId,
          email: body.email,
          name: body.name || null,
          phone: body.phone || null,
          source: body.source || "landing_page",
          sourceId: body.sourceId || null,
          status: "NEW",
          metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        });
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
    const lead = await createDoc(COL.leads, {
      organizationId: user.organizationId,
      email,
      name: name || null,
      phone: phone || null,
      source: source || "manual",
      sourceId: null,
      status: "NEW",
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
    return NextResponse.json(lead);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
