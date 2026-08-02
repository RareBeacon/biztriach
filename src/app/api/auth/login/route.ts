import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check status for manual billing MVP
    if (user.status === "PENDING") {
      return NextResponse.json({ error: "Account pending approval. Please wait for admin approval after payment verification. Contact support: ogungboyeopeyemiphilip@gmail.com", status: "PENDING_PAYMENT" }, { status: 403 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: `Account suspended: ${user.suspendedReason || "Contact admin"}` }, { status: 403 });
    }

    if (user.status === "REJECTED") {
      return NextResponse.json({ error: "Account rejected. Please contact admin for reactivation." }, { status: 403 });
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || "",
        status: user.status,
        role: user.role
      },
    });

    response.headers.set("Set-Cookie", `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure=${process.env.NODE_ENV === "production"}`);

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during login" }, { status: 500 });
  }
}
