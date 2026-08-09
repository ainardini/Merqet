"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/currency";
import { getListingPhotos } from "@/lib/photos";

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
};

export default function FavoritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/favorites");
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
    }
    setLoading(false);
  }

  async function unfavorite(id: string) {
    await fetch(`/api/listings/${id}/favorite`, { method: "DELETE" });
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <>
      <h1 className="page-title">Favorites</h1>
      <p className="subtitle">Things you've saved to check out later.</p>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="big">Nothing saved yet</div>
          <div>Tap the heart on a listing to save it here.</div>
        </div>
      ) : (
        <div className="board">
          {listings.map((item) => (
            <div key={item.id} className="card" style={{ position: "relative" }}>
              <button
                onClick={() => unfavorite(item.id)}
                aria-label="Remove from favorites"
                style={{
                  position: "absolute", top: 10, right: 10, zIndex: 2, background: "var(--bg)",
                  border: "1px solid var(--border)", borderRadius: "50%", width: 30, height: 30,
                  cursor: "pointer", fontSize: 15, color: "var(--accent-2)",
                }}
              >
                ♥
              </button>
              <Link href={`/listings/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
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
                <div className="seller-line">Sold by <b>{item.seller.name}</b></div>
                {item.status !== "available" && (
                  <div className="offer-status pending">
                    {item.status === "sold" ? "No longer available" : "Currently reserved"}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
