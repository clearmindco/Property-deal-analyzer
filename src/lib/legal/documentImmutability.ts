import type { GeneratedDocumentStatus } from "@/lib/types/legal";

// Once a document is executed (signed), it is a historical record, not a draft -- it must
// never be edited or regenerated in place. Any correction after execution requires a new,
// separately tracked document (an amendment/addendum), not a silent overwrite.

export function canModifyGeneratedDocument(status: GeneratedDocumentStatus): boolean {
  return status !== "EXECUTED" && status !== "VOID";
}
