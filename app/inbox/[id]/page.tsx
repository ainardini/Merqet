"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Message = { id: string; body: string; senderId: string; sender: { name: string } };
type ConversationInfo = { listing: { id: string; title: string }; buyer: { id: string; name: string } };

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [info, setInfo] = useState<ConversationInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
      setText("");
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "30px auto" }}>
      <Link href="/inbox" className="hint" style={{ display: "inline-block", marginBottom: 12 }}>← Back to Inbox</Link>
      {info && (
        <p className="subtitle" style={{ marginBottom: 4 }}>
          About: <Link href={`/listings/${info.listing.id}`}><b>{info.listing.title}</b></Link>
        </p>
      )}
      {error && <div className="error-msg">{error}</div>}

      <div className="chat-box" style={{ height: 480 }}>
        <div className="chat-messages">
          {messages.length === 0 && <p style={{ color: "var(--text-soft)", fontSize: 13 }}>No messages yet — say hi.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.senderId === currentUserId ? "me" : "them"}`}>
              {m.body}
            </div>
          ))}
        </div>
        <form className="chat-input-row" onSubmit={sendMessage}>
          <input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
