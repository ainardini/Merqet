import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: 60,
        padding: "24px",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Link href="/" className="logo" style={{ fontSize: 18 }}>
          Mer<span>qet</span>
        </Link>
        <nav
          style={{
            display: "flex",
            gap: 24,
            fontSize: 13,
            color: "var(--text-soft)",
            flexWrap: "wrap",
          }}
        >
          <Link href="/help">Help Center</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/about">About Us</Link>
        </nav>
      </div>
    </footer>
  );
}
