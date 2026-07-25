import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireIfNeeded } from "@/lib/offers";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { listing: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.buyerId !== user.id) {
    return NextResponse.json({ error: "Only the buyer can confirm this purchase" }, { status: 403 });
  }

  // Re-check expiry right before confirming, in case the 48h window just passed.
  const listing = await expireIfNeeded(offer.listingId);
  if (!listing || listing.status !== "reserved" || listing.reservedOfferId !== offer.id) {
    return NextResponse.json({ error: "This offer has expired or is no longer active" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: "confirmed" } }),
    prisma.listing.update({ where: { id: offer.listingId }, data: { status: "confirmed" } }),
  ]);

  return NextResponse.json({ ok: true });
}
