export default function AboutPage() {
  return (
    <div className="form-page" style={{ maxWidth: 640 }}>
      <h1 className="page-title" style={{ fontSize: 30 }}>About Merqet</h1>
      <div className="form-card">
        <div style={{ lineHeight: 1.75, fontSize: 14.5 }}>
          <p style={{ marginBottom: 16 }}>
            Merqet is a simple online flea market for buying and selling with people around you. No shipping,
            no listing fees, and no online payments — you chat, agree on a price, meet up, and pay however
            you like, in person.
          </p>
          <p style={{ marginBottom: 16 }}>
            The idea is straightforward: a lot of stuff worth selling — textbooks, furniture, electronics,
            clothes — never gets sold because listing it somewhere feels like too much work, or because
            shipping small, cheap items doesn't make sense. Merqet is built for the stuff that's easiest to
            just hand off in person.
          </p>
          <p style={{ marginBottom: 16 }}>
            A few things we care about:
          </p>
          <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
            <li>Keeping it free — no fees on listings or sales</li>
            <li>Keeping payment simple — cash, bank transfer, whatever works for you and the other person</li>
            <li>Real trust signals — ratings and reviews are tied to actual completed purchases</li>
            <li>Staying safe — report and block tools, and a nudge to meet in public places</li>
          </ul>
          <p>
            Got feedback or an idea? We'd genuinely like to hear it — reach out from the{" "}
            <a href="/contact">Contact Us</a> page.
          </p>
        </div>
      </div>
    </div>
  );
}
