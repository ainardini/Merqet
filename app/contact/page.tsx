export default function ContactPage() {
  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Contact Us</h1>
      <div className="form-card">
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          Got a question, ran into a bug, or want to report something suspicious? We'd love to hear from you.
        </p>
        <p style={{ lineHeight: 1.7 }}>
          Email us at <b>support@merqet.app</b> and we'll get back to you as soon as we can.
        </p>
      </div>
    </div>
  );
}
