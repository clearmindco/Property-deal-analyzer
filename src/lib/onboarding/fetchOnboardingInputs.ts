import { prisma } from "@/lib/prisma";
import { LEAD_JSON_FIELDS, DEAL_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";
import { CORE_QUESTIONS, type QualificationAnswer } from "@/lib/types/leadgen";
import type { ValueArv, Rent } from "@/lib/types/deal";
import type { OnboardingInputs } from "./computeOnboardingProgress";

/** Server-only data gathering for the onboarding spine -- kept separate from
 * computeOnboardingProgress so that function stays a pure, easily-tested unit. */
export async function fetchOnboardingInputs(userId: string): Promise<OnboardingInputs> {
  const [marketCount, groupCount, postedCount, leadsRaw, dealsRaw, legalCasesStartedCount] = await Promise.all([
    prisma.market.count({ where: { userId } }),
    prisma.group.count({ where: { userId } }),
    prisma.post.count({ where: { userId, status: "POSTED" } }),
    prisma.lead.findMany({ where: { userId } }),
    prisma.deal.findMany({ where: { userId } }),
    prisma.legalCase.count({ where: { userId } }),
  ]);

  const leads = leadsRaw.map((l) => deserializeJsonFields(l, LEAD_JSON_FIELDS));
  const qualifiedLeadCount = leads.filter((lead) => {
    const qualification = (lead.qualification as unknown as QualificationAnswer[] | null) ?? [];
    const answeredQuestions = CORE_QUESTIONS.filter((q) =>
      q.fields.some((f) => qualification.some((a) => a.key === f && a.confirmed && a.value.trim()))
    );
    return answeredQuestions.length >= 5;
  }).length;

  const deals = dealsRaw.map((d) => deserializeJsonFields(d, DEAL_JSON_FIELDS));
  const dealsWithNumbersCount = deals.filter((d) => {
    const valueArv = d.valueArv as unknown as ValueArv | null;
    const rent = d.rent as unknown as Rent | null;
    const arv = valueArv?.brrrUnderwritingArv?.value ?? valueArv?.likelyArv?.value ?? 0;
    const rentAmount = rent?.market?.likelyRent?.value ?? 0;
    return arv > 0 && rentAmount > 0;
  }).length;
  const decisionsReachedCount = dealsRaw.filter((d) => d.askingPrice !== null && d.askingPrice > 0).length;

  return {
    marketCount,
    groupCount,
    postedCount,
    leadCount: leads.length,
    qualifiedLeadCount,
    dealCount: dealsRaw.length,
    dealsWithNumbersCount,
    decisionsReachedCount,
    legalCasesStartedCount,
  };
}
