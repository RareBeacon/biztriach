export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await prisma.landingPage.findMany({ where: { organizationId: user.organizationId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, slug, description, content, template, chatbotId } = await req.json();
    if (!title || !slug) return NextResponse.json({ error: "Title and slug required" }, { status: 400 });

    const page = await prisma.landingPage.create({
      data: {
        organizationId: user.organizationId,
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description,
        content: typeof content === "string" ? content : JSON.stringify(content || {}),
        template: template || "modern",
        chatbotId: chatbotId || null
      }
    });
    return NextResponse.json(page);
  } catch (e) {
    console.error(e);
    if ((e as any).code === "P2002") return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const updated = await prisma.landingPage.update({
      where: { id },
      data: {
        ...data,
        content: data.content ? (typeof data.content === "string" ? data.content : JSON.stringify(data.content)) : undefined
      }
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
