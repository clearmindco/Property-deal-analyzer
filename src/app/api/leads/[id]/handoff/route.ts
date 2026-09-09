import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { DEAL_JSON_FIELDS, LEAD_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";
import type { QualificationAnswer } from "@/lib/types/leadgen";
import { defaultDealKillers, defaultFinancing, defaultRehab, defaultRent, defaultRequirements, defaultValueArv } from "@/lib/dealDefaults";
import type { PropertyDetails } from "@/lib/types/deal";

function parseMoney(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function answerFor(qualification: QualificationAnswer[], key: string): string | undefined {
  return qualification.find((q) => q.key === key && q.confirmed)?.value;
}

/**
 * "CREATE DEAL ANALYSIS" handoff (spec): transfers what a seller has told us into the
 * underwriting system as ASSUMPTION/NEEDS_VERIFICATION facts -- nothing here is treated as
 * verified just because the seller said it.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leadRaw = await prisma.lead.findFirst({ where: { id: params.id, userId } });
  if (!leadRaw) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const lead = deserializeJsonFields(leadRaw, LEAD_JSON_FIELDS);
  const qualification = (lead.qualification as unknown as QualificationAnswer[] | null) ?? [];

  const askingPrice = parseMoney(answerFor(qualification, "askingPrice"));
  const currentRent = parseMoney(answerFor(qualification, "currentRent"));
  const taxes = parseMoney(answerFor(qualification, "taxes"));
  const occupancyRaw = answerFor(qualification, "occupancy");
  const propertyType = answerFor(qualification, "propertyType");
  const condition = answerFor(qualification, "condition");

  const property: PropertyDetails = {};
  if (occupancyRaw) {
    const vacant = /vacant|empty/i.test(occupancyRaw);
    property.occupancyAtClosing = {
      value: vacant ? "VACANT" : "OCCUPIED",
      provenance: { status: "NEEDS_VERIFICATION", source: "Seller-reported (lead-gen)", note: occupancyRaw },
    };
  }
  if (taxes) {
    property.annualTaxes = { value: taxes, provenance: { status: "NEEDS_VERIFICATION", source: "Seller-reported (lead-gen)" } };
  }

  const financing = defaultFinancing();
  const rent = defaultRent();
  if (currentRent) {
    rent.market.likelyRent = { value: currentRent, provenance: { status: "NEEDS_VERIFICATION", source: "Seller-reported current rent" } };
  }

  const dealData = serializeJsonFields(
    {
      userId,
      address: lead.address || lead.sellerName,
      askingPrice,
      propertyType: propertyType ?? undefined,
      stage: "ANALYZING",
      property,
      seller: {
        sellerName: lead.sellerName,
        reasonForSelling: answerFor(qualification, "sellerReason"),
        timeline: answerFor(qualification, "timeline"),
        condition,
        mortgageBalance: answerFor(qualification, "mortgageBalance"),
        interestRate: answerFor(qualification, "interestRate"),
        monthlyPayment: answerFor(qualification, "monthlyPayment"),
        liensDebts: answerFor(qualification, "liensDebts"),
        cashNeeded: answerFor(qualification, "cashNeeded"),
        openToTerms: answerFor(qualification, "openToTerms"),
        leadId: lead.id,
      },
      valueArv: defaultValueArv(),
      rehab: defaultRehab(),
      rent,
      financing,
      assumptions: defaultRequirements(),
      dealKillers: defaultDealKillers(),
    },
    DEAL_JSON_FIELDS
  );

  const deal = await prisma.deal.create({ data: dealData as any });
  await prisma.lead.update({ where: { id: lead.id }, data: { dealId: deal.id, status: "ANALYZING" } });

  return NextResponse.json({ dealId: deal.id });
}
