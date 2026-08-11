import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/auth";

const VALID_STATUSES = ["open", "dismissed", "actioned"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const report = await prisma.report.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json({ report });
}
