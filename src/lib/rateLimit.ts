/**
 * SupportIQ - Rate Limiting & Security
 * Simple in-memory rate limiter with sliding window
 * Production: replace with Redis / Upstash in Vercel env
 */

interface Entry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, Entry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto cleanup every 5 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (this.cleanupInterval && typeof this.cleanupInterval === "object" && "unref" in this.cleanupInterval) {
        (this.cleanupInterval as any).unref();
      }
    }
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now - entry.lastRequest > 10 * 60 * 1000) {
        this.store.delete(key);
      }
    }
  }

  // Returns { allowed, remaining, resetInMs }
  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetInMs: number; retryAfter?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, firstRequest: now, lastRequest: now });
      return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
    }

    const windowElapsed = now - entry.firstRequest;

    if (windowElapsed > windowMs) {
      // Reset window
      this.store.set(key, { count: 1, firstRequest: now, lastRequest: now });
      return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
    }

    if (entry.count >= limit) {
      const resetInMs = windowMs - windowElapsed;
      return {
        allowed: false,
        remaining: 0,
        resetInMs,
        retryAfter: Math.ceil(resetInMs / 1000)
      };
    }

    entry.count++;
    entry.lastRequest = now;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetInMs: windowMs - windowElapsed
    };
  }

  reset(key: string) {
    this.store.delete(key);
  }
}

// Singleton
const globalForLimiter = global as unknown as { rateLimiter: InMemoryRateLimiter };
export const rateLimiter = globalForLimiter.rateLimiter || new InMemoryRateLimiter();
if (process.env.NODE_ENV !== "production") globalForLimiter.rateLimiter = rateLimiter;

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export function getRateLimitKey(req: Request, prefix = "global"): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";
  const visitorId = (() => {
    try {
      const url = new URL(req.url);
      return url.searchParams.get("visitorId") || "";
    } catch { return ""; }
  })();

  // Prefer visitorId if available, fallback to IP
  const identifier = visitorId || ip;
  return `${prefix}:${identifier}:${ip}`;
}

export function rateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
      retryAfter
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0"
      }
    }
  );
}

// Default configs for different endpoints
export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 60 * 1000, keyPrefix: "chat" }, // 20 req/min per visitor
  documents: { limit: 10, windowMs: 60 * 1000, keyPrefix: "docs" }, // 10 uploads/min
  auth: { limit: 5, windowMs: 60 * 1000, keyPrefix: "auth" }, // 5 login attempts/min
  general: { limit: 100, windowMs: 60 * 1000, keyPrefix: "general" }
};
