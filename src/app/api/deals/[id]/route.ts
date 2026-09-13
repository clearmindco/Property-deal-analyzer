import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { DEAL_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deal = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deserializeJsonFields(deal, DEAL_JSON_FIELDS));
}

const PATCHABLE_FIELDS = [
  "address", "city", "state", "zip", "askingPrice", "propertyType", "units",
  "bedrooms", "bathrooms", "sqft", "stage",
  "property", "seller", "valueArv", "rehab", "rent", "financing",
  "creativeFinance", "assumptions", "dealKillers",
  "sourceContactId", "sourceType", "contractPrice", "assignmentFee",
  "assignmentPermitted", "sellerApprovalForTerms", "wholesalerControlsContract",
  "nextAction", "nextActionOwner", "nextContactMethod", "followUpCadence",
] as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const deal = await prisma.deal.update({ where: { id: params.id }, data: serializeJsonFields(data, DEAL_JSON_FIELDS) });
  return NextResponse.json(deserializeJsonFields(deal, DEAL_JSON_FIELDS));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
