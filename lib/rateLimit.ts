import { prisma } from "./db";

/**
 * Returns true if the action is allowed, false if the caller has hit the
 * limit. Records a hit on every allowed call. `key` should identify who/what
 * is being limited, e.g. `offer:${userId}` or `signup:${ip}`.
 *
 * This is a plain sliding-window counter backed by Postgres — no Redis or
 * external rate-limit service needed. Fine at hobby/small-app scale; if
 * you outgrow it, swap this function's internals for something like
 * Upstash Ratelimit without touching any call sites.
 */
export async function checkRateLimit(key: string, maxHits: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } });
  if (count >= maxHits) return false;

  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}
