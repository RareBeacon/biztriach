export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const funnels = await prisma.funnel.findMany({ where: { organizationId: user.organizationId }, include: { steps: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(funnels);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, description, aiStrategy } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // Auto-generate funnel strategy if not provided
    let strategy = aiStrategy;
    if (!strategy) {
      strategy = JSON.stringify({
        targetAudience: "SME customers",
        steps: ["Landing Page", "Lead Form", "Thank You", "Email Sequence", "AI Follow-up"],
        generatedAt: new Date().toISOString()
      });
    }

    const funnel = await prisma.funnel.create({
      data: {
        organizationId: user.organizationId,
        name,
        description,
        aiStrategy: typeof strategy === "string" ? strategy : JSON.stringify(strategy),
        steps: {
          create: [
            { order: 1, type: "landing_page", title: "Landing Page", config: JSON.stringify({ template: "hero" }) },
            { order: 2, type: "form", title: "Lead Capture Form", config: JSON.stringify({ fields: ["name", "email", "phone"] }) },
            { order: 3, type: "thank_you", title: "Thank You Page", config: JSON.stringify({ message: "Thank you! We'll be in touch soon." }) },
            { order: 4, type: "email", title: "Email Welcome Sequence", config: JSON.stringify({ emails: 3 }) },
            { order: 5, type: "ai_followup", title: "AI Follow-up", config: JSON.stringify({ delay: "1 hour" }) }
          ]
        }
      },
      include: { steps: true }
    });

    return NextResponse.json(funnel);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create funnel" }, { status: 500 });
  }
}
