import { prisma } from "./db";

export const OFFER_WINDOW_HOURS = 48;

/**
 * Lazily expires a reservation if its window has passed.
 * Call this before returning any listing to the client so state
 * is always correct without needing a background job/cron.
 */
export async function expireIfNeeded(listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return null;

  if (listing.status === "reserved" && listing.reservedUntil && listing.reservedUntil < new Date()) {
    await prisma.$transaction([
      prisma.offer.updateMany({
        where: { listingId, status: "accepted" },
        data: { status: "expired" },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: { status: "available", reservedOfferId: null, reservedUntil: null },
      }),
    ]);
    return prisma.listing.findUnique({ where: { id: listingId } });
  }

  return listing;
}

export async function expireAllStale() {
  const now = new Date();
  const stale = await prisma.listing.findMany({
    where: { status: "reserved", reservedUntil: { lt: now } },
    select: { id: true },
  });
  for (const l of stale) {
    await expireIfNeeded(l.id);
  }
}
