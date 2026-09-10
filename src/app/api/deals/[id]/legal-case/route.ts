import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LEGAL_CASE_JSON_FIELDS, LEAD_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";
import { emptyLegalIntake } from "@/lib/types/legal";
import type { LegalTransactionType } from "@/lib/types/legal";
import type { QualificationAnswer, StrategyLane } from "@/lib/types/leadgen";
import { routeStrategy } from "@/lib/leadgen/strategyRouter";
import { computeLeadPriority } from "@/lib/leadgen/leadPriority";
import { computeLegalCase } from "@/lib/legal/computeLegalCase";
import { resolveJurisdiction } from "@/lib/legal/jurisdiction";

const LANE_TO_TRANSACTION_TYPE: Record<StrategyLane, LegalTransactionType> = {
  CASH_BRRRR: "CASH_PURCHASE",
  TRADITIONAL_PURCHASE: "CASH_PURCHASE",
  WHOLETAIL: "CASH_PURCHASE",
  WHOLESALE: "WHOLESALE",
  SELLER_FINANCE: "SELLER_FINANCE",
  SUBJECT_TO: "SUBJECT_TO",
  HYBRID: "HYBRID",
  LEASE_OPTION: "LEASE_OPTION",
  FOLLOW_UP: "OTHER",
  PASS: "OTHER",
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deal = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const legalCase = await prisma.legalCase.findUnique({ where: { dealId: deal.id } });
  if (!legalCase) return NextResponse.json({ error: "No legal case for this deal yet" }, { status: 404 });

  return NextResponse.json(deserializeJsonFields(legalCase, LEGAL_CASE_JSON_FIELDS));
}

/**
 * Creates a legal case for a deal, seeding transactionType from the strategy router's
 * recommendation on the originating lead (spec: "Connection to 10 Magic Questions -- do not
 * ask the seller twice"), or CASH_PURCHASE if there's no lead or no clear recommendation yet.
 * Idempotent -- if a case already exists for this deal, returns it unchanged.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deal = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.legalCase.findUnique({ where: { dealId: deal.id } });
  if (existing) return NextResponse.json(deserializeJsonFields(existing, LEGAL_CASE_JSON_FIELDS));

  const leadRaw = await prisma.lead.findFirst({ where: { dealId: deal.id, userId } });
  let transactionType: LegalTransactionType = "CASH_PURCHASE";
  if (leadRaw) {
    const lead = deserializeJsonFields(leadRaw, LEAD_JSON_FIELDS);
    const qualification = (lead.qualification as unknown as QualificationAnswer[] | null) ?? [];
    const priority = computeLeadPriority(qualification);
    const routed = routeStrategy(qualification, priority);
    const firstActionable = routed.recommended.find((lane) => lane !== "FOLLOW_UP" && lane !== "PASS");
    if (firstActionable) transactionType = LANE_TO_TRANSACTION_TYPE[firstActionable];
  }

  const jurisdictionFacts = resolveJurisdiction(deal.address);
  const jurisdiction = await prisma.jurisdiction.upsert({
    where: {
      state_county_municipality: {
        state: jurisdictionFacts.state,
        county: jurisdictionFacts.county,
        municipality: jurisdictionFacts.municipality,
      },
    },
    update: {},
    create: {
      state: jurisdictionFacts.state,
      county: jurisdictionFacts.county,
      municipality: jurisdictionFacts.municipality,
    },
  });

  const intake = emptyLegalIntake();
  const computed = computeLegalCase(intake, transactionType);

  const data = serializeJsonFields(
    {
      userId,
      dealId: deal.id,
      leadId: leadRaw?.id ?? null,
      jurisdictionId: jurisdiction.id,
      transactionType,
      intake,
      triggerResult: computed.triggerResult,
      requiredDocuments: computed.requiredDocuments,
      attorneySummary: computed.attorneySummary,
      status: computed.status,
    },
    LEGAL_CASE_JSON_FIELDS
  );

  const legalCase = await prisma.legalCase.create({ data: data as any });
  return NextResponse.json(deserializeJsonFields(legalCase, LEGAL_CASE_JSON_FIELDS));
}
