import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (params.id === user.id) {
    return NextResponse.json({ error: "You can't report yourself" }, { status: 400 });
  }

  const { reason, details, listingId } = await req.json();
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }

  const reportedUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!reportedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedUserId: params.id,
      reason: reason.slice(0, 200),
      details: details?.trim() ? details.trim().slice(0, 1000) : null,
      listingId: listingId || null,
    },
  });

  return NextResponse.json({ ok: true });
}
