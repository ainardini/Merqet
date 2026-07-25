import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";
const SESSION_COOKIE = "campus_trade_session";
const SESSION_DAYS = 30;
const CODE_TTL_MINUTES = 10;
const CODE_RESEND_COOLDOWN_SECONDS = 30;
const MAX_CODE_ATTEMPTS = 5;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, campus: true, emailVerified: true, createdAt: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

// ---- Email verification codes ----

function generateCode() {
  // 6-digit numeric code, zero-padded (e.g. "042917")
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Creates a fresh verification code for a user, invalidating any earlier
 * unused codes. Returns the plaintext code so the caller can email it —
 * only the bcrypt hash is stored.
 */
export async function createVerificationCode(userId: string) {
  const recent = await prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const secondsSince = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsSince < CODE_RESEND_COOLDOWN_SECONDS) {
      throw new Error(`Please wait ${Math.ceil(CODE_RESEND_COOLDOWN_SECONDS - secondsSince)}s before requesting another code`);
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  // Clear out old codes for this user so only the newest one is valid.
  await prisma.verificationCode.deleteMany({ where: { userId } });
  await prisma.verificationCode.create({ data: { userId, codeHash, expiresAt } });

  return code;
}

/**
 * Checks a submitted code against the most recent one issued for this user.
 * Returns { ok: true } or { ok: false, reason } — never throws for a bad code,
 * only for missing/expired state, so callers can show a friendly message.
 */
export async function checkVerificationCode(userId: string, submitted: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false as const, reason: "No code on file — request a new one" };
  if (record.expiresAt < new Date()) return { ok: false as const, reason: "That code expired — request a new one" };
  if (record.attempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false as const, reason: "Too many incorrect attempts — request a new code" };
  }

  const matches = await bcrypt.compare(submitted.trim(), record.codeHash);
  if (!matches) {
    await prisma.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, reason: "Incorrect code" };
  }

  await prisma.verificationCode.deleteMany({ where: { userId } });
  return { ok: true as const };
}
