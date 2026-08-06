import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can mark this as sold" }, { status: 403 });
  }
  if (listing.status === "sold") {
    return NextResponse.json({ error: "Already marked as sold" }, { status: 400 });
  }

  await prisma.$transaction([
    // Close out any offers that were still open, so nobody's left waiting on a listing that's gone.
    prisma.offer.updateMany({
      where: { listingId: params.id, status: { in: ["pending", "accepted", "confirmed"] } },
      data: { status: "rejected" },
    }),
    prisma.listing.update({
      where: { id: params.id },
      data: { status: "sold", reservedOfferId: null, reservedUntil: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
