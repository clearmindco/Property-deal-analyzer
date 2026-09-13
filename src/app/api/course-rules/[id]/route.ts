import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { COURSE_RULE_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";

const VALID_STATUSES = new Set(["NEEDS_CLARIFICATION", "AUTHORITATIVE", "SUPERSEDED"]);

// Status-only update -- a human designates one version authoritative / another superseded.
// Never automatic: see src/lib/ops/cmoMarketingToday.ts for why this stays manual.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.courseRule.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.status !== "string" || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "status must be one of NEEDS_CLARIFICATION | AUTHORITATIVE | SUPERSEDED" }, { status: 400 });
  }

  const row = await prisma.courseRule.update({ where: { id: params.id }, data: { status: body.status } });
  return NextResponse.json(deserializeJsonFields(row, COURSE_RULE_JSON_FIELDS));
}
