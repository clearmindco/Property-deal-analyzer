import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  GENERATED_DOCUMENT_JSON_FIELDS, LEGAL_CASE_JSON_FIELDS, TEMPLATE_VERSION_JSON_FIELDS,
  deserializeJsonFields, serializeJsonFields,
} from "@/lib/jsonFields";
import type {
  AttorneyReviewStatus, DocumentRequirement, LegalIntake, LegalTransactionType, LegalTriggerResult,
} from "@/lib/types/legal";
import { NEVER_TEMPLATED_KEYS } from "@/lib/legal/templateRegistry";
import { ensureTemplateVersion } from "@/lib/legal/ensureTemplateVersion";
import { assembleDocumentBody, buildDocumentFieldsSnapshot } from "@/lib/legal/documentAssembly";

/** Lists every generated document for this legal case with its assembled (placeholder) body,
 * so the UI never has to re-implement the token-substitution rules. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const legalCase = await prisma.legalCase.findFirst({ where: { id: params.id, userId } });
  if (!legalCase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = await prisma.generatedDocument.findMany({
    where: { legalCaseId: legalCase.id },
    include: { templateVersion: { include: { template: true } } },
    orderBy: { createdAt: "asc" },
  });

  const result = docs.map((doc) => {
    const deserialized = deserializeJsonFields(doc, GENERATED_DOCUMENT_JSON_FIELDS);
    const templateVersion = deserializeJsonFields(doc.templateVersion, TEMPLATE_VERSION_JSON_FIELDS);
    const fields = (deserialized.fieldsSnapshot as unknown as Record<string, string> | null) ?? {};
    return {
      id: doc.id,
      documentKey: doc.templateVersion.template.key,
      documentName: doc.templateVersion.template.name,
      status: doc.status,
      executedAt: doc.executedAt,
      attorneyReviewStatus: templateVersion.attorneyReviewStatus,
      body: assembleDocumentBody(
        templateVersion.bodyPlaceholder as string,
        fields,
        templateVersion.attorneyReviewStatus as unknown as AttorneyReviewStatus
      ),
    };
  });

  return NextResponse.json(result);
}

/**
 * Generates a draft GeneratedDocument for every required document on this case that (a) has a
 * registry template and (b) doesn't already have one. Refuses outright when the case is on the
 * distressed-property red gate -- that fact pattern needs attorney-drafted documents from
 * scratch, never a generic template (spec non-negotiable).
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const legalCaseRaw = await prisma.legalCase.findFirst({ where: { id: params.id, userId } });
  if (!legalCaseRaw) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const legalCase = deserializeJsonFields(legalCaseRaw, LEGAL_CASE_JSON_FIELDS);

  const triggerResult = legalCase.triggerResult as unknown as LegalTriggerResult | null;
  if (triggerResult?.blocksStandardContractGeneration) {
    return NextResponse.json(
      { error: "This case is on the distressed-property legal hold. Documents must be attorney-drafted -- they cannot be generated from a template." },
      { status: 409 }
    );
  }

  const deal = await prisma.deal.findFirst({ where: { id: legalCase.dealId, userId } });
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  const lead = legalCase.leadId ? await prisma.lead.findFirst({ where: { id: legalCase.leadId, userId } }) : null;

  const requiredDocuments = (legalCase.requiredDocuments as unknown as DocumentRequirement[] | null) ?? [];
  const existingDocs = await prisma.generatedDocument.findMany({
    where: { legalCaseId: legalCase.id },
    include: { templateVersion: { include: { template: true } } },
  });
  const alreadyGeneratedKeys = new Set(
    existingDocs.filter((d) => d.status !== "VOID").map((d) => d.templateVersion.template.key)
  );

  const fields = buildDocumentFieldsSnapshot({
    dealAddress: deal.address,
    askingPrice: deal.askingPrice,
    transactionType: legalCase.transactionType as LegalTransactionType,
    intake: legalCase.intake as unknown as LegalIntake,
    sellerName: lead?.sellerName ?? null,
  });

  let createdCount = 0;
  for (const doc of requiredDocuments) {
    if (NEVER_TEMPLATED_KEYS.includes(doc.key) || alreadyGeneratedKeys.has(doc.key)) continue;
    const ensured = await ensureTemplateVersion(doc.key);
    if (!ensured) continue;

    const data = serializeJsonFields(
      { userId, legalCaseId: legalCase.id, templateVersionId: ensured.version.id, fieldsSnapshot: fields, status: "DRAFT" },
      GENERATED_DOCUMENT_JSON_FIELDS
    );
    await prisma.generatedDocument.create({ data: data as any });
    createdCount += 1;
  }

  if (createdCount > 0) {
    await prisma.complianceEvent.create({
      data: { legalCaseId: legalCase.id, eventType: "DOCUMENTS_GENERATED", detail: `${createdCount} draft document(s) generated from the template registry.` },
    });
  }

  return NextResponse.json({ createdCount });
}
