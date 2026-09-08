import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the cookie (must mirror Secure flag used when setting it)
  const isProd = process.env.NODE_ENV === "production";
  response.headers.set(
    "Set-Cookie",
    `token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProd ? "; Secure" : ""}`
  );
  
  return response;
}
