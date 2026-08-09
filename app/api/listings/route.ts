import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireAllStale } from "@/lib/offers";

export async function GET(req: NextRequest) {
  await expireAllStale();

  const user = await getCurrentUser();
  const category = req.nextUrl.searchParams.get("category");
  const search = req.nextUrl.searchParams.get("q")?.trim();
  const sort = req.nextUrl.searchParams.get("sort") || "newest";

  const orderBy =
    sort === "price_low" ? { price: "asc" as const } :
    sort === "price_high" ? { price: "desc" as const } :
    { createdAt: "desc" as const };

  const listings = await prisma.listing.findMany({
    where: {
      status: { not: "sold" },
      ...(category && category !== "All" ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      seller: { select: { id: true, name: true } },
      offers: user ? { where: { buyerId: user.id } } : false,
      favoritedBy: user ? { where: { userId: user.id }, select: { id: true } } : false,
      _count: { select: { favoritedBy: true } },
    },
    orderBy,
  });

  const withFavorites = listings.map((l: (typeof listings)[number]) => ({
    ...l,
    isFavorited: user ? l.favoritedBy.length > 0 : false,
    favoriteCount: l._count.favoritedBy,
  }));

  return NextResponse.json({ listings: withFavorites });
}

const VALID_CATEGORIES = ["Furniture", "Clothes", "Accessories", "Electronics", "Beauty", "Others"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

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
  const photoUrlsValue = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === "string").slice(0, 5) : [];

  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      category: categoryValue,
      condition,
      price: Math.round(priceNum),
      currency: currencyValue,
      meetupLocation: meetupLocation?.trim() || null,
      emoji: "📦",
      photoUrls: photoUrlsValue,
      sellerId: user.id,
    },
  });

  return NextResponse.json({ listing });
}
