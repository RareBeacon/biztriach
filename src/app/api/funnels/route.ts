export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, findDocs, createDoc } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const funnels = await findDocs<any>(COL.funnels, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["createdAt", "desc"]],
  });

  // Attach steps (replaces Prisma include with orderBy)
  const withSteps = await Promise.all(
    funnels.map(async (funnel) => ({
      ...funnel,
      steps: await findDocs(COL.funnelSteps, {
        where: [["funnelId", "==", funnel.id]],
        orderBy: [["order", "asc"]],
      }),
    }))
  );

  return NextResponse.json(withSteps);
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

    const funnel = await createDoc(COL.funnels, {
      organizationId: user.organizationId,
      name,
      description: description || null,
      aiStrategy: typeof strategy === "string" ? strategy : JSON.stringify(strategy),
      isActive: true,
      totalViews: 0,
      totalConversions: 0,
    });

    const defaultSteps = [
      { order: 1, type: "landing_page", title: "Landing Page", config: JSON.stringify({ template: "hero" }) },
      { order: 2, type: "form", title: "Lead Capture Form", config: JSON.stringify({ fields: ["name", "email", "phone"] }) },
      { order: 3, type: "thank_you", title: "Thank You Page", config: JSON.stringify({ message: "Thank you! We'll be in touch soon." }) },
      { order: 4, type: "email", title: "Email Welcome Sequence", config: JSON.stringify({ emails: 3 }) },
      { order: 5, type: "ai_followup", title: "AI Follow-up", config: JSON.stringify({ delay: "1 hour" }) }
    ];
    const steps = [];
    for (const step of defaultSteps) {
      steps.push(await createDoc(COL.funnelSteps, { ...step, funnelId: funnel.id, landingPageId: null }));
    }

    return NextResponse.json({ ...funnel, steps });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create funnel" }, { status: 500 });
  }
}
