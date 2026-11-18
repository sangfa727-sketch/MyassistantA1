export type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

export function createInMemoryRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  maxEntries?: number;
  cleanupIntervalMs?: number;
}): {
  check(key: string, now?: number): RateLimitResult;
};
