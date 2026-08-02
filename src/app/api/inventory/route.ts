export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");

  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId: user.organizationId,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(categoryId ? { categoryId } : {})
      },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    return NextResponse.json(products);
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

    const product = await prisma.product.create({
      data: {
        organizationId: user.organizationId,
        name,
        sku: sku || `SKU-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        description,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice),
        quantity: parseInt(quantity) || 0,
        categoryId: categoryId || null,
        lowStockThreshold: parseInt(lowStockThreshold) || 5
      }
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        costPrice: data.costPrice !== undefined ? parseFloat(data.costPrice) : undefined,
        sellingPrice: data.sellingPrice !== undefined ? parseFloat(data.sellingPrice) : undefined,
        quantity: data.quantity !== undefined ? parseInt(data.quantity) : undefined,
        lowStockThreshold: data.lowStockThreshold !== undefined ? parseInt(data.lowStockThreshold) : undefined
      }
    });
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
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
