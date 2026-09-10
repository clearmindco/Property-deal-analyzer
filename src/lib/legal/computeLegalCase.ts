import { evaluateLegalTriggers, requiresCompleteIntake } from "@/lib/legal/riskGate";
import { getRequiredDocuments } from "@/lib/legal/documentRequirements";
import { effectiveFinancingFacts } from "@/lib/legal/financingVerification";
import { buildAttorneySummary } from "@/lib/legal/attorneySummary";
import type { AttorneySummary, DocumentRequirement, LegalCaseStatus, LegalIntake, LegalTransactionType, LegalTriggerResult } from "@/lib/types/legal";

export interface ComputedLegalCase {
  triggerResult: LegalTriggerResult;
  requiredDocuments: DocumentRequirement[];
  attorneySummary: AttorneySummary;
  status: LegalCaseStatus;
}

/** Single place that wires the deterministic legal engines together in the right order --
 * every API route and server component should compute a legal case through this function
 * rather than calling the individual engines directly, so the pipeline order (gate first,
 * then document requirements, then summary) can't drift between call sites. */
export function computeLegalCase(intake: LegalIntake, transactionType: LegalTransactionType): ComputedLegalCase {
  const triggerResult = evaluateLegalTriggers(intake);
  const requiredDocuments = getRequiredDocuments(transactionType, intake, triggerResult);
  const financingFacts = effectiveFinancingFacts(intake);
  const attorneySummary = buildAttorneySummary(intake, transactionType, triggerResult, requiredDocuments, financingFacts);

  let status: LegalCaseStatus;
  if (triggerResult.blocksStandardContractGeneration) {
    status = "RED_GATE_HOLD";
  } else if (requiresCompleteIntake(intake)) {
    status = "DRAFT";
  } else {
    status = "INTAKE_COMPLETE";
  }

  return { triggerResult, requiredDocuments, attorneySummary, status };
}
