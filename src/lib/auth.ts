import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "zenx_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  email: string;
  exp: number;
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL ?? "";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET (or NEXTAUTH_SECRET) environment variable.");
  }
  return secret;
}

function createSignature(base: string) {
  const secret = getSessionSecret();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(base);
  return hmac.digest("base64url");
}

export function createAdminSession(email: string): string {
  const payload: AdminSession = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createSignature(base);
  return `${base}.${signature}`;
}

export function verifyAdminSession(token: string | undefined | null): AdminSession | null {
  if (!token) return null;

  const [base, signature] = token.split(".");
  if (!base || !signature) return null;

  const expectedSignature = createSignature(base);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as AdminSession;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (error) {
    console.warn("Failed to parse admin session payload", error);
    return null;
  }
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = getAdminEmail();
  const expectedPassword = getAdminPassword();

  if (!expectedEmail || !expectedPassword) {
    console.error("Admin credentials are not configured in environment variables.");
    return false;
  }

  const normalizedExpectedEmail = expectedEmail.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordMatches = password === expectedPassword;

  return normalizedEmail === normalizedExpectedEmail && passwordMatches;
}

export async function getCurrentAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifyAdminSession(token ?? null);
}

export async function assertAdminSession(): Promise<AdminSession> {
  const session = await getCurrentAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function setAdminSessionCookie(response: Response | import("next/server").NextResponse, token: string) {
  const secure = process.env.NODE_ENV === "production";
  const cookieOptions = {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure,
    path: "/",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_SECONDS,
  };

  if ("cookies" in response) {
    response.cookies.set(cookieOptions);
  }
}

export function clearAdminSessionCookie(response: Response | import("next/server").NextResponse) {
  if ("cookies" in response) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
}

export async function ensureAdminApiAccess(): Promise<AdminSession | null> {
  try {
    return await getCurrentAdminSession();
  } catch (error) {
    console.error("Failed to resolve admin session", error);
    return null;
  }
}

export const ADMIN_COOKIE_NAME = SESSION_COOKIE_NAME;
export const ADMIN_SESSION_TTL = SESSION_TTL_SECONDS;
