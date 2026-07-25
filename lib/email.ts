// Sends the 6-digit verification code by email.
//
// Uses Resend (https://resend.com) via a plain fetch call — no SDK needed,
// just an API key. Resend's free tier is enough for a campus marketplace to
// start with. If RESEND_API_KEY isn't set, this falls back to logging the
// code to the server console instead of emailing it, so signup still works
// while you're developing locally before you've wired up a real provider.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || "Campus Trade <onboarding@resend.dev>";

export async function sendVerificationEmail(to: string, code: string) {
  if (!RESEND_API_KEY) {
    console.log(`\n[DEV MODE — no RESEND_API_KEY set] Verification code for ${to}: ${code}\n`);
    return { devMode: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: `Your Campus Trade verification code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Enter this code to finish creating your Campus Trade account:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
          <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send verification email: ${text}`);
  }

  return { devMode: false };
}
