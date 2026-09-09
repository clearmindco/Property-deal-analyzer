import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { DEAL_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";

const createDealSchema = z.object({
  address: z.string().min(3),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  askingPrice: z.number().optional(),
  propertyType: z.string().optional(),
  units: z.number().int().min(1).default(1),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  sqft: z.number().int().optional(),
});

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deals = await prisma.deal.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(deals.map((d) => deserializeJsonFields(d, DEAL_JSON_FIELDS)));
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createDealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: { ...parsed.data, userId },
  });
  return NextResponse.json(deal, { status: 201 });
}
