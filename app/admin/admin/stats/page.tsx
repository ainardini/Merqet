"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalOffers: number;
  completedSales: number;
  totalMessages: number;
  totalReviews: number;
  avgRating: number | null;
  openReports: number;
  dailySignups: { date: string; count: number }[];
};

function StatTile({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <div className="card" style={{ padding: 18, textAlign: "center", cursor: href ? "pointer" : undefined }}>
      <div className="price" style={{ fontSize: 26 }}>{value}</div>
      <div className="hint" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link> : content;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        setError("You don't have access to this page.");
        return;
      }
      setStats(await res.json());
    })();
  }, []);

  if (error) return <p className="error-msg" style={{ padding: 40 }}>{error}</p>;
  if (!stats) return <p style={{ padding: 40 }}>Loading…</p>;

  const maxDaily = Math.max(1, ...stats.dailySignups.map((d) => d.count));

  return (
    <>
      <h1 className="page-title">Stats</h1>
      <p className="subtitle">A quick overview of how Merqet is actually being used.</p>

      <div className="filters">
        <Link href="/admin/stats" className="chip active">Stats</Link>
        <Link href="/admin/reports" className="chip">Reports</Link>
      </div>

      <h2 style={{ fontSize: 15, margin: "24px 0 10px", color: "var(--text-soft)" }}>Users</h2>
      <div className="board" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <StatTile label="Total users" value={stats.totalUsers} />
        <StatTile label="New this week" value={stats.newUsersLast7Days} />
        <StatTile label="New this month" value={stats.newUsersLast30Days} />
      </div>

      <h2 style={{ fontSize: 15, margin: "24px 0 10px", color: "var(--text-soft)" }}>Marketplace activity</h2>
      <div className="board" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <StatTile label="Total listings" value={stats.totalListings} />
        <StatTile label="Active listings" value={stats.activeListings} />
        <StatTile label="Sold" value={stats.soldListings} />
        <StatTile label="Offers made" value={stats.totalOffers} />
        <StatTile label="Completed sales" value={stats.completedSales} />
        <StatTile label="Messages sent" value={stats.totalMessages} />
      </div>

      <h2 style={{ fontSize: 15, margin: "24px 0 10px", color: "var(--text-soft)" }}>Trust & safety</h2>
      <div className="board" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <StatTile label="Reviews left" value={stats.totalReviews} />
        <StatTile label="Average rating" value={stats.avgRating ?? "—"} />
        <StatTile label="Open reports" value={stats.openReports} href="/admin/reports" />
      </div>

      <h2 style={{ fontSize: 15, margin: "24px 0 10px", color: "var(--text-soft)" }}>Signups, last 14 days</h2>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
          {stats.dailySignups.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                title={`${d.date}: ${d.count}`}
                style={{
                  width: "100%",
                  height: `${Math.max(4, (d.count / maxDaily) * 80)}px`,
                  background: d.count > 0 ? "var(--accent)" : "var(--surface-2)",
                  borderRadius: 3,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span className="hint">{stats.dailySignups[0]?.date}</span>
          <span className="hint">{stats.dailySignups[stats.dailySignups.length - 1]?.date}</span>
        </div>
      </div>
    </>
  );
}
