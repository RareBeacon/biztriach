/**
 * Auth — Firebase Authentication (ID tokens) + Firestore user profiles.
 *
 * The client attaches the Firebase ID token as `Authorization: Bearer <token>`
 * on every fetch (see src/components/AuthProvider.tsx), and this helper keeps
 * the exact same getUserFromRequest() contract the API routes always used.
 */
import { firebaseAuth, firestore } from "./firebase";
import { COL, getDoc } from "./firestore";
import { DocumentData } from "firebase-admin/firestore";

export interface AuthUser extends DocumentData {
  id: string;
  name: string;
  email: string;
  role: string; // USER | ADMIN
  status: string; // PENDING | APPROVED | SUSPENDED | REJECTED
  organizationId?: string | null;
  organization?: DocumentData | null;
}

/** Extract the bearer token from a Request (Authorization header first, then cookie). */
export function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, curr) => {
      const idx = curr.indexOf("=");
      if (idx > 0) acc[curr.slice(0, idx).trim()] = curr.slice(idx + 1).trim();
      return acc;
    }, {} as Record<string, string>);
    return cookies["token"] || "";
  }
  return "";
}

/**
 * Verify the Firebase ID token and load the user profile (with organization).
 * Returns null when unauthenticated or the user no longer exists.
 */
export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  try {
    const token = extractBearerToken(req);
    if (!token) return null;

    const decoded = await firebaseAuth().verifyIdToken(token, true);
    if (!decoded?.uid) return null;

    const user = await getDoc<AuthUser>(COL.users, decoded.uid);
    if (!user) return null;

    if (user.organizationId) {
      const org = await getDoc(COL.organizations, user.organizationId);
      user.organization = org;
    } else {
      user.organization = null;
    }

    // Keep claims fresh (cheap no-op when already in sync)
    const wanted = { role: user.role || "USER", status: user.status || "PENDING" };
    if (decoded.role !== wanted.role || decoded.status !== wanted.status) {
      try {
        await firebaseAuth().setCustomUserClaims(decoded.uid, wanted);
      } catch (e) {
        console.warn("[Auth] Failed to refresh custom claims:", e);
      }
    }

    return user;
  } catch (error) {
    // Expired/revoked tokens land here — treat as unauthenticated.
    return null;
  }
}

/** Require an authenticated, approved, non-suspended user. Throws { status, message } style errors. */
export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (user.status === "SUSPENDED") {
    throw Object.assign(new Error("Your account has been suspended."), { status: 403 });
  }
  return user;
}
