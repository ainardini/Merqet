import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Don't reveal whether the email exists — just say a code was sent either way.
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  try {
    const code = await createVerificationCode(user.id);
    await sendVerificationEmail(user.email, code);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Couldn't resend code" }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
