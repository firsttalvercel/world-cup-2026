/**
 * Server-side in-memory cache.
 *
 * Lives at the module level — shared across all requests on the same Node.js
 * instance. Prevents every user from triggering a separate football-data.org
 * call and keeps us well within the free-tier 10 req/min limit even on
 * high-traffic match days.
 *
 * TTL guide:
 *   Live match scores  → 30s   (fresh enough, won't hammer the API)
 *   Group standings    → 5 min (only change after a match finishes)
 *   Fixtures/schedule  → 1 hr  (basically never changes)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const TTL = {
  LIVE: 30_000,        // 30 seconds — active match scores
  STANDINGS: 300_000,  // 5 minutes  — group table updates
  FIXTURES: 3_600_000, // 1 hour     — match schedule
} as const;

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    fetchedAt: Date.now(),
  });
}

export function getCacheAge(key: string): number | null {
  const entry = store.get(key);
  if (!entry) return null;
  return Math.floor((Date.now() - entry.fetchedAt) / 1000); // seconds since last fetch
}

export function invalidateCache(key: string): void {
  store.delete(key);
}
