import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { listing: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can reject an offer" }, { status: 403 });
  }
  if (offer.status !== "pending") {
    return NextResponse.json({ error: "This offer is no longer pending" }, { status: 400 });
  }

  await prisma.offer.update({ where: { id: offer.id }, data: { status: "rejected" } });
  return NextResponse.json({ ok: true });
}
