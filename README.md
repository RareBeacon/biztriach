# Biztriach — AI Business Platform (Firebase Edition)

Biztriach is an AI business platform for SMEs: one AI employee that handles customer support, sales, inventory, WhatsApp business ops, landing pages, and financial reports. This is **v3.0 — fully migrated from Supabase/Postgres to Firebase** (Firestore + Firebase Auth + Firebase Storage).

## Table of Contents
1. [Product Overview](#product-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture (Firebase)](#architecture-firebase)
5. [Installation & Local Setup](#installation--local-setup)
6. [Environment Variables](#environment-variables)
7. [Seeding](#seeding)
8. [Production Deployment](#production-deployment)
9. [Migration Notes (Supabase → Firebase)](#migration-notes-supabase--firebase)

---

## Product Overview
Biztriach serves small-and-medium businesses by providing instant customer support answers, WhatsApp-driven business operations ("Sold 5 bags rice for ₦85k" → inventory + sales auto-update), and a full business management suite: users can sign up, create AI agents, feed private business manuals, monitor visitor threads, take over conversations, and review analytics in real time.

---

## Key Features
- **AI Support Chatbots (RAG)**: ingest PDF, DOCX, TXT, Markdown and website crawls; 384-dim embeddings; hybrid semantic + keyword retrieval with citations.
- **WhatsApp Cloud API (dual-mode)**: owner numbers run business ops (sales/purchases/expenses parsed from natural language), customer numbers get AI support replies from the knowledge base.
- **Business Suite**: inventory, sales, expenses, customers, leads, funnels, landing pages, financial reports.
- **Firebase Authentication**: email/password auth with ID tokens; manual approval workflow (PENDING → APPROVED) with admin panel; password reset emails.
- **Firebase Storage**: original knowledge-base files persisted per organization (`organizations/{orgId}/documents/{docId}/...`).
- **Streaming Conversations**: word-by-word streaming AI responses with citation sources.
- **Helpdesk Inbox & Takeover**: pause the AI and chat directly with visitors.
- **Operational Analytics**: daily message counts, trends, CSAT, top questions.

---

## Technology Stack
- **Frontend**: Next.js App Router (React, TypeScript), Tailwind CSS
- **Database**: Cloud Firestore (collections mirror the old Prisma models)
- **Auth**: Firebase Authentication (client SDK sign-in + admin-verified ID tokens)
- **File Storage**: Firebase Storage (original uploaded documents)
- **RAG Ingestion**: `pdf-parse`/`pdfreader` (PDF), `mammoth` (DOCX)
- **AI Provider**: OpenRouter API (defaults to Gemini 2.5 Flash)
- **Data layer**: `src/lib/firestore.ts` — Prisma-shaped helpers (findDocs/getDoc/createDoc/updateDocData/...)

---

## Architecture (Firebase)

```
Browser (firebase client SDK)
  └─ signIn / register / password reset
  └─ AuthProvider patches window.fetch → attaches Authorization: Bearer <ID token>

Next.js API routes (firebase-admin)
  └─ getUserFromRequest() verifies the ID token → loads users/{uid} (+ organization)
  └─ Firestore collections: users, organizations, chatbots, documents, documentChunks,
     conversations, messages, analytics, products, productCategories, customers, sales,
     saleItems, expenseCategories, expenses, leads, landingPages, funnels, funnelSteps,
     emailCampaigns, emailLogs, whatsappAccounts, whatsappConversations, whatsappMessages,
     apiKeys, platformSettings, announcements, websiteSources, knowledgeGaps, businessProfiles
  └─ Firebase Storage: original knowledge-base files per org

RAG flow (unchanged behavior)
  [Document Upload] → Storage (original) + text extraction → chunking → embeddings → documentChunks
  [Visitor Question] → embedding → fetch chunks → cosineSimilarity (JS) → context injection → AI stream
```

Conventions:
- Document IDs are UUIDs; user doc id === Firebase Auth uid.
- Dates are stored as ISO-8601 UTC strings (JSON-identical to the Prisma era; lexicographic == chronological).
- Unique constraints (user email, org slug, landing-page slug per org, expense-category name per org, one WhatsAppAccount/BusinessProfile per org) are enforced with pre-check queries.
- Cascade deletes (chatbot → documents → chunks → conversations → messages) are implemented in the routes.

---

## Installation & Local Setup

```bash
npm install
cp .env.example .env.local   # fill in Firebase + OpenRouter values
npm run dev
```

Firebase project setup:
1. Create a project at https://console.firebase.google.com
2. **Authentication → Sign-in method → enable Email/Password**
3. **Firestore Database → Create database** (production or test mode)
4. **Storage → Get started** (for original file persistence)
5. Project Settings → General → Your apps → **Web app** → copy the `firebaseConfig` values into the `NEXT_PUBLIC_FIREBASE_*` env vars
6. Project Settings → Service accounts → **Generate new private key** → copy `project_id`, `client_email`, `private_key` into the `FIREBASE_*` env vars

Recommended Firestore security rules (all access is server-side via firebase-admin, which bypasses rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

---

## Environment Variables
See [.env.example](.env.example) for the full annotated list:
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET` (server/admin)
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` (browser SDK)
- `OPENROUTER_API_KEY`, `AI_MODEL` (AI)
- `NEXT_PUBLIC_APP_URL`, `WHATSAPP_VERIFY_TOKEN`, `ADMIN_SETUP_KEY`

---

## Seeding
```bash
# default demo admin: admin@biztriach.com / password123
npm run seed

# custom admin
node scripts/seed-firebase.js --email=you@example.com --password=secret --name="You" --org="Your Business"
```
Creates the Auth user, profile (ADMIN/APPROVED), organization, default chatbot, business profile, and default categories. Idempotent — safe to re-run.

---

## Production Deployment (Vercel)
1. Push to GitHub (the Vercel project auto-deploys `main`).
2. Set all env vars above in Vercel → Project → Settings → Environment Variables (Production + Preview).
3. Run `npm run seed` once locally against production Firebase creds (or from a one-off job) to bootstrap the first admin.
4. Admin approval workflow: new signups start as `PENDING`; approve them from `/dashboard/admin` (or pre-approve via the `ADMIN_EMAILS` list in `src/app/api/auth/register/route.ts`).

---

## Migration Notes (Supabase → Firebase)
- Prisma + PostgreSQL replaced by Firestore via `src/lib/firestore.ts` helpers.
- bcrypt/JWT cookie sessions replaced by Firebase Auth; API routes verify `Authorization: Bearer <ID token>` (attached transparently by `AuthProvider`).
- `prisma.$transaction` (registration) → Firestore `runTransaction`.
- `groupBy` (financial report) → fetch + JS reduce; sale items carry a denormalized `organizationId`.
- pgvector was never actually used — embeddings were already JSON strings with JS cosine similarity, so RAG behavior is unchanged.
- Original uploaded documents now persist in Firebase Storage (previously discarded after text extraction).
- The old Supabase project (`biztriach-production`) can be paused/deleted once cut-over is verified.
