import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken && redisUrl.startsWith("http")) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "enterprise_ai:ratelimit:login",
    });
  } catch (error) {
    console.error("[Redis] Failed to initialize Upstash Redis:", error);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  isConfigured: boolean;
}

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  if (!ratelimit) {
    // If Redis is not yet configured, allow request but log status
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60000,
      isConfigured: false,
    };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      isConfigured: true,
    };
  } catch (error) {
    console.error("[Redis] Rate limit evaluation error:", error);
    // In fail-open mode for network hiccups to avoid blocking legitimate logins, or return error
    return {
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
      isConfigured: true,
    };
  }
}

export async function checkRedisHealth(): Promise<{ status: "connected" | "not_configured" | "error"; latencyMs?: number }> {
  if (!redis) {
    return { status: "not_configured" };
  }

  try {
    const start = Date.now();
    await redis.ping();
    return { status: "connected", latencyMs: Date.now() - start };
  } catch {
    return { status: "error" };
  }
}

export function getRedisClient(): Redis | null {
  return redis;
}
