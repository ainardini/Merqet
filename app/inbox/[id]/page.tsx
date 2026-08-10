"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatBox, { ChatMessage } from "@/components/ChatBox";
import ReportBlockMenu from "@/components/ReportBlockMenu";

type ConversationInfo = { listing: { id: string; sellerId: string; title: string }; buyer: { id: string; name: string } };

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [info, setInfo] = useState<ConversationInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      setInfo(data.conversation || null);
    } else {
      setError("Couldn't load this conversation.");
    }
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUserId(d.user?.id || null));
    const poll = setInterval(load, 8000);
    return () => clearInterval(poll);
  }, [load]);

  async function sendMessage(payload: { body?: string; attachmentUrl?: string; attachmentType?: "image" | "audio" }) {
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "30px auto" }}>
      <Link href="/inbox" className="hint" style={{ display: "inline-block", marginBottom: 12 }}>← Back to Inbox</Link>
      {info && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <p className="subtitle" style={{ margin: 0 }}>
            About: <Link href={`/listings/${info.listing.id}`}><b>{info.listing.title}</b></Link>
          </p>
          {currentUserId && (
            <ReportBlockMenu
              userId={info.buyer.id === currentUserId ? info.listing.sellerId : info.buyer.id}
              listingId={info.listing.id}
            />
          )}
        </div>
      )}
      {error && <div className="error-msg">{error}</div>}

      <ChatBox messages={messages} currentUserId={currentUserId} emptyHint="No messages yet — say hi." onSend={sendMessage} />
    </div>
  );
}
