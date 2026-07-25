"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleResend() {
    setError("");
    setNotice("");
    setResending(true);
    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResending(false);
    if (!res.ok) {
      setError(data.error || "Couldn't resend code");
      return;
    }
    setNotice("A new code is on its way — check your inbox.");
  }

  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Check your email</h1>
      <p className="subtitle">We sent a 6-digit code to your email. Enter it below to activate your account.</p>
      <div className="form-card">
        {error && <div className="error-msg">{error}</div>}
        {notice && <div className="hint" style={{ marginBottom: 12 }}>{notice}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Verification code</label>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: 6, textAlign: "center" }}
            />
            <div className="hint">Code expires 10 minutes after it's sent.</div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
        </form>
        <button className="btn btn-full" style={{ marginTop: 10 }} onClick={handleResend} disabled={resending}>
          {resending ? "Sending…" : "Resend code"}
        </button>
        <p style={{ marginTop: 14, fontSize: 13 }}>
          Wrong email? <Link href="/signup">Start over</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p style={{ padding: 40 }}>Loading…</p>}>
      <VerifyForm />
    </Suspense>
  );
}
