import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const createGroupSchema = z.object({
  marketId: z.string().min(1),
  name: z.string().min(1),
  url: z.string().optional(),
  groupType: z.string().optional(),
  memberCount: z.number().int().optional(),
  activityLevel: z.string().optional(),
  sellerPotential: z.string().optional(),
  investorSaturation: z.string().optional(),
  postingRules: z.string().optional(),
  promotionAllowed: z.boolean().optional(),
  realEstateAllowed: z.boolean().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const marketId = new URL(request.url).searchParams.get("marketId");
  const groups = await prisma.group.findMany({
    where: { userId, ...(marketId ? { marketId } : {}) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const market = await prisma.market.findFirst({ where: { id: parsed.data.marketId, userId } });
  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

  const group = await prisma.group.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(group, { status: 201 });
}
