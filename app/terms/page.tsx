export default function TermsPage() {
  return (
    <div className="form-page" style={{ maxWidth: 640 }}>
      <h1 className="page-title" style={{ fontSize: 30 }}>Terms of Use</h1>
      <p className="subtitle">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <div className="form-card">
        <div style={{ lineHeight: 1.75, fontSize: 14.5 }}>

          <p style={{ marginBottom: 16 }}>
            These terms govern your use of Merqet. By creating an account, you agree to them. If you don't
            agree, please don't use Merqet.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>1. What Merqet is</h2>
          <p style={{ marginBottom: 16 }}>
            Merqet is a listings and messaging platform that connects buyers and sellers. We are not a party
            to any transaction that happens between users — we don't buy, sell, own, inspect, or ship any
            item listed on the platform, and we don't process payments. All payment happens directly between
            buyer and seller, in person, using whatever method they agree to.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>2. Your account</h2>
          <p style={{ marginBottom: 16 }}>
            You must provide a real name and a working email address, and verify that email to use Merqet.
            You're responsible for keeping your password secure and for all activity under your account. One
            account per person — don't create multiple accounts to get around a suspension or a block.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>3. Listings</h2>
          <p style={{ marginBottom: 16 }}>
            Listings must accurately describe the item, its condition, and its price. You may not list:
          </p>
          <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
            <li>Illegal items, or items you don't have the right to sell</li>
            <li>Weapons, ammunition, or explosives</li>
            <li>Hazardous, flammable, or controlled substances (including alcohol and drugs)</li>
            <li>Counterfeit or stolen goods</li>
            <li>Live animals</li>
            <li>Anything else prohibited by applicable law</li>
          </ul>
          <p style={{ marginBottom: 16 }}>
            We may remove any listing that violates these terms, without notice.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>4. Offers and purchases</h2>
          <p style={{ marginBottom: 16 }}>
            When a seller accepts an offer, the buyer has 48 hours to confirm the purchase before it expires
            and the listing reopens. Accepting an offer is a commitment to sell at that price if the buyer
            confirms in time — please act in good faith. Merqet does not guarantee that any transaction will
            actually complete, and we are not responsible if a buyer or seller backs out, doesn't show up, or
            misrepresents an item.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>5. Meeting up and paying</h2>
          <p style={{ marginBottom: 16 }}>
            All meetups and payments happen entirely outside of Merqet, between you and the other user. We
            strongly recommend meeting in public, well-lit places, bringing a friend if you can, and trusting
            your judgment. Merqet has no way to verify the identity, intentions, or trustworthiness of any
            user beyond what they've told us, and we are not responsible for what happens when you meet
            someone from the platform.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>6. Reviews, reports, and blocking</h2>
          <p style={{ marginBottom: 16 }}>
            Reviews must be honest and based on a real transaction — don't post fake reviews, for yourself or
            anyone else. If someone behaves badly, you can report them or block them; reports are reviewed by
            our team, and we may warn, suspend, or ban accounts based on them at our discretion.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>7. Prohibited conduct</h2>
          <p style={{ marginBottom: 16 }}>
            Don't use Merqet to harass, threaten, or discriminate against other users; scam or defraud anyone;
            post spam or send unsolicited bulk messages; attempt to bypass rate limits or security measures;
            or scrape, copy, or misuse other users' data.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>8. No warranty, limitation of liability</h2>
          <p style={{ marginBottom: 16 }}>
            Merqet is provided "as is." We don't guarantee the accuracy of listings, the trustworthiness of
            users, or that the service will be uninterrupted or error-free. To the fullest extent permitted by
            law, Merqet is not liable for any loss, damage, or dispute arising from a transaction, meetup, or
            interaction between users.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>9. Suspension and termination</h2>
          <p style={{ marginBottom: 16 }}>
            We may suspend or terminate your account if you violate these terms. You can stop using Merqet at
            any time — you can permanently delete your account and data yourself from your Profile page,
            or contact us if you'd rather we do it for you.
          </p>

          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>10. Changes to these terms</h2>
          <p style={{ marginBottom: 16 }}>
            We may update these terms from time to time. If we make material changes, we'll update the date
            at the top of this page.
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
