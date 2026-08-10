import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireIfNeeded } from "@/lib/offers";

const VALID_CATEGORIES = ["Furniture", "Clothes", "Accessories", "Electronics", "Beauty", "Others"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await expireIfNeeded(params.id);
  const user = await getCurrentUser();

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: { select: { id: true, name: true } },
      offers: {
        include: { buyer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      favoritedBy: user ? { where: { userId: user.id }, select: { id: true } } : false,
      _count: { select: { favoritedBy: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const myReview = user
    ? await prisma.review.findUnique({ where: { listingId_reviewerId: { listingId: params.id, reviewerId: user.id } } })
    : null;

  const isOwner = user?.id === listing.sellerId;
  return NextResponse.json({
    listing: {
      ...listing,
      // Buyers shouldn't see the full competing-offer list, only their own.
      offers: isOwner ? listing.offers : listing.offers.filter((o: { buyerId: string }) => o.buyerId === user?.id),
      isFavorited: user ? listing.favoritedBy.length > 0 : false,
      favoriteCount: listing._count.favoritedBy,
    },
    isOwner,
    myReview,
  });
}

// Sellers can only edit a listing while it's still "available" — once an
// offer is accepted or it's sold, the details are locked in for the buyer's
// sake, so a seller can't quietly change the price mid-deal.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can edit this listing" }, { status: 403 });
  }
  if (listing.status !== "available") {
    return NextResponse.json({ error: "Can't edit a listing that's reserved or sold" }, { status: 400 });
  }

  const { title, description, category, condition, price, currency, meetupLocation, photoUrls } = await req.json();

  if (!title || !description || !condition || !price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
  }
  const currencyValue = currency === "KRW" ? "KRW" : "MYR";
  const categoryValue = VALID_CATEGORIES.includes(category) ? category : "Others";
  const photoUrlsValue = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === "string").slice(0, 5) : listing.photoUrls;

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      title,
      description,
      category: categoryValue,
      condition,
      price: Math.round(priceNum),
      currency: currencyValue,
      meetupLocation: meetupLocation?.trim() || null,
      photoUrls: photoUrlsValue,
    },
  });

  return NextResponse.json({ listing: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can delete this listing" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
