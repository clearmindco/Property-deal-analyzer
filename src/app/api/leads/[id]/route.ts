import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LEAD_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

const PATCHABLE_FIELDS = ["sellerName", "address", "phone", "email", "status", "motivation", "details", "notes"] as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.lead.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data: serializeJsonFields(data, LEAD_JSON_FIELDS) });
  return NextResponse.json(deserializeJsonFields(lead, LEAD_JSON_FIELDS));
}
