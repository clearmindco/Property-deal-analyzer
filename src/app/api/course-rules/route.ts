import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { COURSE_RULE_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.courseRule.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows.map((r) => deserializeJsonFields(r, COURSE_RULE_JSON_FIELDS)));
}

// Adds a new documented course-source fact. Never overwrites an existing row for the same
// `key` -- conflicting versions are meant to coexist until a human resolves them.
export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.key || !body.sourceLabel || !body.ruleText) {
    return NextResponse.json({ error: "key, sourceLabel, and ruleText are required" }, { status: 400 });
  }

  const data = serializeJsonFields(
    {
      userId,
      key: String(body.key),
      sourceLabel: String(body.sourceLabel),
      ruleText: String(body.ruleText),
      details: Array.isArray(body.details) ? body.details : null,
      status: "NEEDS_CLARIFICATION",
    },
    COURSE_RULE_JSON_FIELDS
  );

  const row = await prisma.courseRule.create({ data: data as Prisma.CourseRuleCreateInput });
  return NextResponse.json(deserializeJsonFields(row, COURSE_RULE_JSON_FIELDS));
}
