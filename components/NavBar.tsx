"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string } | null;

export default function NavBar({ user }: { user: User }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <Link href="/" className="logo">
        Campus <span>Trade</span>
      </Link>
      <nav className="nav-links">
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
