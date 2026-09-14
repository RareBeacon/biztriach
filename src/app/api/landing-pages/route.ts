export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, findUniqueByComposite, getDoc, createDoc, updateDocData } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await findDocs(COL.landingPages, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["updatedAt", "desc"]],
  });
  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, slug, description, content, template, chatbotId } = await req.json();
    if (!title || !slug) return NextResponse.json({ error: "Title and slug required" }, { status: 400 });

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Enforce unique (organizationId, slug) — replaces Prisma P2002
    const existing = await findUniqueByComposite(COL.landingPages, {
      organizationId: user.organizationId,
      slug: cleanSlug,
    });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 400 });

    const page = await createDoc(COL.landingPages, {
      organizationId: user.organizationId,
      title,
      slug: cleanSlug,
      description: description || null,
      content: typeof content === "string" ? content : JSON.stringify(content || {}),
      template: template || "modern",
      theme: null,
      isPublished: false,
      views: 0,
      conversions: 0,
      chatbotId: chatbotId || null,
    });
    return NextResponse.json(page);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Ownership check
    const existing = await getDoc<any>(COL.landingPages, id);
    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Page not found or access denied" }, { status: 404 });
    }

    // If slug changes, keep it unique within the org
    if (data.slug && data.slug !== existing.slug) {
      const cleanSlug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const dupe = await findUniqueByComposite(COL.landingPages, {
        organizationId: user.organizationId,
        slug: cleanSlug,
      });
      if (dupe && dupe.id !== id) return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      data.slug = cleanSlug;
    }

    const patch: Record<string, any> = {};
    for (const field of ["title", "slug", "description", "template", "theme", "isPublished", "chatbotId", "views", "conversions"]) {
      if (data[field] !== undefined) patch[field] = data[field];
    }
    if (data.content !== undefined) {
      patch.content = typeof data.content === "string" ? data.content : JSON.stringify(data.content);
    }

    const updated = await updateDocData(COL.landingPages, id, patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
