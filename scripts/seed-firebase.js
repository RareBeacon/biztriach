/**
 * Biztriach — Firestore + Firebase Auth seed
 *
 * Usage:
 *   node scripts/seed-firebase.js
 *   node scripts/seed-firebase.js --email=you@example.com --password=secret --name="You" --org="Your Business"
 *
 * Env required (or use GOOGLE_APPLICATION_CREDENTIALS path to the service account JSON):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET (optional)
 *
 * Creates (idempotent — safe to re-run):
 *   1 Auth user + users/{uid} profile (role ADMIN, status APPROVED)
 *   2 organizations/{orgId}
 *   3 chatbots/{id} — default "Biztriach Assistant"
 *   4 businessProfiles/{id}
 *   5 default product + expense categories
 */
const crypto = require("crypto");

function arg(name, fallback) {
  const match = process.argv.find(a => a.startsWith(`--${name}=`));
  return match ? match.split("=").slice(1).join("=") : fallback;
}

const SEED_EMAIL = arg("email", process.env.SEED_ADMIN_EMAIL || "admin@biztriach.com");
const SEED_PASSWORD = arg("password", process.env.SEED_ADMIN_PASSWORD || "password123");
const SEED_NAME = arg("name", process.env.SEED_ADMIN_NAME || "Demo Admin");
const SEED_ORG = arg("org", process.env.SEED_ORG_NAME || "Acme Corporation");

async function main() {
  const admin = require("firebase-admin");

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.error(
      "❌ Missing Firebase credentials. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY " +
      "(or GOOGLE_APPLICATION_CREDENTIALS) in the environment."
    );
    process.exit(1);
  }

  const db = admin.firestore();
  const auth = admin.auth();
  const now = new Date().toISOString();
  const newId = () => crypto.randomUUID();

  console.log("🌱 Starting Firestore seeding...");

  // 1. Auth user (create or fetch)
  let userRecord;
  try {
    userRecord = await auth.createUser({
      uid: newId(),
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      displayName: SEED_NAME,
      emailVerified: true,
    });
    console.log(`👤 Created Firebase Auth user: ${SEED_EMAIL} (uid ${userRecord.uid})`);
  } catch (e) {
    if (e.code === "auth/email-already-exists") {
      userRecord = await auth.getUserByEmail(SEED_EMAIL);
      console.log(`👤 Auth user already exists: ${SEED_EMAIL} (uid ${userRecord.uid})`);
    } else {
      throw e;
    }
  }

  // 2. Skip if profile already exists
  const existingProfile = await db.collection("users").doc(userRecord.uid).get();
  if (existingProfile.exists) {
    console.log("✅ User profile already exists — nothing to do. (Delete the users/{uid} doc to re-seed.)");
    return;
  }

  // 3. Organization
  const orgId = newId();
  await db.collection("organizations").doc(orgId).set({
    id: orgId,
    name: SEED_ORG,
    slug: `${SEED_ORG.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`🏢 Created organization: ${SEED_ORG}`);

  // 4. User profile (doc id === uid)
  await db.collection("users").doc(userRecord.uid).set({
    id: userRecord.uid,
    name: SEED_NAME,
    email: SEED_EMAIL,
    role: "ADMIN",
    status: "APPROVED",
    organizationId: orgId,
    approvedAt: now,
    approvedBy: null,
    suspendedReason: null,
    lastLoginAt: null,
    apiKeyPreference: "PLATFORM",
    openaiApiKey: null,
    openrouterApiKey: null,
    geminiApiKey: null,
    claudeApiKey: null,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`📝 Created user profile: ${SEED_NAME} (ADMIN / APPROVED)`);

  // 5. Custom claims
  await auth.setCustomUserClaims(userRecord.uid, { role: "ADMIN", status: "APPROVED" });
  console.log(`🔑 Set custom claims: role=ADMIN, status=APPROVED`);

  // 6. Default chatbot
  const chatbotId = newId();
  await db.collection("chatbots").doc(chatbotId).set({
    id: chatbotId,
    name: "Biztriach Assistant",
    organizationId: orgId,
    instructions: `You are ${SEED_ORG}'s AI business employee. You are knowledgeable, trustworthy, and helpful. You help with customer support, sales inquiries, and general business questions. Always be professional, warm, and solution-focused. If you don't know something, offer to connect with a human. Business: ${SEED_ORG}. Industry: general SME.`,
    greetingMessage: "Hello! How can I help you today?",
    themeColor: "#7c3aed",
    suggestions: '["What is Biztriach?", "How can you help my business?"]',
    personality: null,
    welcomeDelayMs: 2500,
    enableSound: true,
    enableCsat: true,
    enableHumanTakeover: true,
    deploymentChannels: '["website"]',
    createdAt: now,
    updatedAt: now,
  });
  console.log(`🤖 Created chatbot: Biztriach Assistant`);

  // 7. Business profile
  const bpRef = db.collection("businessProfiles").doc(newId());
  await bpRef.set({
    id: bpRef.id,
    organizationId: orgId,
    businessName: SEED_ORG,
    industry: "general",
    description: `${SEED_ORG} - Business powered by Biztriach AI`,
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
    createdAt: now,
    updatedAt: now,
  });
  console.log(`🏬 Created business profile`);

  // 8. Default categories
  const productCategories = [
    { name: "General", color: "#7c3aed" },
    { name: "Top Selling", color: "#10b981" },
  ];
  const expenseCategories = [
    { name: "Rent", color: "#7c3aed" },
    { name: "Fuel", color: "#f59e0b" },
    { name: "Purchases", color: "#3b82f6" },
    { name: "Transportation", color: "#10b981" },
    { name: "Salary", color: "#ef4444" },
  ];
  let batch = db.batch();
  for (const c of productCategories) {
    const ref = db.collection("productCategories").doc(newId());
    batch.set(ref, { id: ref.id, organizationId: orgId, name: c.name, color: c.color, description: null, createdAt: now, updatedAt: now });
  }
  for (const c of expenseCategories) {
    const ref = db.collection("expenseCategories").doc(newId());
    batch.set(ref, { id: ref.id, organizationId: orgId, name: c.name, color: c.color, createdAt: now, updatedAt: now });
  }
  await batch.commit();
  console.log(`🗂️  Created ${productCategories.length + expenseCategories.length} default categories`);

  console.log("\n✅ Seed complete!");
  console.log(`   Login at your app with:  ${SEED_EMAIL} / ${SEED_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
