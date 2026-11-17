import test from "node:test";
import assert from "node:assert/strict";
import {
  SESSION_TTL_SECONDS,
  createSessionCookieValue,
  sessionCookieName,
  verifySessionCookieValue
} from "../lib/session-cookie.mjs";

const sessionId = "7b5b6c64-3b4e-4a3e-9c9a-9d6b5d8b8c11";
const secret = "a1-test-session-secret-with-at-least-32-bytes";
const now = Date.UTC(2026, 10, 17, 5, 30, 0);

test("creates a session-specific cookie name", () => {
  assert.equal(sessionCookieName(sessionId), `a1_session_${sessionId}`);
  assert.throws(() => sessionCookieName("not-a-uuid"), /UUID/);
});

test("signs and verifies a session cookie value", () => {
  const token = createSessionCookieValue(sessionId, secret, now);
  assert.equal(verifySessionCookieValue(sessionId, token, secret, now), true);
  assert.equal(Number(token.split(".")[0]), Math.floor(now / 1000) + SESSION_TTL_SECONDS);
});

test("does not allow a cookie to be replayed for another session", () => {
  const token = createSessionCookieValue(sessionId, secret, now);
  const otherSession = "0d5b6c64-3b4e-4a3e-9c9a-9d6b5d8b8c11";
  assert.equal(verifySessionCookieValue(otherSession, token, secret, now), false);
});

test("rejects tampered signatures and malformed tokens", () => {
  const token = createSessionCookieValue(sessionId, secret, now);
  const [expiresAt, signature] = token.split(".");
  const replacement = signature[0] === "A" ? "B" : "A";
  assert.equal(verifySessionCookieValue(sessionId, `${expiresAt}.${replacement}${signature.slice(1)}`, secret, now), false);
  assert.equal(verifySessionCookieValue(sessionId, "invalid", secret, now), false);
});

test("rejects expired and excessively long-lived tokens", () => {
  const token = createSessionCookieValue(sessionId, secret, now);
  assert.equal(verifySessionCookieValue(sessionId, token, secret, now + SESSION_TTL_SECONDS * 1000), false);
  const farFuture = `${Math.floor(now / 1000) + SESSION_TTL_SECONDS + 3600}.${token.split(".")[1]}`;
  assert.equal(verifySessionCookieValue(sessionId, farFuture, secret, now), false);
});

test("requires a strong configured secret", () => {
  assert.throws(() => createSessionCookieValue(sessionId, "short", now), /32 bytes/);
  assert.throws(() => verifySessionCookieValue(sessionId, "invalid", "short", now), /32 bytes/);
});
