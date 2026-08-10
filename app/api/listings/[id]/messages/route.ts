import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateConversation, markConversationRead, countUnread } from "@/lib/conversations";
import { isBlockedEitherWay } from "@/lib/moderation";
import { sendNewMessageEmail } from "@/lib/email";

// This route is used by the buyer-facing chat box embedded on a listing's
// detail page. It's just a convenience wrapper around that buyer's single
// conversation with the seller — sellers use the Inbox instead, since they
// may have several buyers messaging them about the same listing.

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === user.id) {
    // Sellers don't have "their own" conversation on their own listing — send them to the inbox instead.
    return NextResponse.json({ messages: [] });
  }

  const conversation = await getOrCreateConversation(params.id, user.id);
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  await markConversationRead(conversation.id, user.id);

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { body, attachmentUrl, attachmentType } = await req.json();
  const trimmedBody = typeof body === "string" ? body.trim() : "";
  const hasAttachment = attachmentUrl && ["image", "audio"].includes(attachmentType);

  if (!trimmedBody && !hasAttachment) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: "Sellers should reply from the Inbox" }, { status: 400 });
  }
  if (await isBlockedEitherWay(user.id, listing.sellerId)) {
    return NextResponse.json({ error: "You can't message this seller" }, { status: 403 });
  }

  const conversation = await getOrCreateConversation(params.id, user.id);
  const alreadyHadUnread = (await countUnread(conversation.id, listing.sellerId)) > 0;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        body: trimmedBody ? trimmedBody.slice(0, 2000) : null,
        attachmentUrl: hasAttachment ? attachmentUrl : null,
        attachmentType: hasAttachment ? attachmentType : null,
      },
      include: { sender: { select: { id: true, name: true } } },
    }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } }),
  ]);

  await markConversationRead(conversation.id, user.id);

  if (!alreadyHadUnread) {
    prisma.user.findUnique({ where: { id: listing.sellerId }, select: { email: true } }).then((seller: { email: string } | null) => {
      if (seller) sendNewMessageEmail(seller.email, user.name, listing.title).catch(() => {});
    });
  }

  return NextResponse.json({ message });
}
