import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import type { GeneratedDocumentStatus } from "@/lib/types/legal";
import { canModifyGeneratedDocument } from "@/lib/legal/documentImmutability";

const VALID_STATUSES: GeneratedDocumentStatus[] = ["DRAFT", "UNDER_REVIEW", "APPROVED", "EXECUTED", "VOID"];

/**
 * Status transitions only -- there is no endpoint to edit a generated document's content.
 * Once a document is EXECUTED or VOID, canModifyGeneratedDocument blocks every further change,
 * matching the spec's immutability requirement for signed documents.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.generatedDocument.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canModifyGeneratedDocument(existing.status as GeneratedDocumentStatus)) {
    return NextResponse.json({ error: `This document is ${existing.status.toLowerCase()} and can no longer be modified.` }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const nextStatus = body?.status as GeneratedDocumentStatus | undefined;
  if (!nextStatus || !VALID_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const doc = await prisma.generatedDocument.update({
    where: { id: params.id },
    data: { status: nextStatus, executedAt: nextStatus === "EXECUTED" ? new Date() : existing.executedAt },
  });

  return NextResponse.json({ id: doc.id, status: doc.status, executedAt: doc.executedAt });
}
