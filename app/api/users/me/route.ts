import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSellerRating } from "@/lib/moderation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const [itemsSold, itemsBought, rating] = await Promise.all([
    prisma.listing.count({ where: { sellerId: user.id, status: "sold" } }),
    prisma.offer.count({ where: { buyerId: user.id, status: "confirmed" } }),
    getSellerRating(user.id),
  ]);

  return NextResponse.json({ user, stats: { itemsSold, itemsBought, rating: rating.average, reviewCount: rating.count } });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { name, campus, avatarUrl } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name.trim().slice(0, 100),
      campus: campus?.trim().slice(0, 100) || null,
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
    select: { id: true, email: true, name: true, campus: true, avatarUrl: true, emailVerified: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}
