"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = ["All", "Textbooks", "Furniture", "Electronics", "Bikes", "Dorm"];

type Listing = {
  id: string;
  title: string;
  category: string;
  condition: string;
  price: number;
  emoji: string;
  status: string;
  seller: { name: string };
  offers: { id: string; amount: number; status: string }[];
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [category]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/listings?category=${encodeURIComponent(category)}`);
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  }

  return (
    <>
      <h1 className="page-title">
        Buy &amp; sell on campus
      </h1>
      <p className="subtitle">Chat, agree on a price, meet up, pay however you like.</p>
      <div className="cash-note">💵 No online payments — pay in person, your way</div>

      <div className="filters">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${c === category ? "active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-soft)" }}>Loading listings…</p>
      ) : listings.length === 0 ? (
        <div className="board">
          <div className="empty-state">
            <div className="big">Nothing posted here yet</div>
            <div>Be the first to list something in this category.</div>
          </div>
        </div>
      ) : (
        <div className="board">
          {listings.map((item) => {
            const myOffer = item.offers?.[0];
            return (
              <Link href={`/listings/${item.id}`} key={item.id} className="card" style={{ textDecoration: "none" }}>
                <div className="thumb">
                  {item.emoji}
                  <div className="condition-tag">{item.condition}</div>
                </div>
                <div className="category-tag">{item.category}</div>
                <div className="item-title">{item.title}</div>
                <div>
                  <div className="price-label">Price</div>
                  <div className="price">${item.price}</div>
                </div>
                <div className="seller-line">Sold by <b>{item.seller.name}</b></div>
                {item.status === "reserved" && (
                  <div className="offer-status pending">Reserved by another buyer</div>
                )}
                {myOffer && myOffer.status === "pending" && (
                  <div className="offer-status pending">Your offer: ${myOffer.amount} — pending</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
