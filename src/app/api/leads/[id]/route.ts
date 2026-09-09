import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LEAD_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

const PATCHABLE_FIELDS = [
  "sellerName", "address", "phone", "email", "status", "motivation", "details", "notes",
  "marketId", "groupId", "sourcePostId", "dealId",
  "qualification", "priorityLevel", "priorityReasons",
  "lastContactAt", "nextFollowUpAt",
] as const;

const DATE_FIELDS = new Set(["lastContactAt", "nextFollowUpAt"]);

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findFirst({ where: { id: params.id, userId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deserializeJsonFields(lead, LEAD_JSON_FIELDS));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.lead.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) {
      const value = body[field];
      data[field] = DATE_FIELDS.has(field) && value ? new Date(value) : value;
    }
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data: serializeJsonFields(data, LEAD_JSON_FIELDS) });
  return NextResponse.json(deserializeJsonFields(lead, LEAD_JSON_FIELDS));
}
