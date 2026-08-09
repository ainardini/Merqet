import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: user.id, listingId: params.id } },
    update: {},
    create: { userId: user.id, listingId: params.id },
  });

  return NextResponse.json({ favorited: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  await prisma.favorite.deleteMany({ where: { userId: user.id, listingId: params.id } });

  return NextResponse.json({ favorited: false });
}
