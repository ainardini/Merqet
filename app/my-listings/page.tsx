"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/currency";
import { getListingPhotos } from "@/lib/photos";

type Offer = { id: string; amount: number; status: string; buyer: { name: string } };
type Listing = {
  id: string; title: string; emoji: string; photoUrl: string | null; photoUrls: string[]; price: number; currency: string; status: string;
  reservedUntil: string | null; offers: Offer[]; viewCount: number;
};

function timeLeft(reservedUntil: string | null) {
  if (!reservedUntil) return "";
  const ms = new Date(reservedUntil).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/my-listings");
    if (res.status === 401) {
      setListings([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function act(url: string, msg: string) {
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return showToast(data.error || "Something went wrong");
    showToast(msg);
    load();
  }

  async function markSold(id: string, title: string) {
    if (!confirm(`Mark "${title}" as sold? Any pending offers on it will be closed out.`)) return;
    await act(`/api/listings/${id}/mark-sold`, "Marked as sold");
  }

  async function deleteListing(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return showToast(data.error || "Something went wrong");
    showToast("Listing deleted");
    load();
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <h1 className="page-title">My Lists</h1>
      <p className="subtitle">Review offers, accept the best one, and manage your sales.</p>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="big">You haven't listed anything yet</div>
          <div>Post an item and offers will show up here.</div>
        </div>
      ) : (
        <div className="board">
          {listings.map((item) => {
            const pendingOffers = item.offers.filter((o) => o.status === "pending");
            const accepted = item.offers.find((o) => o.status === "accepted");
            const confirmed = item.offers.find((o) => o.status === "confirmed");

            return (
              <div className="card" key={item.id}>
                <div className="thumb" style={getListingPhotos(item)[0] ? { padding: 0, overflow: "hidden" } : undefined}>
                  {getListingPhotos(item)[0] ? (
                    <Image src={getListingPhotos(item)[0]} alt={item.title} fill sizes="260px" style={{ objectFit: "cover" }} />
                  ) : (
                    item.emoji
                  )}
                </div>
                <div className="item-title">{item.title}</div>
                <div className="price">{formatPrice(item.price, item.currency)}</div>
                <div className="hint" style={{ margin: "-4px 0 0" }}>
                  <i>{item.viewCount} view{item.viewCount === 1 ? "" : "s"}</i>
                </div>

                {item.status === "sold" && <span className="sold-badge">SOLD</span>}

                {item.status === "available" && (
                  <>
                    {pendingOffers.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text-soft)", fontFamily: "var(--font-mono)" }}>No offers yet</p>
                    ) : (
                      <div className="offer-list">
                        {pendingOffers.map((o) => (
                          <div className="offer-row" key={o.id}>
                            <div>{o.buyer.name} — <b>{formatPrice(o.amount, item.currency)}</b></div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="mini-btn accept" onClick={() => act(`/api/offers/${o.id}/accept`, `Accepted ${o.buyer.name}'s offer`)}>Accept</button>
                              <button className="mini-btn" onClick={() => act(`/api/offers/${o.id}/reject`, "Offer declined")}>Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="btn-row">
                      <Link href={`/listings/${item.id}/edit`} className="btn">Edit</Link>
                      <button className="btn" onClick={() => deleteListing(item.id, item.title)}>Delete</button>
                      <button className="btn btn-primary" onClick={() => markSold(item.id, item.title)}>Mark as sold</button>
                    </div>
                  </>
                )}

                {item.status === "reserved" && accepted && (
                  <div className="reserved-block">
                    <div><b>{accepted.buyer.name}</b> accepted at {formatPrice(accepted.amount, item.currency)}</div>
                    <div className="os-timer">{timeLeft(item.reservedUntil)} for them to confirm</div>
                    <button className="btn" style={{ marginTop: 4 }} onClick={() => markSold(item.id, item.title)}>
                      Mark as sold anyway
                    </button>
                  </div>
                )}

                {item.status === "confirmed" && confirmed && (
                  <div className="confirmed-block">
                    <div><b>{confirmed.buyer.name}</b> confirmed — meet up to hand it off and get paid.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" onClick={() => act(`/api/listings/${item.id}/cancel-reservation`, "Reservation cancelled — listing reopened")}>
                        Buyer didn't show
                      </button>
                      <button className="btn btn-primary" onClick={() => act(`/api/listings/${item.id}/complete`, "Marked as sold")}>
                        Mark completed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
