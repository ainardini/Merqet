import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, campus: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}
