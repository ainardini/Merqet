"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currency";
import { MAX_LISTING_PHOTOS } from "@/lib/photos";
import SafetyNudge from "@/components/SafetyNudge";

const CONDITIONS = ["Like new", "Good", "Fair", "Well used"];
const CATEGORIES = ["Furniture", "Clothes", "Accessories", "Electronics", "Beauty", "Others"];

type PhotoSlot = { previewUrl: string; uploadedUrl: string | null; uploading: boolean; error: string | null };

export type ListingFormInitial = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  currency: string;
  meetupLocation: string | null;
  photoUrls: string[];
};

export default function ListingForm({ initial }: { initial?: ListingFormInitial }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState<{
    title: string; description: string; category: string; condition: string; price: string; currency: string; meetupLocation: string;
  }>({
    title: initial?.title || "",
    description: initial?.description || "",
    category: initial?.category || CATEGORIES[0],
    condition: initial?.condition || CONDITIONS[0],
    price: initial ? String(initial.price) : "",
    currency: initial?.currency || CURRENCIES[0],
    meetupLocation: initial?.meetupLocation || "",
  });
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    (initial?.photoUrls || []).map((url) => ({ previewUrl: url, uploadedUrl: url, uploading: false, error: null }))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const anyUploading = photos.some((p) => p.uploading);

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_LISTING_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setError(`You can only add up to ${MAX_LISTING_PHOTOS} photos.`);
      e.target.value = "";
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only added ${remainingSlots} more — ${MAX_LISTING_PHOTOS} photo limit reached.`);
    } else {
      setError("");
    }

    const newSlots: PhotoSlot[] = filesToAdd.map((file) => ({
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      uploading: true,
      error: null,
    }));
    setPhotos((prev) => [...prev, ...newSlots]);

    const startIndex = photos.length;
    filesToAdd.forEach(async (file, i) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      setPhotos((prev) => {
        const next = [...prev];
        const slot = next[startIndex + i];
        if (!slot) return next;
        next[startIndex + i] = res.ok
          ? { ...slot, uploadedUrl: data.url, uploading: false }
          : { ...slot, uploading: false, error: data.error || "Upload failed" };
        return next;
      });
    });

    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setError("");
  }

  function handlePriceChange(value: string) {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setForm({ ...form, price: digitsOnly });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (anyUploading) {
      setError("Wait for photos to finish uploading first.");
      return;
    }
    if (photos.some((p) => p.error)) {
      setError("Remove any photos that failed to upload before posting.");
      return;
    }

    setLoading(true);
    const photoUrls = photos.map((p) => p.uploadedUrl).filter((u): u is string => !!u);
    const url = isEdit ? `/api/listings/${initial!.id}` : "/api/listings";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, photoUrls }),
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
      <h1 className="page-title" style={{ fontSize: 30 }}>{isEdit ? "Edit listing" : "Start Sell"}</h1>
      <p className="subtitle">{isEdit ? "Update your listing details." : "Set your price — buyers can still send you an offer."}</p>
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
            <SafetyNudge />
          </div>
          <div className="field">
            <label>Photos ({photos.length}/{MAX_LISTING_PHOTOS})</label>

            {photos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginBottom: 10 }}>
                {photos.map((photo, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img
                      src={photo.previewUrl}
                      alt={`Photo ${i + 1}`}
                      style={{
                        width: "100%", height: 80, objectFit: "cover", borderRadius: 10,
                        border: photo.error ? "1.5px solid var(--danger)" : "1.5px solid var(--border)",
                        opacity: photo.uploading ? 0.5 : 1,
                      }}
                    />
                    {photo.uploading && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text)" }}>
                        Uploading…
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{
                        position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                        background: "var(--danger)", color: "white", border: "none", fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                    {i === 0 && !photo.uploading && (
                      <div style={{ position: "absolute", bottom: 4, left: 4, background: "var(--accent)", color: "var(--accent-ink)", fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>
                        MAIN
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_LISTING_PHOTOS && (
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handlePhotosChange} />
            )}
            <div className="hint">
              Up to {MAX_LISTING_PHOTOS} photos. Best results: square photos, at least 800×800px. First photo is used as the main thumbnail.
            </div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading || anyUploading}>
            {loading ? (isEdit ? "Saving…" : "Posting…") : anyUploading ? "Waiting for photos to upload…" : isEdit ? "Save changes" : "Post listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
