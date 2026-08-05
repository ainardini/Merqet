// One-time migration: run this AFTER pushing schema.phaseA.prisma (which adds
// Conversation/ConversationRead and a nullable conversationId to Message,
// while keeping the old listingId column around) and BEFORE switching to the
// final schema.prisma (which removes listingId).
//
// What it does: for every listing with old messages, it figures out who the
// buyer was (whoever sent messages that wasn't the seller) and creates a
// proper Conversation for them, then reattaches all of that listing's old
// messages to it.
//
// Known limitation: the old chat was never scoped per-buyer, so if a listing
// ever had more than one different buyer messaging the seller, there's no
// way to know for certain which buyer sent which message. This script
// detects that case, logs a warning, and attributes everything to whichever
// buyer messaged first (chronologically) rather than silently dropping data.
// If this warning shows up for a listing you care about, review it in your
// database afterward — you may want to manually split those messages.
//
// Usage: node prisma/migrate-chat-data.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({ select: { id: true, sellerId: true, title: true } });

  let migratedCount = 0;
  let skippedCount = 0;
  let ambiguousListings = 0;

  for (const listing of listings) {
    const oldMessages = await prisma.message.findMany({
      where: { listingId: listing.id, conversationId: null },
      orderBy: { createdAt: "asc" },
    });

    if (oldMessages.length === 0) continue;

    const buyerCandidates = [...new Set(oldMessages.map((m) => m.senderId).filter((id) => id !== listing.sellerId))];

    if (buyerCandidates.length === 0) {
      console.log(`Skipping "${listing.title}": all messages were from the seller, no buyer found — unexpected, leaving as-is.`);
      skippedCount += oldMessages.length;
      continue;
    }

    if (buyerCandidates.length > 1) {
      ambiguousListings++;
      console.warn(
        `⚠️  "${listing.title}" had messages from ${buyerCandidates.length} different buyers mixed together ` +
        `(this was the old bug). Attributing ALL of them to the first buyer who messaged. Review this listing's ` +
        `messages afterward if it matters — buyer IDs involved: ${buyerCandidates.join(", ")}`
      );
    }

    const buyerId = buyerCandidates[0]; // earliest sender chronologically, since oldMessages is sorted asc

    let conversation = await prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId: listing.id, buyerId } },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: listing.id,
          buyerId,
          lastMessageAt: oldMessages[oldMessages.length - 1].createdAt,
        },
      });
    }

    for (const msg of oldMessages) {
      await prisma.message.update({ where: { id: msg.id }, data: { conversationId: conversation.id } });
      migratedCount++;
    }
  }

  console.log(`\nDone. Migrated ${migratedCount} messages, skipped ${skippedCount}, ${ambiguousListings} listing(s) had ambiguous multi-buyer history.`);
  console.log("Next: switch schema.prisma to the final version and run `npm run db:push` again to drop the old listingId column.");
}

main().finally(() => prisma.$disconnect());
