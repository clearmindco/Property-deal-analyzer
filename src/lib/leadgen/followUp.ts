/** Drafts a follow-up message for the user to review and approve before sending (spec:
 * "User must approve messages before sending" -- this never sends anything itself). */
export function draftFollowUpMessage(
  sellerName: string,
  address: string | undefined,
  nextBestQuestion: string | undefined
): string {
  const firstName = sellerName.split(" ")[0] || sellerName;
  const place = address ? ` about the property on ${address}` : "";
  if (!nextBestQuestion || nextBestQuestion.startsWith("Nothing left")) {
    return `Hey ${firstName}, just wanted to circle back${place}. Any updates on your end, or anything I can help with?`;
  }
  return `Hey ${firstName}, just wanted to circle back${place}. ${nextBestQuestion}`;
}
