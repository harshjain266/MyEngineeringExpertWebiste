import Redis from "ioredis";

/**
 * Redis client (lazy singleton).
 *
 * Used for session storage, response caching, rate-limiting and
 * leaderboard/progress counters. During UI-first development we keep this
 * lazy so the app boots without a live Redis. Call `getRedis()` only from
 * server code (route handlers, server actions).
 */

declare global {
  // eslint-disable-next-line no-var
  var __ee_redis__: Redis | undefined;
}

let warned = false;

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (!warned) {
      console.warn("[redis] REDIS_URL not set — running without Redis.");
      warned = true;
    }
    return null;
  }

  if (!global.__ee_redis__) {
    global.__ee_redis__ = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
  }
  return global.__ee_redis__;
}

/** Cache-aside helper: returns cached JSON or computes + stores it. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return compute();

  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
    const value = await compute();
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return value;
  } catch {
    // Fail open — never let a cache outage break a page.
    return compute();
  }
}
