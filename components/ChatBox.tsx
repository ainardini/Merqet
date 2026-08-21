"use client";

import { useEffect, useRef, useState } from "react";
import Lightbox from "./Lightbox";

export type ChatMessage = {
  id: string;
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  senderId: string;
  sender: { name: string };
};

type Props = {
  messages: ChatMessage[];
  currentUserId: string | null;
  emptyHint: string;
  onSend: (payload: { body?: string; attachmentUrl?: string; attachmentType?: "image" }) => Promise<void>;
};

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 8.5C4 7.67157 4.67157 7 5.5 7H7.5L8.5 5H15.5L16.5 7H18.5C19.3284 7 20 7.67157 20 8.5V17.5C20 18.3284 19.3284 19 18.5 19H5.5C4.67157 19 4 18.3284 4 17.5V8.5Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function ChatBox({ messages, currentUserId, emptyHint, onSend }: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // All photo URLs sent in this conversation, in order — lets the lightbox
  // flip through the whole chat's photo history, not just the one clicked.
  const photoUrls = messages.filter((m) => m.attachmentType === "image" && m.attachmentUrl).map((m) => m.attachmentUrl as string);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function uploadFile(file: File): Promise<{ url: string; kind: "image" } | null> {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return null;
    }
    return { url: data.url, kind: data.kind };
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    await onSend({ body });
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await uploadFile(file);
    if (result) await onSend({ attachmentUrl: result.url, attachmentType: "image" });
  }

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.length === 0 && <p style={{ color: "var(--text-soft)", fontSize: 13 }}>{emptyHint}</p>}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const photoIndex = m.attachmentType === "image" && m.attachmentUrl ? photoUrls.indexOf(m.attachmentUrl) : -1;
          return (
            <div key={m.id} className={`msg ${mine ? "me" : "them"}`} style={{ padding: m.attachmentType === "image" ? 4 : undefined }}>
              {m.attachmentType === "image" && m.attachmentUrl && (
                <img
                  src={m.attachmentUrl}
                  alt="Shared photo"
                  onClick={() => setLightboxIndex(photoIndex)}
                  style={{ display: "block", maxWidth: 220, maxHeight: 220, borderRadius: 10, objectFit: "cover", cursor: "pointer" }}
                />
              )}
              {m.body && <div style={{ marginTop: m.attachmentUrl ? 6 : 0, padding: m.attachmentType === "image" ? "0 6px 4px" : 0 }}>{m.body}</div>}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-msg" style={{ padding: "0 12px" }}>{error}</div>}

      <form className="chat-input-row" onSubmit={sendText}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          ref={fileInputRef}
          onChange={handlePhotoPick}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Attach photo"
          style={{ padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CameraIcon />
        </button>

        <input
          placeholder={uploading ? "Uploading…" : "Type a message…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={uploading}
        />
        <button className="btn" type="submit" disabled={uploading || !text.trim()}>
          Send
        </button>
      </form>

      {lightboxIndex !== null && (
        <Lightbox images={photoUrls} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
