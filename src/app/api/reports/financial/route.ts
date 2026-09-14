export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, countDocs } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";

  try {
    const orgId = user.organizationId;

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayStartIso = todayStart.toISOString();
    const todayEndIso = todayEnd.toISOString();
    const monthStartIso = monthStart.toISOString();

    // Revenue & Expenses (ISO strings compare chronologically in Firestore)
    const todaySales = await findDocs<any>(COL.sales, {
      where: [["organizationId", "==", orgId], ["createdAt", ">=", todayStartIso], ["createdAt", "<=", todayEndIso]],
    });
    const monthSales = await findDocs<any>(COL.sales, {
      where: [["organizationId", "==", orgId], ["createdAt", ">=", monthStartIso]],
    });
    const todayExpenses = await findDocs<any>(COL.expenses, {
      where: [["organizationId", "==", orgId], ["date", ">=", todayStartIso], ["date", "<=", todayEndIso]],
    });
    const monthExpenses = await findDocs<any>(COL.expenses, {
      where: [["organizationId", "==", orgId], ["date", ">=", monthStartIso]],
    });

    const todayRevenue = todaySales.reduce((s: number, sale: any) => s + sale.totalAmount, 0);
    const monthRevenue = monthSales.reduce((s: number, sale: any) => s + sale.totalAmount, 0);
    const todayExpTotal = todayExpenses.reduce((s: number, e: any) => s + e.amount, 0);
    const monthExpTotal = monthExpenses.reduce((s: number, e: any) => s + e.amount, 0);

    // Inventory
    const products = await findDocs<any>(COL.products, { where: [["organizationId", "==", orgId]] });
    const inventoryValue = products.reduce((s: number, p: any) => s + (p.quantity * p.costPrice), 0);
    const lowStock = products.filter(p => p.quantity <= p.lowStockThreshold);

    // Counts
    const totalProducts = products.length;
    const totalCustomers = await countDocs(COL.customers, { where: [["organizationId", "==", orgId]] });

    // Best & worst selling — group sale items by product name in JS
    // (saleItems carry a denormalized organizationId)
    const saleItems = await findDocs<any>(COL.saleItems, {
      where: [["organizationId", "==", orgId]],
    });
    const grouped = new Map<string, { productName: string; quantity: number; totalPrice: number }>();
    for (const item of saleItems) {
      const g = grouped.get(item.productName) || { productName: item.productName, quantity: 0, totalPrice: 0 };
      g.quantity += item.quantity || 0;
      g.totalPrice += item.totalPrice || 0;
      grouped.set(item.productName, g);
    }
    const topSelling = [...grouped.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(g => ({ productName: g.productName, _sum: { quantity: g.quantity, totalPrice: g.totalPrice } }));

    const bestSelling = topSelling[0]?._sum?.quantity ? topSelling[0] : null;
    const leastSelling = topSelling.length > 1 ? topSelling[topSelling.length - 1] : null;

    // Top customers
    const topCustomers = await findDocs(COL.customers, {
      where: [["organizationId", "==", orgId]],
      orderBy: [["totalSpent", "desc"]],
      limit: 5,
    });

    return NextResponse.json({
      summary: {
        todayRevenue,
        todayExpenses: todayExpTotal,
        todayProfit: todayRevenue - todayExpTotal,
        monthRevenue,
        monthExpenses: monthExpTotal,
        monthProfit: monthRevenue - monthExpTotal,
        inventoryValue,
        lowStockCount: lowStock.length,
        totalProducts,
        totalCustomers,
        totalSalesToday: todaySales.length,
        totalSalesMonth: monthSales.length
      },
      lowStock,
      bestSelling,
      leastSelling,
      topCustomers,
      saleItems: topSelling,
      insight: generateInsight(todayRevenue, todayExpTotal, lowStock, bestSelling)
    });

  } catch (e) {
    console.error("Financial report error", e);
    return NextResponse.json({ error: "Failed to load financials" }, { status: 500 });
  }
}

function generateInsight(revenue: number, expenses: number, lowStock: any[], best: any): string {
  if (revenue === 0 && expenses === 0) return "No sales recorded yet. Start tracking via dashboard or WhatsApp: 'Sold 5 bags of rice for ₦85k'.";
  if (lowStock.length > 0) return `Attention: ${lowStock.length} products low on stock (${lowStock[0]?.name}). Restock soon to avoid lost sales. Your best seller is ${best?.productName || "still emerging"}.`;
  if (revenue > expenses) return `Great day! Profit of ₦${(revenue - expenses).toLocaleString()} today. ${best?.productName ? `${best.productName} is driving sales.` : ""} Keep up the momentum.`;
  return `Expenses exceeded revenue today. Review spending and focus on high-margin products. Consider creating a landing page funnel to boost sales.`;
}
