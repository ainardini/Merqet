import { prisma } from "./db";

// True if either user has blocked the other. Blocking is one-directional to
// set up, but its effects are mutual — if A blocks B, B can't reach A either.
export async function isBlockedEitherWay(userIdA: string, userIdB: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return !!block;
}

export async function getSellerRating(sellerId: string) {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: sellerId },
    select: { rating: true },
  });
  if (reviews.length === 0) return { average: null, count: 0 };
  const average = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}
