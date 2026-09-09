import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LEAD_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";

const createLeadSchema = z.object({
  sellerName: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  marketId: z.string().optional(),
  groupId: z.string().optional(),
  sourcePostId: z.string().optional(),
});

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await prisma.lead.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(leads.map((l) => deserializeJsonFields(l, LEAD_JSON_FIELDS)));
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const lead = await prisma.lead.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(deserializeJsonFields(lead, LEAD_JSON_FIELDS), { status: 201 });
}
