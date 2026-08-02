export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";

  try {
    const orgId = user.organizationId;

    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0));
    const todayEnd = new Date(now.setHours(23,59,59,999));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Revenue & Expenses
    const todaySales = await prisma.sale.findMany({ where: { organizationId: orgId, createdAt: { gte: todayStart, lte: todayEnd } } });
    const monthSales = await prisma.sale.findMany({ where: { organizationId: orgId, createdAt: { gte: monthStart } } });
    const todayExpenses = await prisma.expense.findMany({ where: { organizationId: orgId, date: { gte: todayStart, lte: todayEnd } } });
    const monthExpenses = await prisma.expense.findMany({ where: { organizationId: orgId, date: { gte: monthStart } } });

    const todayRevenue = todaySales.reduce((s, sale) => s + sale.totalAmount, 0);
    const monthRevenue = monthSales.reduce((s, sale) => s + sale.totalAmount, 0);
    const todayExpTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const monthExpTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

    // Inventory
    const products = await prisma.product.findMany({ where: { organizationId: orgId } });
    const inventoryValue = products.reduce((s, p) => s + (p.quantity * p.costPrice), 0);
    const lowStock = products.filter(p => p.quantity <= p.lowStockThreshold);
    
    // Counts
    const totalProducts = products.length;
    const totalCustomers = await prisma.customer.count({ where: { organizationId: orgId } });

    // Best & worst selling (from sale items)
    const saleItems = await prisma.saleItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, totalPrice: true },
      where: { sale: { organizationId: orgId } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    });

    const bestSelling = saleItems[0]?._sum?.quantity ? saleItems[0] : null;
    const leastSelling = saleItems.length > 1 ? saleItems[saleItems.length - 1] : null;

    // Top customers
    const topCustomers = await prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { totalSpent: "desc" },
      take: 5
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
      saleItems,
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
