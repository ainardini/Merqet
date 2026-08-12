export default function PrivacyPage() {
  return (
    <div className="form-page" style={{ maxWidth: 640 }}>
      <h1 className="page-title" style={{ fontSize: 30 }}>Privacy Policy</h1>
      <p className="subtitle">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <div className="form-card">
        <div style={{ lineHeight: 1.75, fontSize: 14.5 }}>

          <p style={{ marginBottom: 16 }}>
            This explains what information Merqet collects, why, and what we do (and don't do) with it.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>What we collect</h2>
          <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
            <li><b>Account info:</b> your name, email address, campus (optional), and profile picture (optional)</li>
            <li><b>Content you create:</b> listings, photos, offers, chat messages, voice notes, and reviews</li>
            <li><b>Usage data:</b> basic, non-identifying analytics about how the site is used (via Vercel Analytics), and IP addresses for the purpose of rate-limiting abuse (e.g. preventing spam signups)</li>
          </ul>
          <p style={{ marginBottom: 16 }}>
            We don't collect payment information — Merqet never processes payments, so we never see your
            card, bank, or payment app details.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>How we use it</h2>
          <p style={{ marginBottom: 16 }}>
            We use your information to run the marketplace: showing your listings to other users, delivering
            messages and offers, sending you email notifications (like a new offer or a verification code),
            calculating your seller rating, and preventing spam and abuse.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>What we don't do</h2>
          <p style={{ marginBottom: 16 }}>
            We don't sell your data. We don't share it with advertisers. We don't use it for anything beyond
            operating Merqet.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Who else sees it</h2>
          <p style={{ marginBottom: 16 }}>
            We use a small number of service providers to run Merqet, and your data passes through them as
            part of that:
          </p>
          <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
            <li><b>Vercel</b> — hosting, and the database that stores your account and listing data</li>
            <li><b>Resend</b> — sends emails on our behalf (verification codes, notifications)</li>
            <li><b>Vercel Blob</b> — stores uploaded photos and voice notes</li>
            <li><b>Vercel Analytics</b> — aggregated, non-identifying usage analytics</li>
          </ul>
          <p style={{ marginBottom: 16 }}>
            Other users can see your name, campus, profile picture, listings, and reviews you've received —
            that's the nature of a public marketplace. Your email address is never shown to other users.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Cookies</h2>
          <p style={{ marginBottom: 16 }}>
            We use a single, secure, httpOnly session cookie to keep you logged in. It doesn't track you
            across other websites, and we don't use advertising or third-party tracking cookies.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Security</h2>
          <p style={{ marginBottom: 16 }}>
            Passwords are hashed (never stored in plain text), all traffic is encrypted over HTTPS, and
            verification and password-reset codes are hashed and expire after 10 minutes.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Your data, your choices</h2>
          <p style={{ marginBottom: 16 }}>
            You can update your name, campus, and profile picture any time from your{" "}
            <a href="/profile">Profile</a> page. You can permanently delete your account and data any time
            from the "Delete account" section at the bottom of that page — or contact us if you'd rather we
            do it for you.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Children's privacy</h2>
          <p style={{ marginBottom: 16 }}>
            Merqet isn't intended for children, and we don't knowingly collect data from anyone under 13.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Changes to this policy</h2>
          <p style={{ marginBottom: 16 }}>
            If we make material changes, we'll update the date at the top of this page.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Questions?</h2>
          <p>
            Reach out via the <a href="/contact">Contact Us</a> page.
          </p>

        </div>
      </div>
    </div>
  );
}
