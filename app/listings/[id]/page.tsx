"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/currency";
import { getListingPhotos } from "@/lib/photos";
import ChatBox, { ChatMessage } from "@/components/ChatBox";

type Offer = { id: string; amount: number; status: string; buyerId: string; buyer?: { name: string } };
type Listing = {
  id: string; title: string; description: string; category: string; condition: string;
  price: number; currency: string; meetupLocation: string | null; emoji: string; photoUrl: string | null; photoUrls: string[]; status: string; reservedUntil: string | null;
  seller: { id: string; name: string }; offers: Offer[]; isFavorited: boolean; favoriteCount: number;
};

function timeLeft(reservedUntil: string | null) {
  if (!reservedUntil) return "";
  const ms = new Date(reservedUntil).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/listings/${id}`);
    const data = await res.json();
    setListing(data.listing);
    setIsOwner(data.isOwner);
    setActiveImageIndex(0);
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUserId(d.user?.id || null));
    fetch(`/api/listings/${id}/messages`).then((r) => (r.ok ? r.json() : { messages: [] })).then((d) => setMessages(d.messages || []));
  }, [load, id]);

  // Re-render the countdown every 30s and re-fetch periodically so status stays fresh
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    const poll = setInterval(load, 15000);
    return () => { clearInterval(t); clearInterval(poll); };
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(offerAmount);
    if (!amount || amount <= 0) return showToast("Enter a valid offer amount");
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, amount }),
    });
    const data = await res.json();
    if (!res.ok) return showToast(data.error || "Couldn't send offer");
    showToast(`Offer of ${formatPrice(amount, listing?.currency || "MYR")} sent`);
    setOfferAmount("");
    load();
  }

  async function confirmPurchase(offerId: string) {
    const res = await fetch(`/api/offers/${offerId}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return showToast(data.error || "Couldn't confirm");
    showToast("Purchase confirmed — arrange the meetup to pay in person");
    load();
  }

  async function toggleFavorite() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    if (!listing) return;
    const method = listing.isFavorited ? "DELETE" : "POST";
    await fetch(`/api/listings/${id}/favorite`, { method });
    setListing({
      ...listing,
      isFavorited: !listing.isFavorited,
      favoriteCount: listing.favoriteCount + (listing.isFavorited ? -1 : 1),
    });
  }

  async function sendMessage(payload: { body?: string; attachmentUrl?: string; attachmentType?: "image" | "audio" }) {
    const res = await fetch(`/api/listings/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
    }
  }

  if (!listing) return <p style={{ padding: 40 }}>Loading…</p>;

  const myOffer = listing.offers.find((o) => o.buyerId === currentUserId);
  const canMakeOffer = !isOwner && listing.status === "available" && (!myOffer || myOffer.status === "rejected");

  return (
    <div style={{ maxWidth: 640, margin: "30px auto" }}>
      {toast && <div className="toast">{toast}</div>}

      {(() => {
        const photos = getListingPhotos(listing);
        const mainPhoto = photos[activeImageIndex] || photos[0];
        return (
          <>
            <div
              className="thumb"
              style={
                mainPhoto
                  ? { height: 260, marginBottom: 8, padding: 0, overflow: "hidden" }
                  : { height: 200, fontSize: 80, marginBottom: 8 }
              }
            >
              {mainPhoto ? (
                <img src={mainPhoto} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                listing.emoji
              )}
              <div className="condition-tag">{listing.condition}</div>
            </div>
            {photos.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${listing.title} photo ${i + 1}`}
                    onClick={() => setActiveImageIndex(i)}
                    style={{
                      width: 56, height: 56, objectFit: "cover", borderRadius: 8, cursor: "pointer",
                      border: i === activeImageIndex ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                    }}
                  />
                ))}
              </div>
            )}
          </>
        );
      })()}

      <div className="category-tag">{listing.category}</div>
      <h1 style={{ fontSize: 26, margin: "6px 0" }}>{listing.title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div className="price" style={{ fontSize: 30 }}>{formatPrice(listing.price, listing.currency)}</div>
        <button
          onClick={toggleFavorite}
          className="btn"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px" }}
        >
          <span style={{ color: listing.isFavorited ? "var(--accent-2)" : "var(--text-soft)" }}>
            {listing.isFavorited ? "♥" : "♡"}
          </span>
          {listing.favoriteCount > 0 ? listing.favoriteCount : "Save"}
        </button>
      </div>
      <p className="seller-line">Sold by <b>{listing.seller.name}</b></p>
      {listing.meetupLocation && (
        <p className="seller-line">Preferred meetup: <b>{listing.meetupLocation}</b></p>
      )}
      <p style={{ marginTop: 14, lineHeight: 1.6 }}>{listing.description}</p>

      {listing.status === "sold" && (
        <div style={{ marginTop: 20 }}><span className="sold-badge">SOLD</span></div>
      )}

      {listing.status === "reserved" && !isOwner && myOffer?.status !== "accepted" && (
        <div className="offer-status pending" style={{ marginTop: 20 }}>
          This item is reserved for another buyer right now.
        </div>
      )}

      {myOffer?.status === "pending" && (
        <div className="offer-status pending" style={{ marginTop: 20 }}>
          <div><b>Offer sent: {formatPrice(myOffer.amount, listing.currency)}</b></div>
          <div>Waiting for {listing.seller.name.split(" ")[0]} to respond…</div>
        </div>
      )}

      {myOffer?.status === "accepted" && listing.status === "reserved" && (
        <div className="reserved-block" style={{ marginTop: 20 }}>
          <div><b>Your offer of {formatPrice(myOffer.amount, listing.currency)} was accepted!</b></div>
          <div className="os-timer">{timeLeft(listing.reservedUntil)} to confirm</div>
          <button className="btn btn-primary" onClick={() => confirmPurchase(myOffer.id)}>
            Confirm purchase — {formatPrice(myOffer.amount, listing.currency)}
          </button>
        </div>
      )}

      {myOffer?.status === "confirmed" && (
        <div className="confirmed-block" style={{ marginTop: 20 }}>
          Purchase confirmed — meet up with {listing.seller.name} to pay in person and pick it up.
        </div>
      )}

      {myOffer?.status === "rejected" && listing.status === "available" && (
        <div className="offer-status pending" style={{ marginTop: 20 }}>
          Your last offer wasn't accepted. You can try again below.
        </div>
      )}

      {canMakeOffer && (
        <form onSubmit={submitOffer} style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <input
            type="number"
            min={1}
            placeholder={`e.g. ${formatPrice(Math.max(1, listing.price - 5), listing.currency)}`}
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            style={{ flex: 1, border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button className="btn btn-primary" type="submit">Make offer</button>
        </form>
      )}

      {isOwner && (
        <p className="hint" style={{ marginTop: 20 }}>
          This is your listing — manage offers from <a href="/my-listings">My Lists</a>, reply to buyers from your <a href="/inbox">Inbox</a>
          {listing.status === "available" && <> , or <a href={`/listings/${id}/edit`}>edit the details</a></>}.
        </p>
      )}

      {!isOwner && (
        <ChatBox
          messages={messages}
          currentUserId={currentUserId}
          emptyHint={`Say hi to ${listing.seller.name.split(" ")[0]} to ask questions or arrange a meetup.`}
          onSend={sendMessage}
        />
      )}
    </div>
  );
}
