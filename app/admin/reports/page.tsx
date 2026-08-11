"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  reportedUser: { id: string; name: string; email: string };
  listing: { id: string; title: string } | null;
};

const STATUS_FILTERS = ["open", "dismissed", "actioned", "all"];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("open");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/reports");
    if (res.status === 403) {
      setError("You don't have access to this page.");
      return;
    }
    const data = await res.json();
    setReports(data.reports || []);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`Marked as ${status}`);
      load();
    }
  }

  if (error) return <p className="error-msg" style={{ padding: 40 }}>{error}</p>;
  if (!reports) return <p style={{ padding: 40 }}>Loading…</p>;

  const filtered = statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <h1 className="page-title">Reports</h1>
      <p className="subtitle">User reports filed across the site.</p>

      <div className="filters">
        {STATUS_FILTERS.map((s) => (
          <button key={s} className={`chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="big">Nothing here</div>
          <div>No reports match this filter.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {filtered.map((r) => (
            <div key={r.id} className="card" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.reason}</div>
                  <div className="hint">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "3px 10px", borderRadius: 999,
                    background: r.status === "open" ? "var(--accent)" : "var(--surface-2)",
                    color: r.status === "open" ? "var(--accent-ink)" : "var(--text-soft)",
                  }}
                >
                  {r.status}
                </span>
              </div>

              {r.details && <p style={{ fontSize: 13.5, marginBottom: 10 }}>{r.details}</p>}

              <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 10 }}>
                Reported: <Link href={`/users/${r.reportedUser.id}`}><b>{r.reportedUser.name}</b></Link> ({r.reportedUser.email})
                <br />
                Reported by: <Link href={`/users/${r.reporter.id}`}><b>{r.reporter.name}</b></Link> ({r.reporter.email})
                {r.listing && (
                  <>
                    <br />
                    Listing: <Link href={`/listings/${r.listing.id}`}>{r.listing.title}</Link>
                  </>
                )}
              </div>

              {r.status === "open" && (
                <div className="btn-row">
                  <button className="btn" onClick={() => updateStatus(r.id, "dismissed")}>Dismiss</button>
                  <button className="btn btn-primary" onClick={() => updateStatus(r.id, "actioned")}>Mark actioned</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
