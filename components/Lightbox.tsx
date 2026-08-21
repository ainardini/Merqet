"use client";

import { useEffect, useState } from "react";

type Props = {
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

export default function Lightbox({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.9)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: 18, right: 18, width: 40, height: 40, borderRadius: "50%",
          background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)",
          fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ×
      </button>

      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
          aria-label="Previous photo"
          style={{
            position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%", background: "var(--surface)",
            border: "1px solid var(--border)", color: "var(--text)", fontSize: 20, cursor: "pointer",
          }}
        >
          ‹
        </button>
      )}

      <img
        src={images[index]}
        alt={`Photo ${index + 1} of ${images.length}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
            aria-label="Next photo"
            style={{
              position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%", background: "var(--surface)",
              border: "1px solid var(--border)", color: "var(--text)", fontSize: 20, cursor: "pointer",
            }}
          >
            ›
          </button>
          <div
            style={{
              position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999,
              padding: "4px 14px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-soft)",
            }}
          >
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
