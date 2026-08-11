"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="form-page">
        <h1 className="page-title" style={{ fontSize: 30 }}>Check your email</h1>
        <div className="form-card">
          <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
            If an account exists for <b>{email}</b>, a reset code is on its way.
          </p>
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="btn btn-primary btn-full">
            I have my code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Forgot your password?</h1>
      <p className="subtitle">We'll email you a code to reset it.</p>
      <div className="form-card">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
        <p style={{ marginTop: 14, fontSize: 13 }}>
          <Link href="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
