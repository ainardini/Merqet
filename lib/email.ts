// Sends transactional emails — verification codes, offer activity, and new
// message alerts — via Resend (https://resend.com) using a plain fetch call,
// no SDK needed. If RESEND_API_KEY isn't set, everything falls back to
// logging to the server console instead of emailing, so the app still works
// while developing locally before a real provider is wired up.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || "Merqet <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://merqet.vercel.app";

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`\n[DEV MODE — no RESEND_API_KEY set] Email to ${to}: ${subject}\n`);
    return { devMode: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    // Notification emails are best-effort — log the failure but never throw,
    // since a failed email shouldn't break the offer/message action itself.
    console.error(`Failed to send email to ${to}:`, await res.text());
    return { devMode: false, failed: true };
  }

  return { devMode: false };
}

function wrapper(title: string, bodyHtml: string, ctaText: string, ctaUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
      <h2>${title}</h2>
      ${bodyHtml}
      <a href="${ctaUrl}" style="display: inline-block; margin-top: 16px; background: #d6ff3d; color: #0d0d10; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 14px;">${ctaText}</a>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, code: string) {
  return send(
    to,
    `Your Merqet verification code: ${code}`,
    `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Enter this code to finish creating your Merqet account:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
        <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `
  );
}

export async function sendPasswordResetEmail(to: string, code: string) {
  return send(
    to,
    `Your Merqet password reset code: ${code}`,
    `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Enter this code to set a new password for your Merqet account:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
        <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      </div>
    `
  );
}

export async function sendNewOfferEmail(to: string, listingTitle: string, amount: string, listingId: string) {
  return send(
    to,
    `New offer on "${listingTitle}"`,
    wrapper(
      "You've got an offer",
      `<p>Someone offered <b>${amount}</b> on your listing "<b>${listingTitle}</b>". Head to My Lists to accept or decline it.</p>`,
      "View offer",
      `${SITE_URL}/my-listings`
    )
  );
}

export async function sendOfferAcceptedEmail(to: string, listingTitle: string, amount: string, listingId: string) {
  return send(
    to,
    `Your offer on "${listingTitle}" was accepted!`,
    wrapper(
      "Offer accepted",
      `<p>Your offer of <b>${amount}</b> on "<b>${listingTitle}</b>" was accepted. You have 48 hours to confirm the purchase before it expires.</p>`,
      "Confirm purchase",
      `${SITE_URL}/listings/${listingId}`
    )
  );
}

export async function sendNewMessageEmail(to: string, senderName: string, listingTitle: string) {
  return send(
    to,
    `New message from ${senderName}`,
    wrapper(
      "New message",
      `<p><b>${senderName}</b> sent you a message about "<b>${listingTitle}</b>".</p>`,
      "Reply",
      `${SITE_URL}/inbox`
    )
  );
}
