import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { countUnread } from "@/lib/conversations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: user.id }, { listing: { sellerId: user.id } }],
    },
    include: {
      listing: { select: { id: true, title: true, emoji: true, photoUrl: true, photoUrls: true, sellerId: true, seller: { select: { id: true, name: true } } } },
      buyer: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const withUnread = await Promise.all(
    conversations.map(async (c: (typeof conversations)[number]) => ({
      id: c.id,
      listing: c.listing,
      otherParty: c.buyerId === user.id ? c.listing.seller : c.buyer,
      role: c.buyerId === user.id ? "buyer" : "seller",
      lastMessage: c.messages[0] || null,
      lastMessageAt: c.lastMessageAt,
      unreadCount: await countUnread(c.id, user.id),
    }))
  );

  return NextResponse.json({ conversations: withUnread });
}
