import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyPassword, clearSessionCookie } from "@/lib/auth";
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

// Deletes the account and, via cascading foreign keys, everything tied to
// it: listings, offers, messages, reviews given/received, reports,
// favorites, and blocks. Irreversible — requires the current password as
// confirmation, since a valid session alone isn't enough for something this
// destructive.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Enter your password to confirm" }, { status: 400 });
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const valid = await verifyPassword(password, fullUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: user.id } });
  clearSessionCookie();

  return NextResponse.json({ ok: true });
}
