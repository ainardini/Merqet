"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setNeedsVerification(!!data.needsVerification);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Welcome back</h1>
      <div className="form-card">
        {error && <div className="error-msg">{error}</div>}
        {needsVerification && (
          <p className="hint" style={{ marginBottom: 12 }}>
            <Link href={`/verify?email=${encodeURIComponent(form.email)}`}>Verify your email</Link> to finish setting up your account.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <div className="hint" style={{ marginTop: 6 }}>
              <Link href="/forgot-password">Forgot your password?</Link>
            </div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: 14, fontSize: 13 }}>
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
