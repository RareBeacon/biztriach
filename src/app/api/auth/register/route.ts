import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";

const ADMIN_EMAILS = ["ogungboyeopeyemiphilip@gmail.com", "phoslabceo@gmail.com"];

export async function POST(req: Request) {
  try {
    const { name, email, password, organizationName, businessType } = await req.json();

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json({ error: "Missing required registration fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Determine if admin auto-approve
    const isAdmin = ADMIN_EMAILS.includes(email);
    const initialStatus = isAdmin ? "APPROVED" : "PENDING";

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug: `${organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2,6)}`
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          organizationId: org.id,
          status: initialStatus,
          role: isAdmin ? "ADMIN" : "USER",
          approvedAt: isAdmin ? new Date() : null,
        },
      });

      const chatbot = await tx.chatbot.create({
        data: {
          name: "Biztriach Assistant",
          organizationId: org.id,
          instructions: `You are ${organizationName}'s AI business employee. You are knowledgeable, trustworthy, and helpful. You help with customer support, sales inquiries, and general business questions. Always be professional, warm, and solution-focused. If you don't know something, offer to connect with a human. Business: ${organizationName}. Industry: ${businessType || "general SME"}.`,
        },
      });

      // Create business profile
      await tx.businessProfile.create({
        data: {
          organizationId: org.id,
          businessName: organizationName,
          industry: businessType || "general",
          description: `${organizationName} - Business powered by Biztriach AI`,
          tone: "professional",
          brandVoice: "knowledgeable, trustworthy, helpful",
        }
      });

      // Create default categories
      await tx.productCategory.createMany({
        data: [
          { organizationId: org.id, name: "General", color: "#7c3aed" },
          { organizationId: org.id, name: "Top Selling", color: "#10b981" },
        ]
      });

      await tx.expenseCategory.createMany({
        data: [
          { organizationId: org.id, name: "Rent", color: "#7c3aed" },
          { organizationId: org.id, name: "Fuel", color: "#f59e0b" },
          { organizationId: org.id, name: "Purchases", color: "#3b82f6" },
          { organizationId: org.id, name: "Transportation", color: "#10b981" },
          { organizationId: org.id, name: "Salary", color: "#ef4444" },
        ]
      });

      return { user, org, chatbot };
    });

    const token = signToken({ userId: result.user.id, email: result.user.email });

    // Send welcome pending email (non-blocking)
    try {
      if (!isAdmin) {
        const tmpl = emailTemplates.welcomePending(name);
        await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
      }
    } catch (e) {
      console.error("Welcome email failed", e);
    }

    const response = NextResponse.json({
      success: true,
      status: result.user.status,
      message: isAdmin ? "Admin account approved instantly" : "Account created - pending approval. Please check email.",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organizationId: result.org.id,
        organizationName: result.org.name,
        status: result.user.status,
        role: result.user.role
      },
    });

    response.headers.set(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure=${process.env.NODE_ENV === "production"}`
    );

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during registration" }, { status: 500 });
  }
}
