"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type User = { id: string; name: string; email: string; campus: string | null; avatarUrl: string | null; createdAt: string };
type Stats = { itemsSold: number; itemsBought: number; rating: number | null; reviewCount: number };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState("");
  const [campus, setCampus] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/users/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setStats(data.stats);
      setName(data.user.name);
      setCampus(data.user.campus || "");
      setAvatarUrl(data.user.avatarUrl);
      setLoading(false);
    })();
  }, [router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingAvatar(false);
    if (!res.ok) {
      setError(data.error || "Avatar upload failed");
      return;
    }
    setAvatarUrl(data.url);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, campus, avatarUrl }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Couldn't save changes");
      return;
    }
    setUser(data.user);
    showToast("Profile updated");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setChangingPassword(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setChangingPassword(false);
    if (!res.ok) {
      setPasswordError(data.error || "Couldn't change password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    showToast("Password changed");
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  if (!user || !stats) return null;

  return (
    <div className="form-page">
      {toast && <div className="toast">{toast}</div>}
      <h1 className="page-title" style={{ fontSize: 30 }}>Profile</h1>
      <p className="subtitle">Manage your account details.</p>

      {/* Account stats */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, textAlign: "center" }}>
          <div>
            <div className="price" style={{ fontSize: 20 }}>{stats.itemsSold}</div>
            <div className="hint">Sold</div>
          </div>
          <div>
            <div className="price" style={{ fontSize: 20 }}>{stats.itemsBought}</div>
            <div className="hint">Bought</div>
          </div>
          <div>
            <div className="price" style={{ fontSize: 20 }}>{stats.rating ?? "—"}</div>
            <div className="hint">Rating</div>
          </div>
          <div>
            <div className="price" style={{ fontSize: 20 }}>{stats.reviewCount}</div>
            <div className="hint">Reviews</div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>Profile picture</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "var(--surface-2)", position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={name} fill sizes="64px" style={{ objectFit: "cover" }} />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarChange} />
                {uploadingAvatar && <div className="hint">Uploading…</div>}
              </div>
            </div>
          </div>
          <div className="field">
            <label>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={user.email} disabled style={{ opacity: 0.6 }} />
            <div className="hint">Email can't be changed here.</div>
          </div>
          <div className="field">
            <label>Campus (optional)</label>
            <input value={campus} onChange={(e) => setCampus(e.target.value)} placeholder="e.g. State University" />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={saving || uploadingAvatar}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="form-card">
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Change password</h2>
        {passwordError && <div className="error-msg">{passwordError}</div>}
        <form onSubmit={changePassword}>
          <div className="field">
            <label>Current password</label>
            <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>New password</label>
            <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button className="btn btn-full" type="submit" disabled={changingPassword}>
            {changingPassword ? "Changing…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
