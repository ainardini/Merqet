"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReportBlockMenu from "@/components/ReportBlockMenu";

type User = { id: string; name: string; campus: string | null; avatarUrl: string | null; createdAt: string };
type Review = { id: string; rating: number; comment: string | null; createdAt: string; reviewer: { name: string }; listing: { id: string; title: string } };

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
      {"★".repeat(Math.round(rating))}
      <span style={{ color: "var(--border)" }}>{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [userRes, reviewsRes, meRes] = await Promise.all([
        fetch(`/api/users/${id}`),
        fetch(`/api/users/${id}/reviews`),
        fetch("/api/auth/me"),
      ]);
      if (userRes.ok) setUser((await userRes.json()).user);
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews);
        setAverage(data.average);
        setCount(data.count);
      }
      const me = await meRes.json();
      setCurrentUserId(me.user?.id || null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  if (!user) return <p style={{ padding: 40 }}>User not found.</p>;

  return (
    <div style={{ maxWidth: 560, margin: "30px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", position: "relative", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} fill sizes="56px" style={{ objectFit: "cover" }} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 26, margin: 0 }}>{user.name}</h1>
            {user.campus && <p className="hint" style={{ marginTop: 4 }}>{user.campus}</p>}
          </div>
        </div>
        {currentUserId && currentUserId !== user.id && <ReportBlockMenu userId={user.id} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 24 }}>
        {average !== null ? (
          <>
            <Stars rating={average} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>{average}</span>
            <span className="hint">({count} review{count === 1 ? "" : "s"})</span>
          </>
        ) : (
          <span className="hint">No reviews yet</span>
        )}
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Reviews</h2>
      {reviews.length === 0 ? (
        <p className="hint">This seller hasn't been reviewed yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <Stars rating={r.rating} />
                <span className="hint">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <p style={{ fontSize: 13.5, margin: "6px 0" }}>{r.comment}</p>}
              <p className="hint" style={{ margin: 0 }}>
                {r.reviewer.name} · about <Link href={`/listings/${r.listing.id}`} style={{ textDecoration: "underline" }}>{r.listing.title}</Link>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
