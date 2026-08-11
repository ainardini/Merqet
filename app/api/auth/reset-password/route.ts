import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, checkPasswordResetCode, clearPasswordResetCodes } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, code, newPassword } = await req.json();

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    // Generic message — don't reveal whether the account exists.
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  const result = await checkPasswordResetCode(user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await clearPasswordResetCodes(user.id);

  return NextResponse.json({ ok: true });
}
