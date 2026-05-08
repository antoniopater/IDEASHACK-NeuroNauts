import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "rdbridge_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

let devFallbackSessionSecret: string | null = null;

function sessionSecret(): string {
  const fromEnv = process.env.AUTH_SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SESSION_SECRET must be set in production — generate with `openssl rand -base64 32` and add to your environment."
    );
  }

  if (!devFallbackSessionSecret) {
    devFallbackSessionSecret = randomBytes(32).toString("base64url");
  }
  return devFallbackSessionSecret;
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64);
  return `${toBase64Url(salt)}.${toBase64Url(digest)}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  // Preferred format: base64url(salt).base64url(digest)
  if (hash.includes(".")) {
    const [saltB64, digestB64] = hash.split(".");
    if (!saltB64 || !digestB64) return false;
    const salt = fromBase64Url(saltB64);
    const expected = fromBase64Url(digestB64);
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  }

  // Legacy demo format: hex(salt):hex(digest)
  if (hash.includes(":")) {
    const [saltHex, digestHex] = hash.split(":");
    if (!saltHex || !digestHex) return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(digestHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  }

  return false;
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  const [userId, expiresAtRaw, signature] = token.split(".");
  if (!userId || !expiresAtRaw || !signature) return null;
  const payload = `${userId}.${expiresAtRaw}`;
  const expected = signPayload(payload);
  if (signature !== expected) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  return { userId };
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}

const blockedPublicDomains = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "yahoo.com",
  "proton.me",
  "protonmail.com",
  "wp.pl",
  "onet.pl",
  "interia.pl",
  "o2.pl",
]);

export function isLikelyAcademicEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain || blockedPublicDomains.has(domain)) return false;
  return (
    domain.endsWith(".edu") ||
    domain.endsWith(".edu.pl") ||
    domain.includes(".ac.") ||
    domain.endsWith(".uni.pl") ||
    domain.endsWith(".pwr.edu.pl") ||
    domain.endsWith(".pw.edu.pl")
  );
}
