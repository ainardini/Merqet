import { prisma } from "./db";

// Finds a buyer's conversation with a listing's seller, creating it on first
// contact. Sellers never "create" a conversation this way — one only exists
// once a buyer has reached out.
export async function getOrCreateConversation(listingId: string, buyerId: string) {
  const existing = await prisma.conversation.findUnique({
    where: { listingId_buyerId: { listingId, buyerId } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { listingId, buyerId },
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationRead.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    update: { lastReadAt: new Date() },
    create: { conversationId, userId, lastReadAt: new Date() },
  });
}

// Unread = messages from someone else, sent after this user's last read time
// (or all of them, if this user has never opened the conversation).
export async function countUnread(conversationId: string, userId: string) {
  const read = await prisma.conversationRead.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      ...(read ? { createdAt: { gt: read.lastReadAt } } : {}),
    },
  });
}
