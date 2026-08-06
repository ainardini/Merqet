"use client";

import { useEffect, useRef, useState } from "react";

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
  onSend: (payload: { body?: string; attachmentUrl?: string; attachmentType?: "image" | "audio" }) => Promise<void>;
};

export default function ChatBox({ messages, currentUserId, emptyHint, onSend }: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function uploadFile(file: File): Promise<{ url: string; kind: "image" | "audio" } | null> {
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

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        const result = await uploadFile(file);
        if (result) await onSend({ attachmentUrl: result.url, attachmentType: "audio" });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access your microphone — check your browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function formatSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.length === 0 && <p style={{ color: "var(--text-soft)", fontSize: 13 }}>{emptyHint}</p>}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`msg ${mine ? "me" : "them"}`} style={{ padding: m.attachmentType === "image" ? 4 : undefined }}>
              {m.attachmentType === "image" && m.attachmentUrl && (
                <img
                  src={m.attachmentUrl}
                  alt="Shared photo"
                  style={{ display: "block", maxWidth: 220, maxHeight: 220, borderRadius: 10, objectFit: "cover" }}
                />
              )}
              {m.attachmentType === "audio" && m.attachmentUrl && (
                <audio controls src={m.attachmentUrl} style={{ maxWidth: 220, height: 34 }} />
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
          disabled={uploading || recording}
          aria-label="Attach photo"
          style={{ padding: "9px 12px" }}
        >
          📷
        </button>

        {recording ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={stopRecording}
            style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}
          >
            ⏹ {formatSeconds(recordSeconds)}
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={startRecording}
            disabled={uploading}
            aria-label="Record voice note"
            style={{ padding: "9px 12px" }}
          >
            🎤
          </button>
        )}

        <input
          placeholder={recording ? "Recording…" : uploading ? "Uploading…" : "Type a message…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={recording || uploading}
        />
        <button className="btn" type="submit" disabled={recording || uploading || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
