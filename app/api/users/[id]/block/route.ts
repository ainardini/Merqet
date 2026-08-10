import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ blocked: false });

  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: params.id } },
  });
  return NextResponse.json({ blocked: !!block });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (params.id === user.id) {
    return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });
  }

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: params.id } },
    update: {},
    create: { blockerId: user.id, blockedId: params.id },
  });

  return NextResponse.json({ blocked: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: params.id } });

  return NextResponse.json({ blocked: false });
}
