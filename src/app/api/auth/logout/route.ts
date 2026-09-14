import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Sessions now live client-side (Firebase Auth ID tokens) — signing out is a
 * client-side signOut() call. Kept as a compatibility no-op for older callers.
 */
export async function POST() {
  return NextResponse.json({ success: true });
}
