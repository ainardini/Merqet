"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currency";

const CONDITIONS = ["Like new", "Good", "Fair", "Well used"];
const CATEGORIES = ["Furniture", "Clothes", "Accessories", "Electronics", "Beauty", "Others"];

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState<{
    title: string; description: string; category: string; condition: string; price: string; currency: string; meetupLocation: string;
  }>({
    title: "", description: "", category: CATEGORIES[0], condition: CONDITIONS[0], price: "", currency: CURRENCIES[0], meetupLocation: "",
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Photo upload failed");
      setPhotoPreview(null);
      return;
    }
    setPhotoUrl(data.url);
  }

  function handlePriceChange(value: string) {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setForm({ ...form, price: digitsOnly });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, photoUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong. Are you logged in?");
      return;
    }
    router.push(`/listings/${data.listing.id}`);
  }

  return (
    <div className="form-page">
      <h1 className="page-title" style={{ fontSize: 30 }}>Start Sell</h1>
      <p className="subtitle">Set your price — buyers can still send you an offer.</p>
      <div className="form-card">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Product's Name</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Condition</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Price</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                style={{ width: 90, flexShrink: 0 }}
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={form.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className="field">
            <label>Preferred meetup location (optional)</label>
            <input
              placeholder="e.g. Library, Student center"
              value={form.meetupLocation}
              onChange={(e) => setForm({ ...form, meetupLocation: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Photo (optional)</label>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--border)", marginBottom: 8 }}
              />
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoChange} />
            {uploading && <div className="hint">Uploading…</div>}
            <div className="hint">Best results: a square photo, at least 800×800px — it'll display consistently in listings.</div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading || uploading}>
            {loading ? "Posting…" : uploading ? "Waiting for photo upload…" : "Post listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
