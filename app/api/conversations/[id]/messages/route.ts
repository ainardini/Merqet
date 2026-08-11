import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markConversationRead, countUnread } from "@/lib/conversations";
import { isBlockedEitherWay } from "@/lib/moderation";
import { sendNewMessageEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

async function requireParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { listing: { select: { id: true, sellerId: true, title: true } }, buyer: { select: { id: true, name: true } } },
  });
  if (!conversation) return null;
  const isParticipant = conversation.buyerId === userId || conversation.listing.sellerId === userId;
  return isParticipant ? conversation : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const conversation = await requireParticipant(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  await markConversationRead(params.id, user.id);

  return NextResponse.json({ messages, conversation });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await checkRateLimit(`message:${user.id}`, 60, 300))) {
    return NextResponse.json({ error: "You're sending messages too quickly — slow down a bit" }, { status: 429 });
  }

  const conversation = await requireParticipant(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const otherPartyId = conversation.buyerId === user.id ? conversation.listing.sellerId : conversation.buyerId;
  if (await isBlockedEitherWay(user.id, otherPartyId)) {
    return NextResponse.json({ error: "You can't message this user" }, { status: 403 });
  }

  const { body, attachmentUrl, attachmentType } = await req.json();
  const trimmedBody = typeof body === "string" ? body.trim() : "";
  const hasAttachment = attachmentUrl && ["image", "audio"].includes(attachmentType);

  if (!trimmedBody && !hasAttachment) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  // Check before creating: if the recipient already has unread messages here,
  // they've already been notified — don't email again for every message in
  // an active back-and-forth.
  const alreadyHadUnread = (await countUnread(params.id, otherPartyId)) > 0;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: user.id,
        body: trimmedBody ? trimmedBody.slice(0, 2000) : null,
        attachmentUrl: hasAttachment ? attachmentUrl : null,
        attachmentType: hasAttachment ? attachmentType : null,
      },
      include: { sender: { select: { id: true, name: true } } },
    }),
    prisma.conversation.update({ where: { id: params.id }, data: { lastMessageAt: new Date() } }),
  ]);

  await markConversationRead(params.id, user.id);

  if (!alreadyHadUnread) {
    prisma.user.findUnique({ where: { id: otherPartyId }, select: { email: true } }).then((recipient: { email: string } | null) => {
      if (recipient) sendNewMessageEmail(recipient.email, user.name, conversation.listing.title).catch(() => {});
    });
  }

  return NextResponse.json({ message });
}
