import { redis } from "@/lib/redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const current = await redis.incr(redisKey);
  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  const ttl = await redis.ttl(redisKey);
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetSeconds: ttl > 0 ? ttl : windowSeconds,
  };
}
