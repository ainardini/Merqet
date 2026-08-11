import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireIfNeeded } from "@/lib/offers";
import { isBlockedEitherWay } from "@/lib/moderation";
import { sendNewOfferEmail } from "@/lib/email";
import { formatPrice } from "@/lib/currency";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await checkRateLimit(`offer:${user.id}`, 15, 600))) {
    return NextResponse.json({ error: "You're making offers too quickly — try again in a few minutes" }, { status: 429 });
  }

  const { listingId, amount } = await req.json();
  if (!listingId || !amount) {
    return NextResponse.json({ error: "listingId and amount are required" }, { status: 400 });
  }

  const listing = await expireIfNeeded(listingId);
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: "You can't make an offer on your own listing" }, { status: 400 });
  }
  if (listing.status !== "available") {
    return NextResponse.json({ error: "This listing isn't accepting offers right now" }, { status: 400 });
  }
  if (await isBlockedEitherWay(user.id, listing.sellerId)) {
    return NextResponse.json({ error: "You can't make an offer on this listing" }, { status: 403 });
  }

  const amountNum = Math.round(Number(amount));
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Enter a valid offer amount" }, { status: 400 });
  }

  // Replace any earlier pending offer from this same buyer on this listing.
  await prisma.offer.updateMany({
    where: { listingId, buyerId: user.id, status: "pending" },
    data: { status: "rejected" },
  });

  const offer = await prisma.offer.create({
    data: { listingId, buyerId: user.id, amount: amountNum },
  });

  // Best-effort notification — don't let an email failure break offer creation.
  prisma.user.findUnique({ where: { id: listing.sellerId }, select: { email: true } }).then((seller: { email: string } | null) => {
    if (seller) sendNewOfferEmail(seller.email, listing.title, formatPrice(amountNum, listing.currency), listing.id).catch(() => {});
  });

  return NextResponse.json({ offer });
}
