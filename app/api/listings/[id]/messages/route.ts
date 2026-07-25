import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { listingId: params.id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { body } = await req.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: { listingId: params.id, senderId: user.id, body: body.trim().slice(0, 2000) },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ message });
}
