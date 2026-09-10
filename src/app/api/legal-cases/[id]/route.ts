import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LEGAL_CASE_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";
import type { LegalIntake, LegalTransactionType } from "@/lib/types/legal";
import { computeLegalCase } from "@/lib/legal/computeLegalCase";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const legalCase = await prisma.legalCase.findFirst({ where: { id: params.id, userId } });
  if (!legalCase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deserializeJsonFields(legalCase, LEGAL_CASE_JSON_FIELDS));
}

/**
 * Updates the intake facts and/or transaction type on a legal case, then recomputes the risk
 * gate, required-document checklist, and attorney summary from scratch through
 * computeLegalCase -- nothing here is hand-patched independently, so the three always stay
 * consistent with each other and with the current intake.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingRaw = await prisma.legalCase.findFirst({ where: { id: params.id, userId } });
  if (!existingRaw) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existing = deserializeJsonFields(existingRaw, LEGAL_CASE_JSON_FIELDS);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const currentIntake = (existing.intake as unknown as LegalIntake | null) ?? undefined;
  const intake: LegalIntake = { ...(currentIntake as LegalIntake), ...(body.intake ?? {}) };
  const transactionType: LegalTransactionType = body.transactionType ?? (existing.transactionType as LegalTransactionType);

  const computed = computeLegalCase(intake, transactionType);

  const data = serializeJsonFields(
    {
      transactionType,
      intake,
      triggerResult: computed.triggerResult,
      requiredDocuments: computed.requiredDocuments,
      attorneySummary: computed.attorneySummary,
      status: computed.status,
      mortgageStatementReceived: intake.mortgageStatementReceived,
    },
    LEGAL_CASE_JSON_FIELDS
  );

  const legalCase = await prisma.legalCase.update({ where: { id: params.id }, data: data as any });

  if (computed.triggerResult.triggered && existing.status !== "RED_GATE_HOLD") {
    await prisma.complianceEvent.create({
      data: {
        legalCaseId: legalCase.id,
        eventType: "RED_GATE_TRIGGERED",
        detail: computed.triggerResult.triggeringFacts.join("; "),
      },
    });
  }

  return NextResponse.json(deserializeJsonFields(legalCase, LEGAL_CASE_JSON_FIELDS));
}
