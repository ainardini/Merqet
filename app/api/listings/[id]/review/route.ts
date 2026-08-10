import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { rating, comment } = await req.json();
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Rating must be a whole number from 1 to 5" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status !== "sold") {
    return NextResponse.json({ error: "You can only review a listing after the sale is complete" }, { status: 400 });
  }

  // Confirm this user was actually the buyer who completed this purchase —
  // not just anyone who happened to make an offer at some point.
  const completedOffer = await prisma.offer.findFirst({
    where: { listingId: params.id, buyerId: user.id, status: { in: ["confirmed", "accepted"] } },
  });
  if (!completedOffer) {
    return NextResponse.json({ error: "Only the buyer who completed this purchase can leave a review" }, { status: 403 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        listingId: params.id,
        reviewerId: user.id,
        revieweeId: listing.sellerId,
        rating: ratingNum,
        comment: comment?.trim() ? comment.trim().slice(0, 1000) : null,
      },
    });
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "You've already reviewed this listing" }, { status: 409 });
  }
}
