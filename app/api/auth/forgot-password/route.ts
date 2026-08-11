import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPasswordResetCode } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`forgot-password:${ip}`, 8, 3600))) {
    return NextResponse.json({ error: "Too many attempts — try again later" }, { status: 429 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Deliberately return the same success response whether or not the
  // account exists — otherwise this endpoint becomes a way to check which
  // emails have accounts on Merqet.
  if (user) {
    try {
      const code = await createPasswordResetCode(user.id);
      await sendPasswordResetEmail(user.email, code);
    } catch {
      // Resend-cooldown errors etc. — still return success below, don't leak details.
    }
  }

  return NextResponse.json({ ok: true });
}
