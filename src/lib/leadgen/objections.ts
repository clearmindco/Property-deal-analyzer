import type { ObjectionEntry } from "@/lib/types/leadgen";

/**
 * Scripted objection responses (spec: "Seller Conversation Engine -- Objection Assistant").
 * Deterministic, not AI-generated -- the whole point is these never drift from the reviewed
 * wording, especially the subject-to ones, which deliberately never promise "the bank won't
 * care" or "there's no risk."
 */
export const OBJECTIONS: Array<ObjectionEntry & { matcher: RegExp }> = [
  {
    key: "needs_all_cash",
    label: "\"I need all my money at closing.\"",
    objectionExample: "I need all my money at closing.",
    suggestedResponse: "Absolutely. Is there a specific amount you need immediately, or do you mean you need the entire sale price paid off at closing?",
    purpose: "Determine whether the seller truly needs everything now, or needs a specific amount now and may have flexibility with the remainder. If truly cash-only, route to Cash/BRRRR, Traditional Financing, Wholesale/Wholetail, Follow-Up, or Pass -- and stop pressuring terms.",
    matcher: /need(?:s)?\s+(?:all|100\s*%|every(?:thing)?)\s*(?:of\s+)?(?:my\s+)?money|all\s+(?:my\s+)?cash\s+at\s+closing|need\s+it\s+all\s+(?:now|upfront)/i,
  },
  {
    key: "not_interested_in_terms",
    label: "\"I'm not interested in owner financing/payments.\"",
    objectionExample: "I'm not interested in owner financing/payments.",
    suggestedResponse: "No problem. I don't want to force something that doesn't work for you. Is the main concern waiting for your money, or is there something else about payments you don't like?",
    purpose: "Understand the actual concern rather than arguing with the no. If the seller remains cash-only, respect it and analyze cash strategies.",
    matcher: /not\s+interested\s+in\s+(?:owner\s+financing|payments|terms|financing)|don'?t\s+(?:want|like)\s+(?:owner\s+financing|payments)/i,
  },
  {
    key: "wants_asking_price",
    label: "\"I want my asking price.\"",
    objectionExample: "I want my asking price.",
    suggestedResponse: "If we could make the price work, would you have any flexibility in how and when you receive the money?",
    purpose: "Explore price vs. terms -- they're connected, and a higher price can sometimes work when financing terms are favorable. Never accept a high price merely because creative financing exists; run the numbers.",
    matcher: /want(?:s)?\s+my\s+(?:full\s+|asking\s+)?price|need(?:s)?\s+my\s+(?:full\s+)?price|has\s+to\s+get\s+my\s+price/i,
  },
  {
    key: "why_payments",
    label: "\"Why would I let someone make payments?\"",
    objectionExample: "Why would I let someone make payments?",
    suggestedResponse: "That's fair. Before we even talk about that, what matters most to you in the sale -- getting a certain amount immediately, getting rid of the monthly payment, timing, or getting your price?",
    purpose: "Return to seller need. Never pitch a structure before understanding the actual problem it would solve.",
    matcher: /why\s+would\s+(?:i|you)\s+(?:let|allow).*payments|why\s+(?:should|would)\s+i\s+do\s+payments/i,
  },
  {
    key: "taking_over_mortgage",
    label: "\"Are you taking over my mortgage?\"",
    objectionExample: "Are you taking over my mortgage?",
    suggestedResponse: "There are different ways a purchase can be structured. I wouldn't want to describe one as appropriate until we verify the loan and have the transaction reviewed properly.",
    purpose: "Never promise \"the bank won't care,\" claim \"there's no risk,\" or claim a land trust fixes due-on-sale exposure. A potential subject-to transaction requires review of the loan documents, due-on-sale exposure, title, insurance, disclosure, servicing, state law, and seller risk.",
    matcher: /taking\s+over\s+my\s+mortgage|assum(?:e|ing)\s+my\s+mortgage|take\s+over\s+the\s+(?:loan|mortgage)/i,
  },
  {
    key: "what_if_stop_paying",
    label: "\"What happens if you stop making the payment?\"",
    objectionExample: "What happens if you stop making the payment?",
    suggestedResponse: "That's an important question, and you should understand the protections and risks before agreeing to anything. If we got that far, I would want the structure documented and reviewed by the appropriate real-estate attorney rather than asking you to rely on my word.",
    purpose: "Never minimize seller risk on this question.",
    matcher: /what\s+happens\s+if\s+you\s+stop\s+(?:paying|making)|what\s+if\s+you\s+(?:stop|default)/i,
  },
  {
    key: "needs_to_consult",
    label: "\"I need to talk to my spouse / attorney / family.\"",
    objectionExample: "I need to talk to my spouse / attorney / family.",
    suggestedResponse: "Of course. You should. What information would be helpful for you to have when you talk with them?",
    purpose: "Never manufacture urgency or discourage independent professional or family advice.",
    matcher: /talk\s+to\s+my\s+(?:spouse|husband|wife|attorney|lawyer|family|accountant)/i,
  },
  {
    key: "just_make_offer",
    label: "\"Just make me an offer.\"",
    objectionExample: "Just make me an offer.",
    suggestedResponse: "I can, but I don't want to throw out a number that doesn't fit what you actually need. Let me understand a couple more things first so I can see what options make sense.",
    purpose: "Collect only the remaining information necessary to analyze the opportunity before naming a number.",
    matcher: /just\s+make\s+(?:me\s+)?an\s+offer|give\s+me\s+a\s+number|what'?s\s+your\s+offer/i,
  },
];

export function listObjections(): ObjectionEntry[] {
  return OBJECTIONS.map(({ matcher, ...rest }) => rest);
}

export function matchObjection(text: string): ObjectionEntry | null {
  const hit = OBJECTIONS.find((o) => o.matcher.test(text));
  if (!hit) return null;
  const { matcher, ...rest } = hit;
  return rest;
}
