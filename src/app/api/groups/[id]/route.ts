import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.group.findFirst({
    where: { id: params.id, userId },
    include: { posts: { orderBy: { createdAt: "desc" } }, market: true },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

const PATCHABLE_FIELDS = [
  "name", "url", "groupType", "memberCount", "activityLevel", "sellerPotential",
  "investorSaturation", "postingRules", "promotionAllowed", "realEstateAllowed",
  "dateJoined", "lastPostDate", "lastEngagementDate", "priority", "notes",
] as const;

const DATE_FIELDS = new Set(["dateJoined", "lastPostDate", "lastEngagementDate"]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.group.findFirst({ where: { id: params.id, userId } });
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

  const group = await prisma.group.update({ where: { id: params.id }, data });
  return NextResponse.json(group);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.group.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.group.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
