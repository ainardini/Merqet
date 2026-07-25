"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string } | null;

export default function NavBar({ user }: { user: User }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleInvite() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const message = `Come check out Campus Trade — buy and sell used stuff with people on campus, no shipping, no fees: ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Campus Trade", text: message, url });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="site-header">
      <Link href="/" className="logo">
        Campus <span>Trade</span>
      </Link>
      <nav className="nav-links">
        <button className="btn" onClick={handleInvite}>
          {copied ? "Link copied!" : "Invite friends"}
        </button>
        {user ? (
          <>
            <Link href="/">Browse</Link>
            <Link href="/my-listings">My Listings</Link>
            <Link href="/listings/new" className="btn btn-primary">
              + List an item
            </Link>
            <span style={{ color: "var(--ink-soft)" }}>{user.name}</span>
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
