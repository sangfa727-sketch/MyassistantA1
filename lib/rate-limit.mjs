const DEFAULT_MAX_ENTRIES = 10_000;
const DEFAULT_CLEANUP_INTERVAL_MS = 30_000;

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive safe integer.`);
  }
}

export function createInMemoryRateLimiter({
  windowMs,
  maxRequests,
  maxEntries = DEFAULT_MAX_ENTRIES,
  cleanupIntervalMs = DEFAULT_CLEANUP_INTERVAL_MS
}) {
  positiveInteger(windowMs, "windowMs");
  positiveInteger(maxRequests, "maxRequests");
  positiveInteger(maxEntries, "maxEntries");
  positiveInteger(cleanupIntervalMs, "cleanupIntervalMs");

  const buckets = new Map();
  let lastCleanupAt = 0;
  let hasCleaned = false;

  function cleanupExpired(now) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
    lastCleanupAt = now;
    hasCleaned = true;
  }

  function maybeCleanup(now, force = false) {
    if (force || !hasCleaned || now - lastCleanupAt >= cleanupIntervalMs) {
      cleanupExpired(now);
    }
  }

  function capacityRetryAfter(now) {
    let earliestReset = Infinity;
    for (const bucket of buckets.values()) {
      if (bucket.resetAt < earliestReset) earliestReset = bucket.resetAt;
    }
    if (!Number.isFinite(earliestReset)) return Math.max(1, Math.ceil(windowMs / 1000));
    return Math.max(1, Math.ceil((earliestReset - now) / 1000));
  }

  return {
    check(key, now = Date.now()) {
      if (!Number.isFinite(now) || now < 0) {
        throw new TypeError("now must be a finite, non-negative timestamp.");
      }

      const normalizedKey =
        typeof key === "string" && key.trim()
          ? key.trim().slice(0, 128)
          : "unknown";

      maybeCleanup(now);

      let current = buckets.get(normalizedKey);
      if (current && current.resetAt <= now) {
        buckets.delete(normalizedKey);
        current = undefined;
      }

      if (!current) {
        if (buckets.size >= maxEntries) {
          // Fail closed instead of evicting an active client's bucket or allowing
          // unbounded memory growth when an attacker supplies many unique keys.
          maybeCleanup(now, true);
          current = buckets.get(normalizedKey);
          if (!current && buckets.size >= maxEntries) {
            return { allowed: false, retryAfter: capacityRetryAfter(now) };
          }
        }

        buckets.set(normalizedKey, {
          count: 1,
          resetAt: now + windowMs
        });
        return { allowed: true, retryAfter: 0 };
      }

      current.count += 1;
      if (current.count <= maxRequests) {
        return { allowed: true, retryAfter: 0 };
      }

      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      };
    }
  };
}
