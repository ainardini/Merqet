import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireIfNeeded } from "@/lib/offers";

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
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = user?.id === listing.sellerId;
  return NextResponse.json({
    listing: {
      ...listing,
      // Buyers shouldn't see the full competing-offer list, only their own.
    offers: isOwner ? listing.offers : listing.offers.filter((o: { buyerId: string }) => o.buyerId === user?.id),
    },
    isOwner,
  });
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
