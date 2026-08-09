"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ListingForm, { ListingFormInitial } from "@/components/ListingForm";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<ListingFormInitial | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError("Couldn't load this listing.");
        setLoading(false);
        return;
      }
      if (!data.isOwner) {
        router.push(`/listings/${id}`);
        return;
      }
      if (data.listing.status !== "available") {
        setError("This listing can't be edited right now — it's reserved or already sold.");
        setLoading(false);
        return;
      }
      setInitial({
        id: data.listing.id,
        title: data.listing.title,
        description: data.listing.description,
        category: data.listing.category,
        condition: data.listing.condition,
        price: data.listing.price,
        currency: data.listing.currency,
        meetupLocation: data.listing.meetupLocation,
        photoUrls: data.listing.photoUrls || (data.listing.photoUrl ? [data.listing.photoUrl] : []),
      });
      setLoading(false);
    })();
  }, [id, router]);

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  if (error) return <p className="error-msg" style={{ padding: 40 }}>{error}</p>;
  if (!initial) return null;

  return <ListingForm initial={initial} />;
}
