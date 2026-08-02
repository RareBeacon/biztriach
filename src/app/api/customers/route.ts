export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customers = await prisma.customer.findMany({ where: { organizationId: user.organizationId }, orderBy: { totalSpent: "desc" }, take: 100 });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, email, phone, address } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const customer = await prisma.customer.create({ data: { organizationId: user.organizationId, name, email, phone, address } });
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
