import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email, password, name, campus } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing && existing.emailVerified) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // If they started signing up before but never verified, let them retry
  // with a fresh code instead of getting stuck on a dead account.
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, name, campus: campus || null } })
    : await prisma.user.create({ data: { email: normalizedEmail, passwordHash, name, campus: campus || null } });

  const code = await createVerificationCode(user.id);
  await sendVerificationEmail(user.email, code);

  return NextResponse.json({ needsVerification: true, email: user.email });
}
