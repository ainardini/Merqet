import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markConversationRead } from "@/lib/conversations";
import { isBlockedEitherWay } from "@/lib/moderation";

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

  return NextResponse.json({ message });
}
