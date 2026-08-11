import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/currency";
import { getListingPhotos } from "@/lib/photos";
import ListingDetailClient from "@/components/ListingDetailClient";

// Server component wrapper: its only job is generating real Open Graph tags
// (title, description, image) so a Merqet listing link pasted into
// WhatsApp/iMessage/Discord shows a rich preview instead of a plain gray
// box. The actual interactive page is ListingDetailClient, a client
// component that fetches its own data — this wrapper doesn't pass props to
// it, it just renders it alongside the metadata.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, price: true, currency: true, photoUrl: true, photoUrls: true, status: true },
  });

  if (!listing) {
    return { title: "Listing not found | Merqet" };
  }

  const photo = getListingPhotos(listing)[0];
  const priceLabel = formatPrice(listing.price, listing.currency);
  const title = `${listing.title} — ${priceLabel} | Merqet`;
  const description = listing.status === "sold"
    ? `Sold — ${listing.description.slice(0, 150)}`
    : listing.description.slice(0, 150);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: photo ? [{ url: photo }] : [],
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title,
      description,
      images: photo ? [photo] : [],
    },
  };
}

export default function ListingDetailPage() {
  return <ListingDetailClient />;
}
