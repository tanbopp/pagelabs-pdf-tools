import { type MiddlewareHandler } from "hono";
import { config } from "./config.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const rateLimiter: MiddlewareHandler = async (c, next) => {
  // Only apply to POST /jobs
  if (c.req.method !== "POST" || !c.req.path.endsWith("/jobs")) {
    return next();
  }

  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "anonymous_client";

  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + config.rateLimit.windowMs };
    rateLimitMap.set(ip, entry);
  } else {
    entry.count++;
  }

  if (entry.count > config.rateLimit.anonLimit) {
    return c.json(
      {
        error_code: "RATE_LIMITED",
        error_message: "You have reached the limit. Please try again in an hour.",
      },
      429
    );
  }

  await next();
};
