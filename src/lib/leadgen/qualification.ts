import type { QualificationAnswer, QualificationKey } from "@/lib/types/leadgen";

/** Only ever reads CONFIRMED answers -- an unconfirmed AI suggestion is not a fact yet. */
export function answerFor(qualification: QualificationAnswer[], key: QualificationKey): string | undefined {
  const a = qualification.find((q) => q.key === key && q.confirmed);
  const v = a?.value?.trim();
  return v && v.length > 0 ? v : undefined;
}

export function parseMoneyString(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : undefined;
}
