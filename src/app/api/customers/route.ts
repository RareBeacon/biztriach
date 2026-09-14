export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, createDoc } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customers = await findDocs(COL.customers, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["totalSpent", "desc"]],
    limit: 100,
  });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, email, phone, address } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const customer = await createDoc(COL.customers, {
      organizationId: user.organizationId,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      totalSpent: 0,
      totalOrders: 0,
    });
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
