import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CONTACT_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

const PATCHABLE_FIELDS = [
  "name", "company", "trade", "phone", "email", "category", "notes", "roles",
  "market", "leadSource", "relationshipStatus", "preferredContactMethod",
  "lastContactAt", "nextFollowUpAt",
] as const;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contact = await prisma.contact.findFirst({ where: { id: params.id, userId } });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deals = await prisma.deal.findMany({
    where: { sourceContactId: contact.id, userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, address: true, stage: true, sourceType: true, askingPrice: true, contractPrice: true, assignmentFee: true },
  });

  return NextResponse.json({ ...deserializeJsonFields(contact, CONTACT_JSON_FIELDS), deals });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.contact.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const contact = await prisma.contact.update({ where: { id: params.id }, data: serializeJsonFields(data, CONTACT_JSON_FIELDS) });
  return NextResponse.json(deserializeJsonFields(contact, CONTACT_JSON_FIELDS));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.contact.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
