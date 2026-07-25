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
  photoUrl: string | null;
  status: string;
  seller: { name: string };
  offers: { id: string; amount: number; status: string }[];
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce so we don't hit the API on every keystroke
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ category });
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/listings?${params.toString()}`);
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

      <input
        type="text"
        placeholder="Search for textbooks, furniture, anything..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 420,
          border: "2px solid var(--ink)",
          borderRadius: 4,
          padding: "10px 14px",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          marginTop: 20,
        }}
      />

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
            <div className="big">{search ? "No matches found" : "Nothing posted here yet"}</div>
            <div>{search ? `Try a different search term.` : "Be the first to list something in this category."}</div>
          </div>
        </div>
      ) : (
        <div className="board">
          {listings.map((item) => {
            const myOffer = item.offers?.[0];
            return (
              <Link href={`/listings/${item.id}`} key={item.id} className="card" style={{ textDecoration: "none" }}>
                <div className="thumb" style={item.photoUrl ? { padding: 0, overflow: "hidden" } : undefined}>
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    item.emoji
                  )}
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
