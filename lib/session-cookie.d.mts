export const SESSION_TTL_SECONDS: number;

export function sessionCookieName(sessionId: string): string;

export function createSessionCookieValue(
  sessionId: string,
  secret: string,
  now?: number
): string;

export function verifySessionCookieValue(
  sessionId: string,
  value: string | undefined,
  secret: string,
  now?: number
): boolean;
