export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, getDoc, createDoc, updateDocData, deleteDocById } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");

  try {
    // Firestore has no "contains" — fetch org products and filter in JS (SME scale)
    let products = await findDocs<any>(COL.products, {
      where: [["organizationId", "==", user.organizationId]],
      orderBy: [["updatedAt", "desc"]],
      limit: 100,
    });
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => (p.name || "").toLowerCase().includes(q));
    }
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    // Attach category objects (replaces Prisma include)
    const catIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
    const cats = await Promise.all(catIds.map(id => getDoc(COL.productCategories, id as string)));
    const catMap = new Map<string, any>();
    catIds.forEach((id, i) => { const c = cats[i]; if (c) catMap.set(id as string, c); });
    const withCategory = products.map(p => ({
      ...p,
      category: p.categoryId ? catMap.get(p.categoryId) || null : null,
    }));

    return NextResponse.json(withCategory);
  } catch (e) {
    console.error("Inventory GET error", e);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, sku, description, costPrice, sellingPrice, quantity, categoryId, lowStockThreshold } = await req.json();

    if (!name || sellingPrice === undefined) {
      return NextResponse.json({ error: "Name and selling price required" }, { status: 400 });
    }

    const product = await createDoc(COL.products, {
      organizationId: user.organizationId,
      name,
      sku: sku || `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      description: description || null,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice),
      quantity: parseInt(quantity) || 0,
      categoryId: categoryId || null,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
    });

    return NextResponse.json(product);
  } catch (e) {
    console.error("Inventory POST error", e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Ownership check
    const existing = await getDoc<any>(COL.products, id);
    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }

    const patch: Record<string, any> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.sku !== undefined) patch.sku = data.sku;
    if (data.description !== undefined) patch.description = data.description;
    if (data.categoryId !== undefined) patch.categoryId = data.categoryId;
    if (data.costPrice !== undefined) patch.costPrice = parseFloat(data.costPrice);
    if (data.sellingPrice !== undefined) patch.sellingPrice = parseFloat(data.sellingPrice);
    if (data.quantity !== undefined) patch.quantity = parseInt(data.quantity);
    if (data.lowStockThreshold !== undefined) patch.lowStockThreshold = parseInt(data.lowStockThreshold);

    const product = await updateDocData(COL.products, id, patch);
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    // Ownership check
    const existing = await getDoc<any>(COL.products, id);
    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }
    await deleteDocById(COL.products, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
