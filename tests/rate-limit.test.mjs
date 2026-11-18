import test from "node:test";
import assert from "node:assert/strict";
import { createInMemoryRateLimiter } from "../lib/rate-limit.mjs";

test("allows the configured request count and reports a retry delay", () => {
  const limiter = createInMemoryRateLimiter({
    windowMs: 5_000,
    maxRequests: 2
  });

  assert.deepEqual(limiter.check("client-a", 1_000), { allowed: true, retryAfter: 0 });
  assert.deepEqual(limiter.check("client-a", 2_000), { allowed: true, retryAfter: 0 });
  assert.deepEqual(limiter.check("client-a", 2_500), { allowed: false, retryAfter: 4 });
});

test("starts a fresh fixed window after the previous window expires", () => {
  const limiter = createInMemoryRateLimiter({
    windowMs: 1_000,
    maxRequests: 1
  });

  assert.equal(limiter.check("client-a", 1_000).allowed, true);
  assert.equal(limiter.check("client-a", 1_500).allowed, false);
  assert.equal(limiter.check("client-a", 2_000).allowed, true);
});

test("fails closed at capacity without evicting an active client's bucket", () => {
  const limiter = createInMemoryRateLimiter({
    windowMs: 1_000,
    maxRequests: 2,
    maxEntries: 1
  });

  assert.equal(limiter.check("client-a", 0).allowed, true);
  assert.equal(limiter.check("client-b", 100).allowed, false);
  assert.equal(limiter.check("client-a", 200).allowed, true);
  assert.equal(limiter.check("client-a", 300).allowed, false);
  assert.equal(limiter.check("client-b", 1_000).allowed, true);
});

test("removes expired buckets during periodic cleanup", () => {
  const limiter = createInMemoryRateLimiter({
    windowMs: 50,
    maxRequests: 1,
    maxEntries: 2,
    cleanupIntervalMs: 100
  });

  assert.equal(limiter.check("client-a", 0).allowed, true);
  assert.equal(limiter.check("client-b", 0).allowed, true);
  assert.equal(limiter.check("client-c", 100).allowed, true);
});

test("bounds and normalizes client keys", () => {
  const limiter = createInMemoryRateLimiter({
    windowMs: 1_000,
    maxRequests: 1,
    maxEntries: 1
  });
  const longKey = "x".repeat(200);

  assert.equal(limiter.check(longKey, 0).allowed, true);
  assert.equal(limiter.check("x".repeat(128), 100).allowed, false);
  assert.equal(limiter.check("   ", 100).allowed, false);
});

test("rejects invalid limiter configuration and timestamps", () => {
  assert.throws(
    () => createInMemoryRateLimiter({ windowMs: 0, maxRequests: 1 }),
    /windowMs/
  );

  const limiter = createInMemoryRateLimiter({ windowMs: 1_000, maxRequests: 1 });
  assert.throws(() => limiter.check("client-a", -1), /timestamp/);
});
