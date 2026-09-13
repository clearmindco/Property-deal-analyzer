import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

// Singleton-per-user config -- the only source the CFO capital-position engine
// (src/lib/ops/cfoCapitalPosition.ts) reads for cash/reserve facts.

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.companySettings.findUnique({ where: { userId } });
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const toNumberOrNull = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const data = {
    cashOnHand: toNumberOrNull(body.cashOnHand),
    reserveMinimum: toNumberOrNull(body.reserveMinimum),
    committedCapital: toNumberOrNull(body.committedCapital),
  };

  const settings = await prisma.companySettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return NextResponse.json(settings);
}
