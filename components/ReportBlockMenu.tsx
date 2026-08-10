"use client";

import { useEffect, useState } from "react";

const REASONS = ["Spam or scam", "Inappropriate messages", "No-show / didn't follow through", "Fake or misleading listing", "Other"];

export default function ReportBlockMenu({ userId, listingId }: { userId: string; listingId?: string }) {
  const [open, setOpen] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/users/${userId}/block`).then((r) => r.json()).then((d) => setBlocked(!!d.blocked));
  }, [userId]);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/users/${userId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details, listingId }),
    });
    if (res.ok) {
      setStatus("Report submitted. Thanks for flagging this.");
      setShowReportForm(false);
      setOpen(false);
    } else {
      setStatus("Couldn't submit the report — try again.");
    }
  }

  async function toggleBlock() {
    const method = blocked ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${userId}/block`, { method });
    if (res.ok) {
      setBlocked(!blocked);
      setStatus(blocked ? "Unblocked." : "Blocked — you won't see each other's listings or be able to message anymore.");
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="btn" onClick={() => setOpen(!open)} style={{ padding: "6px 12px", fontSize: 12 }}>
        •••
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: 10, padding: 8, minWidth: 180, zIndex: 10,
            display: "flex", flexDirection: "column", gap: 4,
          }}
        >
          {!showReportForm ? (
            <>
              <button className="mini-btn" onClick={() => setShowReportForm(true)} style={{ textAlign: "left" }}>
                🚩 Report user
              </button>
              <button className="mini-btn" onClick={toggleBlock} style={{ textAlign: "left" }}>
                {blocked ? "Unblock user" : "🚫 Block user"}
              </button>
            </>
          ) : (
            <form onSubmit={submitReport} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
              <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ fontSize: 12, padding: 6, borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <textarea
                placeholder="Any extra details (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                style={{ fontSize: 12, padding: 6, borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="mini-btn" onClick={() => setShowReportForm(false)}>Cancel</button>
                <button type="submit" className="mini-btn accept">Submit</button>
              </div>
            </form>
          )}
        </div>
      )}
      {status && <div className="hint" style={{ marginTop: 6, maxWidth: 200 }}>{status}</div>}
    </div>
  );
}
