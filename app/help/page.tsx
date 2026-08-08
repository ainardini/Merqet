export default function HelpPage() {
  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Help Center</h1>
      <div className="form-card">
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          Getting started on Merqet is simple: browse listings, chat with a seller or send an offer,
          agree on a price, and meet up in person to pay and pick up your item.
        </p>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          <b>Selling something?</b> Head to Start Sell, add a few photos, set your price, and you're live.
          You'll get notified in your Inbox whenever someone messages or makes an offer.
        </p>
        <p style={{ lineHeight: 1.7 }}>
          Still stuck? Reach out from the <a href="/contact">Contact Us</a> page and we'll help you out.
        </p>
      </div>
    </div>
  );
}
