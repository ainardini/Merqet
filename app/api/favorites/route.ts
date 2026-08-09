import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: { seller: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    listings: favorites.map((f: (typeof favorites)[number]) => f.listing),
  });
}
