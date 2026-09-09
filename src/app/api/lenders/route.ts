import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LENDER_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

const createLenderSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  geography: z.string().optional(),
  loanType: z.string().optional(),
  terms: z.record(z.any()),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lenders = await prisma.lender.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(lenders.map((l) => deserializeJsonFields(l, LENDER_JSON_FIELDS)));
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createLenderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = serializeJsonFields({ ...parsed.data, userId }, LENDER_JSON_FIELDS);
  const lender = await prisma.lender.create({ data: data as Prisma.LenderCreateInput });
  return NextResponse.json(deserializeJsonFields(lender, LENDER_JSON_FIELDS), { status: 201 });
}
