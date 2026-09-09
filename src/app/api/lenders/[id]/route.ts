import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LENDER_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

const PATCHABLE_FIELDS = [
  "name", "contact", "email", "phone", "website", "geography", "loanType",
  "terms", "verified", "quoteDate", "notes",
] as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.lender.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const lender = await prisma.lender.update({ where: { id: params.id }, data: serializeJsonFields(data, LENDER_JSON_FIELDS) });
  return NextResponse.json(deserializeJsonFields(lender, LENDER_JSON_FIELDS));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.lender.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.lender.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
