export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, getDoc, createDoc, deleteDocById } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const expenses = await findDocs<any>(COL.expenses, {
      where: [["organizationId", "==", user.organizationId]],
      orderBy: [["date", "desc"]],
      limit: 100,
    });

    // Attach category objects (replaces Prisma include)
    const catIds = [...new Set(expenses.map(e => e.categoryId).filter(Boolean))];
    const cats = await Promise.all(catIds.map(id => getDoc(COL.expenseCategories, id as string)));
    const catMap = new Map<string, any>();
    catIds.forEach((id, i) => { const c = cats[i]; if (c) catMap.set(id as string, c); });
    const withCategory = expenses.map(e => ({
      ...e,
      category: e.categoryId ? catMap.get(e.categoryId) || null : null,
    }));

    return NextResponse.json(withCategory);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, amount, categoryId, description, paymentMethod, date, receiptUrl } = await req.json();
    if (!title || !amount) return NextResponse.json({ error: "Title and amount required" }, { status: 400 });

    const expenseData: Record<string, any> = {
      organizationId: user.organizationId,
      title,
      amount: parseFloat(amount),
      categoryId: categoryId || null,
      description: description || null,
      paymentMethod: paymentMethod || "cash",
      receiptUrl: receiptUrl || null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };

    const expense = await createDoc(COL.expenses, expenseData);

    // Attach category for response parity with the old `include`
    let category = null;
    if (expense.categoryId) category = await getDoc(COL.expenseCategories, expense.categoryId);

    return NextResponse.json({ ...expense, category });
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

  const existing = await getDoc<any>(COL.expenses, id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Expense not found or access denied" }, { status: 404 });
  }
  await deleteDocById(COL.expenses, id);
  return NextResponse.json({ success: true });
}
