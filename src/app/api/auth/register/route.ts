import { NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase";
import { COL, runTransaction, txHelpers, findUniqueBy, newId } from "@/lib/firestore";
import { sendEmail, emailTemplates } from "@/lib/email";

const ADMIN_EMAILS = ["ogungboyeopeyemiphilip@gmail.com", "phoslabceo@gmail.com"];

/**
 * POST /api/auth/register
 * The client has already created the Firebase Auth account
 * (createUserWithEmailAndPassword) and sends its ID token via the
 * Authorization header. Here we create the Firestore profile + org defaults.
 */
export async function POST(req: Request) {
  try {
    // Verify the Firebase ID token WITHOUT requiring an existing Firestore
    // profile — this route is what creates the profile. (A brand-new user has
    // a valid token but no profile yet; getUserFromRequest would 401 them.)
    const bearerToken = extractBearerToken(req);
    let decoded: { uid?: string; email?: string } | null = null;
    try {
      decoded = bearerToken ? await firebaseAuth().verifyIdToken(bearerToken, true) : null;
    } catch {
      decoded = null;
    }
    if (!decoded?.uid) {
      return NextResponse.json(
        { error: "Missing or invalid authentication token" },
        { status: 401 }
      );
    }
    const authUid = decoded.uid;
    const authEmail = (decoded.email || "").toLowerCase();

    const { name, organizationName, businessType } = await req.json();
    const email = authEmail;

    if (!name || !email || !organizationName) {
      return NextResponse.json({ error: "Missing required registration fields" }, { status: 400 });
    }

    // Guard: profile already exists for this uid or email
    const existingByEmail = await findUniqueBy(COL.users, "email", email);
    if (existingByEmail) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    // Determine if admin auto-approve
    const isAdmin = ADMIN_EMAILS.includes(email);
    const initialStatus = isAdmin ? "APPROVED" : "PENDING";
    const nowIso = new Date().toISOString();

    const result = await runTransaction(async (tx) => {
      const orgId = newId();
      txHelpers.create(tx, COL.organizations, {
        name: organizationName,
        slug: `${organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`,
      }, orgId);

      txHelpers.create(tx, COL.users, {
        name,
        email,
        // Firebase Auth owns credentials — no password hash stored
        role: isAdmin ? "ADMIN" : "USER",
        status: initialStatus,
        organizationId: orgId,
        approvedAt: isAdmin ? nowIso : null,
        approvedBy: null,
        suspendedReason: null,
        lastLoginAt: null,
        apiKeyPreference: "PLATFORM",
        openaiApiKey: null,
        openrouterApiKey: null,
        geminiApiKey: null,
        claudeApiKey: null,
      }, authUid); // user doc id == Firebase Auth uid

      const chatbotId = newId();
      txHelpers.create(tx, COL.chatbots, {
        name: "Biztriach Assistant",
        organizationId: orgId,
        instructions: `You are ${organizationName}'s AI business employee. You are knowledgeable, trustworthy, and helpful. You help with customer support, sales inquiries, and general business questions. Always be professional, warm, and solution-focused. If you don't know something, offer to connect with a human. Business: ${organizationName}. Industry: ${businessType || "general SME"}.`,
        greetingMessage: "Hello! How can I help you today?",
        themeColor: "#7c3aed",
        suggestions: '["What is Biztriach?", "How can you help my business?"]',
        personality: null,
        welcomeDelayMs: 2500,
        enableSound: true,
        enableCsat: true,
        enableHumanTakeover: true,
        deploymentChannels: '["website"]',
      }, chatbotId);

      txHelpers.create(tx, COL.businessProfiles, {
        organizationId: orgId,
        businessName: organizationName,
        industry: businessType || "general",
        description: `${organizationName} - Business powered by Biztriach AI`,
        website: null,
        tone: "professional",
        brandVoice: "knowledgeable, trustworthy, helpful",
        formality: "balanced",
        greetingStyle: "Hello! How can I help you today?",
        language: "en",
        logo: null,
        address: null,
        phone: null,
        escalationEmail: null,
        enableInternetKnowledge: false,
        enableWebsiteCrawl: true,
      });

      txHelpers.create(tx, COL.productCategories, {
        organizationId: orgId,
        name: "General",
        color: "#7c3aed",
      });
      txHelpers.create(tx, COL.productCategories, {
        organizationId: orgId,
        name: "Top Selling",
        color: "#10b981",
      });

      const defaultExpenseCategories = [
        { name: "Rent", color: "#7c3aed" },
        { name: "Fuel", color: "#f59e0b" },
        { name: "Purchases", color: "#3b82f6" },
        { name: "Transportation", color: "#10b981" },
        { name: "Salary", color: "#ef4444" },
      ];
      for (const c of defaultExpenseCategories) {
        txHelpers.create(tx, COL.expenseCategories, {
          organizationId: orgId,
          name: c.name,
          color: c.color,
        });
      }

      return { userId: authUid, orgId, chatbotId };
    });

    // Sync custom claims (role/status) for fast token-based checks
    try {
      await firebaseAuth().setCustomUserClaims(authUid, {
        role: isAdmin ? "ADMIN" : "USER",
        status: initialStatus,
      });
    } catch (e) {
      console.warn("Failed to set custom claims:", e);
    }

    // Send welcome pending email (non-blocking)
    try {
      if (!isAdmin) {
        const tmpl = emailTemplates.welcomePending(name);
        await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
      }
    } catch (e) {
      console.error("Welcome email failed", e);
    }

    return NextResponse.json({
      success: true,
      status: initialStatus,
      message: isAdmin
        ? "Admin account approved instantly"
        : "Account created - pending approval. Please check email.",
      user: {
        id: result.userId,
        name,
        email,
        organizationId: result.orgId,
        organizationName,
        status: initialStatus,
        role: isAdmin ? "ADMIN" : "USER",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
