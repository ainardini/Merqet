"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getListingPhotos } from "@/lib/photos";

type ConversationSummary = {
  id: string;
  listing: { id: string; title: string; emoji: string; photoUrl: string | null; photoUrls: string[] };
  otherParty: { id: string; name: string };
  role: "buyer" | "seller";
  lastMessage: { body: string | null; attachmentType: string | null; createdAt: string } | null;
  lastMessageAt: string;
  unreadCount: number;
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    load();
    if (typeof Notification !== "undefined") setNotifPermission(Notification.permission);
    const poll = setInterval(load, 10000);
    return () => clearInterval(poll);
  }, []);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  async function load() {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
    }
    setLoading(false);
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <>
      <h1 className="page-title">Inbox</h1>
      <p className="subtitle">Every conversation you're part of, whether you're buying or selling.</p>
      {notifPermission === "default" && (
        <button className="btn" onClick={enableNotifications} style={{ marginBottom: 16 }}>
          🔔 Enable notifications for new messages
        </button>
      )}
      {notifPermission === "denied" && (
        <p className="hint" style={{ marginBottom: 16 }}>
          Notifications are blocked in your browser settings — you'll still see unread counts here and in the nav bar.
        </p>
      )}

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="big">No conversations yet</div>
          <div>Message a seller from a listing, or wait for a buyer to reach out.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {conversations.map((c) => {
            const photo = getListingPhotos(c.listing)[0];
            return (
              <Link
                key={c.id}
                href={`/inbox/${c.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 14, textDecoration: "none",
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
                  padding: 12, position: "relative",
                }}
              >
                <div className="thumb" style={{ width: 52, height: 52, flexShrink: 0, fontSize: 24, ...(photo ? { padding: 0, overflow: "hidden" } : {}) }}>
                  {photo ? (
                    <img src={photo} alt={c.listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    c.listing.emoji
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {c.otherParty.name}
                      <span style={{ fontSize: 11, color: "var(--text-soft)", fontWeight: 500, marginLeft: 6 }}>
                        {c.role === "buyer" ? "· seller" : "· buyer"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-soft)", whiteSpace: "nowrap" }}>{timeAgo(c.lastMessageAt)}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>{c.listing.title}</div>
                  {c.lastMessage && (
                    <div
                      style={{
                        fontSize: 13, marginTop: 4, color: c.unreadCount > 0 ? "var(--text)" : "var(--text-soft)",
                        fontWeight: c.unreadCount > 0 ? 600 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {c.lastMessage.body || (c.lastMessage.attachmentType === "image" ? "📷 Photo" : c.lastMessage.attachmentType === "audio" ? "🎤 Voice message" : "")}
                    </div>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <div
                    style={{
                      background: "var(--accent)", color: "var(--accent-ink)", borderRadius: 999,
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", flexShrink: 0,
                    }}
                  >
                    {c.unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
