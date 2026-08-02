export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const sales = await prisma.sale.findMany({
      where: { organizationId: user.organizationId },
      include: { items: true, customer: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100)
    });
    return NextResponse.json(sales);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { customerId, customerName, items, paymentMethod, channel, notes } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item required" }, { status: 400 });
    }

    // Calculate totals and update inventory
    let totalAmount = 0, totalProfit = 0;
    const saleNumber = `SALE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    // Resolve customer if name provided but no ID
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerName) {
      const existing = await prisma.customer.findFirst({ where: { organizationId: user.organizationId, name: customerName } });
      if (existing) finalCustomerId = existing.id;
      else {
        const newCust = await prisma.customer.create({ data: { organizationId: user.organizationId, name: customerName } });
        finalCustomerId = newCust.id;
      }
    }

    // Process items
    const saleItemsData = [];
    for (const item of items) {
      const product = item.productId ? await prisma.product.findUnique({ where: { id: item.productId } }) : null;
      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || product?.sellingPrice || 0;
      const total = qty * unitPrice;
      const profit = product ? (unitPrice - product.costPrice) * qty : total * 0.2;

      totalAmount += total;
      totalProfit += profit;

      saleItemsData.push({
        productId: item.productId || null,
        productName: product?.name || item.productName || "Product",
        quantity: qty,
        unitPrice,
        totalPrice: total,
        profit
      });

      // Update inventory
      if (product) {
        await prisma.product.update({ where: { id: product.id }, data: { quantity: { decrement: qty } } });
      }
    }

    const sale = await prisma.sale.create({
      data: {
        organizationId: user.organizationId,
        customerId: finalCustomerId || null,
        saleNumber,
        totalAmount,
        profit: totalProfit,
        paymentMethod: paymentMethod || "cash",
        channel: channel || "manual",
        notes,
        items: { create: saleItemsData }
      },
      include: { items: true, customer: true }
    });

    // Update customer stats
    if (finalCustomerId) {
      await prisma.customer.update({
        where: { id: finalCustomerId },
        data: {
          totalSpent: { increment: totalAmount },
          totalOrders: { increment: 1 },
          lastPurchaseAt: new Date()
        }
      });
    }

    return NextResponse.json(sale);
  } catch (e) {
    console.error("Sale creation failed", e);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
