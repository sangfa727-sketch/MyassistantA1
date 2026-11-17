import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeSessionId(sessionId) {
  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)) {
    throw new TypeError("A valid session UUID is required.");
  }
  return sessionId.toLowerCase();
}

function assertSecret(secret) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new TypeError("A1_SESSION_SECRET must contain at least 32 bytes.");
  }
}

function signatureFor(sessionId, expiresAt, secret) {
  return createHmac("sha256", secret)
    .update(`a1-session:${sessionId}:${expiresAt}`)
    .digest("base64url");
}

export function sessionCookieName(sessionId) {
  return `a1_session_${normalizeSessionId(sessionId)}`;
}

export function createSessionCookieValue(sessionId, secret, now = Date.now()) {
  const normalizedId = normalizeSessionId(sessionId);
  assertSecret(secret);
  if (!Number.isFinite(now) || now < 0) throw new TypeError("A valid clock value is required.");

  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  return `${expiresAt}.${signatureFor(normalizedId, expiresAt, secret)}`;
}

export function verifySessionCookieValue(sessionId, value, secret, now = Date.now()) {
  const normalizedId = normalizeSessionId(sessionId);
  assertSecret(secret);
  if (typeof value !== "string" || !Number.isFinite(now) || now < 0) return false;

  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;

  const expiresAt = Number(match[1]);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds || expiresAt > nowSeconds + SESSION_TTL_SECONDS + 60) {
    return false;
  }

  const expected = Buffer.from(signatureFor(normalizedId, expiresAt, secret), "base64url");
  const actual = Buffer.from(match[2], "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
