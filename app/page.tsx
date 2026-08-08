"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/currency";
import { getListingPhotos } from "@/lib/photos";

const CATEGORIES = ["All", "Furniture", "Clothes", "Accessories", "Electronics", "Beauty", "Others"];

type Listing = {
  id: string;
  title: string;
  category: string;
  condition: string;
  price: number;
  currency: string;
  emoji: string;
  photoUrl: string | null;
  photoUrls: string[];
  status: string;
  seller: { id: string; name: string };
  offers: { id: string; amount: number; status: string }[];
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUserId(d.user?.id || null));
  }, []);

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
        Online Flea Market
      </h1>
      <p className="subtitle">Chat, agree on a price, meet up, pay however you like.</p>
      <div className="cash-note">Pay in person, do it your own way</div>

      <input
        type="text"
        placeholder="Search here"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1.5px solid var(--border)",
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          marginTop: 20,
          background: "var(--surface)",
          color: "var(--text)",
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
        <p style={{ color: "var(--text-soft)" }}>Loading listings…</p>
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
            const isMine = item.seller.id === currentUserId;
            return (
              <Link href={`/listings/${item.id}`} key={item.id} className="card" style={{ textDecoration: "none" }}>
                <div className="thumb" style={getListingPhotos(item)[0] ? { padding: 0, overflow: "hidden" } : undefined}>
                  {getListingPhotos(item)[0] ? (
                    <img src={getListingPhotos(item)[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    item.emoji
                  )}
                  <div className="condition-tag">{item.condition}</div>
                </div>
                <div className="category-tag">{item.category}</div>
                <div className="item-title">{item.title}</div>
                <div>
                  <div className="price-label">Price</div>
                  <div className="price">{formatPrice(item.price, item.currency)}</div>
                </div>
                <div className="seller-line">Sold by <b>{isMine ? "you" : item.seller.name}</b></div>
                {isMine && (
                  <div className="offer-status" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>Your listing</div>
                )}
                {!isMine && item.status === "reserved" && (
                  <div className="offer-status pending">Reserved by another buyer</div>
                )}
                {!isMine && myOffer && myOffer.status === "pending" && (
                  <div className="offer-status pending">Your offer: {formatPrice(myOffer.amount, item.currency)} — pending</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
