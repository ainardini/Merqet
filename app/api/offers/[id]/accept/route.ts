import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { OFFER_WINDOW_HOURS } from "@/lib/offers";
import { sendOfferAcceptedEmail } from "@/lib/email";
import { formatPrice } from "@/lib/currency";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { listing: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can accept an offer" }, { status: 403 });
  }
  if (offer.listing.status !== "available") {
    return NextResponse.json({ error: "This listing already has an active reservation" }, { status: 400 });
  }
  if (offer.status !== "pending") {
    return NextResponse.json({ error: "This offer is no longer pending" }, { status: 400 });
  }

  const reservedUntil = new Date(Date.now() + OFFER_WINDOW_HOURS * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: "accepted" } }),
    prisma.offer.updateMany({
      where: { listingId: offer.listingId, id: { not: offer.id }, status: "pending" },
      data: { status: "rejected" },
    }),
    prisma.listing.update({
      where: { id: offer.listingId },
      data: { status: "reserved", reservedOfferId: offer.id, reservedUntil },
    }),
  ]);

  prisma.user.findUnique({ where: { id: offer.buyerId }, select: { email: true } }).then((buyer: { email: string } | null) => {
    if (buyer) sendOfferAcceptedEmail(buyer.email, offer.listing.title, formatPrice(offer.amount, offer.listing.currency), offer.listingId).catch(() => {});
  });

  return NextResponse.json({ ok: true, reservedUntil });
}
