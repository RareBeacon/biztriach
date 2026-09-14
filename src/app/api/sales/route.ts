export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  COL,
  findDocs,
  findUniqueBy,
  getDoc,
  createDoc,
  createManyDocs,
  updateDocData,
  FieldValue,
} from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const sales = await findDocs<any>(COL.sales, {
      where: [["organizationId", "==", user.organizationId]],
      orderBy: [["createdAt", "desc"]],
      limit: Math.min(limit, 100),
    });

    // Attach items + customer (replaces Prisma include)
    const withDetails = await Promise.all(
      sales.map(async (sale) => ({
        ...sale,
        items: await findDocs(COL.saleItems, { where: [["saleId", "==", sale.id]] }),
        customer: sale.customerId ? await getDoc(COL.customers, sale.customerId) : null,
      }))
    );

    return NextResponse.json(withDetails);
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
    const saleNumber = `SALE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Resolve customer if name provided but no ID
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerName) {
      const existing = await findDocs<any>(COL.customers, {
        where: [["organizationId", "==", user.organizationId], ["name", "==", customerName]],
        limit: 1,
      });
      if (existing[0]) finalCustomerId = existing[0].id;
      else {
        const newCust = await createDoc(COL.customers, {
          organizationId: user.organizationId,
          name: customerName,
          email: null,
          phone: null,
          address: null,
          totalSpent: 0,
          totalOrders: 0,
        });
        finalCustomerId = newCust.id;
      }
    }

    // Process items
    const saleItemsData: any[] = [];
    for (const item of items) {
      const product = item.productId ? await getDoc<any>(COL.products, item.productId) : null;
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
        profit,
      });

      // Update inventory
      if (product) {
        await updateDocData(COL.products, product.id, {
          quantity: FieldValue.increment(-qty),
        });
      }
    }

    const sale = await createDoc(COL.sales, {
      organizationId: user.organizationId,
      customerId: finalCustomerId || null,
      saleNumber,
      totalAmount,
      discount: 0,
      profit: totalProfit,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "paid",
      channel: channel || "manual",
      notes: notes || null,
    });

    // Create sale items (denormalized organizationId for fast reporting)
    await createManyDocs(
      COL.saleItems,
      saleItemsData.map(si => ({ ...si, saleId: sale.id, organizationId: user.organizationId }))
    );

    // Update customer stats
    if (finalCustomerId) {
      await updateDocData(COL.customers, finalCustomerId, {
        totalSpent: FieldValue.increment(totalAmount),
        totalOrders: FieldValue.increment(1),
        lastPurchaseAt: new Date().toISOString(),
      });
    }

    // Response parity with the old `include: { items, customer }`
    return NextResponse.json({
      ...sale,
      items: await findDocs(COL.saleItems, { where: [["saleId", "==", sale.id]] }),
      customer: finalCustomerId ? await getDoc(COL.customers, finalCustomerId) : null,
    });
  } catch (e) {
    console.error("Sale creation failed", e);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
