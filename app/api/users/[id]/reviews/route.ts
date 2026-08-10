import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSellerRating } from "@/lib/moderation";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: params.id },
    include: { reviewer: { select: { name: true } }, listing: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const { average, count } = await getSellerRating(params.id);

  return NextResponse.json({ reviews, average, count });
}
