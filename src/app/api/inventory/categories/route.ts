export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cats = await prisma.productCategory.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, color, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const cat = await prisma.productCategory.create({ data: { organizationId: user.organizationId, name, color: color || "#7c3aed", description } });
  return NextResponse.json(cat);
}
