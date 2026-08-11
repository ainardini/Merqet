import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reportedUser: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}
