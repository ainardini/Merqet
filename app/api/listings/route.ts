import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireAllStale } from "@/lib/offers";

export async function GET(req: NextRequest) {
  await expireAllStale();

  const user = await getCurrentUser();
  const category = req.nextUrl.searchParams.get("category");

  const listings = await prisma.listing.findMany({
    where: {
      status: { not: "sold" },
      ...(user ? { sellerId: { not: user.id } } : {}),
      ...(category && category !== "All" ? { category } : {}),
    },
    include: {
      seller: { select: { name: true } },
      offers: user ? { where: { buyerId: user.id } } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { title, description, category, condition, price, emoji } = await req.json();

  if (!title || !description || !category || !condition || !price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      category,
      condition,
      price: Math.round(priceNum),
      emoji: emoji || "📦",
      sellerId: user.id,
    },
  });

  return NextResponse.json({ listing });
}
