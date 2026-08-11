"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (done) {
    return (
      <div className="form-card">
        <p style={{ lineHeight: 1.7 }}>Password changed. Redirecting you to log in…</p>
      </div>
    );
  }

  return (
    <div className="form-card">
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Reset code</label>
          <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
        </div>
        <div className="field">
          <label>New password</label>
          <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <p style={{ marginTop: 14, fontSize: 13 }}>
        Didn't get a code? <Link href="/forgot-password">Request another</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Reset your password</h1>
      <p className="subtitle">Enter the code we emailed you along with your new password.</p>
      <Suspense fallback={<div className="form-card">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
