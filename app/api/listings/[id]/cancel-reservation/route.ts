import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can cancel this" }, { status: 403 });
  }
  if (listing.status !== "reserved" && listing.status !== "confirmed") {
    return NextResponse.json({ error: "Nothing to cancel" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.offer.updateMany({
      where: { listingId: listing.id, status: { in: ["accepted", "confirmed"] } },
      data: { status: "rejected" },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: { status: "available", reservedOfferId: null, reservedUntil: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
