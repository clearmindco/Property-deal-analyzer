import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const PATCHABLE_FIELDS = ["responseOutcome", "leadId", "status"] as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.post.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const post = await prisma.post.update({ where: { id: params.id }, data });

  if (body.responseOutcome && body.responseOutcome !== "NONE") {
    await prisma.group.update({ where: { id: existing.groupId }, data: { lastEngagementDate: new Date() } });
  }

  return NextResponse.json(post);
}
