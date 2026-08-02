export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const expenses = await prisma.expense.findMany({
      where: { organizationId: user.organizationId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 100
    });
    return NextResponse.json(expenses);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, amount, categoryId, description, paymentMethod, date } = await req.json();
    if (!title || !amount) return NextResponse.json({ error: "Title and amount required" }, { status: 400 });

    const expense = await prisma.expense.create({
      data: {
        organizationId: user.organizationId,
        title,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        description,
        paymentMethod: paymentMethod || "cash",
        date: date ? new Date(date) : new Date()
      },
      include: { category: true }
    });
    return NextResponse.json(expense);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
