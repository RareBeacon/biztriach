import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * UX-level routing guard only — NOT a security boundary.
 *
 * With Firebase Auth, sessions live client-side (ID tokens in IndexedDB),
 * so the browser sets a lightweight `biztriach_session` flag cookie on
 * sign-in/out (see AuthProvider). Every API route independently enforces
 * real authentication by verifying the Firebase ID token server-side.
 */
export function middleware(request: NextRequest) {
  const sessionFlag = request.cookies.get("biztriach_session")?.value;
  const { pathname } = request.nextUrl;

  // 1. User wants to access dashboard but is not logged in
  if (pathname.startsWith("/dashboard") && !sessionFlag) {
    const loginUrl = new URL("/login", request.url);
    // Remember original destination
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. User is already logged in but trying to visit login/register
  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && sessionFlag) {
    return NextResponse.redirect(new URL("/dashboard/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
