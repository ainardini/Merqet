"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; avatarUrl?: string | null } | null;

export default function NavBar({ user }: { user: User }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenMessageIds = useRef<Set<string>>(new Set());
  const firstPoll = useRef(true);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleInvite() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const message = `Come check out Merqet — buy and sell used stuff with people on campus, no shipping, no fees: ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Merqet", text: message, url });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (!user) return;

    async function pollUnread() {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      const conversations = data.conversations || [];
      const total = conversations.reduce((sum: number, c: any) => sum + c.unreadCount, 0);

      // Fire a browser notification for genuinely new unread messages, not on first load
      if (!firstPoll.current && Notification?.permission === "granted") {
        conversations.forEach((c: any) => {
          if (c.lastMessage && c.unreadCount > 0) {
            const key = `${c.id}:${c.lastMessageAt}`;
            if (!seenMessageIds.current.has(key)) {
              seenMessageIds.current.add(key);
              new Notification(`New message from ${c.otherParty.name}`, {
                body: c.lastMessage.body || (c.lastMessage.attachmentType === "image" ? "📷 Sent a photo" : "🎤 Sent a voice message"),
                tag: c.id,
              });
            }
          }
        });
      } else {
        conversations.forEach((c: any) => seenMessageIds.current.add(`${c.id}:${c.lastMessageAt}`));
      }

      firstPoll.current = false;
      setUnreadCount(total);
    }

    pollUnread();
    const interval = setInterval(pollUnread, 10000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="site-header">
      <Link href="/" className="logo">
        Mer<span>qet</span>
      </Link>
      <nav className="nav-links">
        <button className="btn" onClick={handleInvite}>
          {copied ? "Link copied!" : "Invite friends"}
        </button>
        {user ? (
          <>
            <Link href="/">Browse</Link>
            <Link href="/inbox" style={{ position: "relative" }}>
              Inbox
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute", top: -8, right: -14, background: "var(--accent)",
                    color: "var(--accent-ink)", borderRadius: 999, fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", minWidth: 16, textAlign: "center",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/my-listings">My Lists</Link>
            <Link href="/favorites">Favorites</Link>
            <Link href="/listings/new" className="btn btn-primary">
              + Start Sell
            </Link>
            <Link
              href="/profile"
              style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-soft)", textDecoration: "none" }}
            >
              <span
                style={{
                  width: 26, height: 26, borderRadius: "50%", overflow: "hidden", position: "relative",
                  background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--text)", flexShrink: 0,
                }}
              >
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.name} fill sizes="26px" style={{ objectFit: "cover" }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </span>
              {user.name}
            </Link>
            <button className="btn" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
