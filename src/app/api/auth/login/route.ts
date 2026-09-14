import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, updateDocData } from "@/lib/firestore";

/**
 * POST /api/auth/login
 * With Firebase Auth, credential verification happens client-side
 * (signInWithEmailAndPassword). This endpoint completes the login:
 * it verifies the ID token, enforces the manual-approval workflow
 * (PENDING / SUSPENDED / REJECTED), and returns the session user.
 */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "No Biztriach profile found for this account. Please register first." },
        { status: 401 }
      );
    }

    // Check status for manual billing MVP
    if (user.status === "PENDING") {
      return NextResponse.json(
        {
          error:
            "Account pending approval. Please wait for admin approval after payment verification. Contact support: ogungboyeopeyemiphilip@gmail.com",
          status: "PENDING_PAYMENT",
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: `Account suspended: ${user.suspendedReason || "Contact admin"}` },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        { error: "Account rejected. Please contact admin for reactivation." },
        { status: 403 }
      );
    }

    // Update last login (best-effort)
    await updateDocData(COL.users, user.id, { lastLoginAt: new Date().toISOString() }).catch(
      () => {}
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || "",
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during login" }, { status: 500 });
  }
}
