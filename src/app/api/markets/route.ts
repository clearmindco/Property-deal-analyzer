import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const createMarketSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const markets = await prisma.market.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { groups: true },
  });
  return NextResponse.json(markets);
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createMarketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const market = await prisma.market.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(market, { status: 201 });
}
