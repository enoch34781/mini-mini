import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mmc_admin_session";
const sessionDurationSeconds = 60 * 60 * 12;

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  const submittedEmail = createHash("sha256").update(email.trim().toLowerCase()).digest();
  const configuredEmail = createHash("sha256").update(expectedEmail.trim().toLowerCase()).digest();
  const submittedPassword = createHash("sha256").update(password).digest();
  const configuredPassword = createHash("sha256").update(expectedPassword).digest();
  return isAdminConfigured() && timingSafeEqual(submittedEmail, configuredEmail) && timingSafeEqual(submittedPassword, configuredPassword);
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const payload = Buffer.from(JSON.stringify({ role: "admin", expiresAt })).toString("base64url");
  const signature = createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("base64url");
  return { token: `${payload}.${signature}`, maxAge: sessionDurationSeconds };
}

function isValidToken(token: string | undefined) {
  if (!token || !isAdminConfigured()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; expiresAt?: number };
    return data.role === "admin" && Number(data.expiresAt) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  return isValidToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  return isAdminSession();
}