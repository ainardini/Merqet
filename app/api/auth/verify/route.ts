import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkVerificationCode, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return NextResponse.json({ error: "No account found for that email" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "This account is already verified" }, { status: 400 });
  }

  const result = await checkVerificationCode(user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });

  const token = createSessionToken(user.id);
  setSessionCookie(token);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
