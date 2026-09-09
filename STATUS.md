# Build status

Repository was empty at the start of this pass -- everything below is new. Tracks against
the 50-section product spec's build order (section 49).

## Built and working (verified: typecheck, lint, unit tests, production build, and a live
login + seeded-deal smoke test all pass)

1. **Auth** -- NextAuth credentials provider, register/login pages, `middleware.ts` route
   protection, every data model scoped by `userId` (multi-tenant from the start).
2. **Dashboard** -- deal/lead/lender counts, recent deals list.
3. **Create Deal** -- address, asking price, property type, units/beds/baths/sqft.
4. **Deal database** -- Prisma `Deal` model with typed JSON blobs for property condition,
   seller info, value/ARV, rehab, rent, financing, creative-finance, investor requirements,
   and deal-killer flags (see `src/lib/types/deal.ts`). Full CRUD via `/api/deals`.
5. **Property inputs** -- condition fields (roof/furnace/water heater/panel age, taxes,
   occupancy, CO, sewer) each with a confidence/provenance badge (VERIFIED / ASSUMPTION /
   NEEDS INSPECTION / etc., spec section 7), plus voice-to-text with AI-suggested structured
   fields that require explicit confirmation before becoming data (spec section 5).
6. **Financial assumptions** -- hard-money terms, refinance terms, operating-expense
   assumptions, hold period, all editable per deal.
7. **BRRRR calculation engine** (`src/lib/calc/*`, unit-tested) -- mortgage P&I, LTV/LTC,
   DSCR, NOI, cap rate, cash-on-cash, hard-money loan sizing (with LTC/ARV-LTV caps, points,
   fees, draw-interest averaging), refinance proceeds + appraisal sensitivity, cash flow with
   full expense breakdown.
8. **Acquisition price engine** (`src/lib/calc/acquisitionPrice.ts`) -- solves backward from
   investor requirements (min cash flow/door, max cash left after refi, min equity created)
   to Target Offer / Ideal Acquisition / Maximum Acquisition, via bisection over purchase
   price. Never a flat "70% rule."
9. **Decision screen** -- STRONG FIT / NEEDS WORK / DOESN'T FIT (never "buy this"), with
   plain-language reasoning and a "your next move" list; automatic stress test (rehab +20%,
   ARV -10%, rent -10%, refi rate +1%, hold +3mo, and combined) classified SURVIVES / TIGHT /
   FAILS.
10. **Lender database** -- full CRUD, direct-verified-quote vs. advertised-terms flag.
11. **Lender comparison** -- runs one deal through every saved lender, ranks by total
    financing cost (not just rate), prefers a verified quote when costs are close, flags a
    lender whose minimum loan isn't met.
12. **Seller leads (CRM-lite)** -- pipeline with the spec's status set, voice notes.
13. **AI deal summary** -- what we know / what looks good / what concerns us / what could
    kill the deal / next steps, built from the calc engine's own numbers by a deterministic
    heuristic provider (`src/lib/ai/heuristicProvider.ts`) so it needs no external AI key.
14. **AI Mentor** (`/mentor`) -- deterministic, rule-based "what to do today" derived from the
    deal/lead pipeline (e.g. too many analyzed deals vs. too few active leads, open STOP flags).
15. **Voice input** -- Web Speech API, no external key, used on Property notes and Leads notes.
16. **Rehab** -- line-item estimator (low/expected/high) across the spec's category list,
    "needs inspection" flag for hidden systems, configurable 10-20% contingency.
17. **Rent** -- market rent (conservative/likely/upper) with comparables; Section 8 fields
    present with an explicit note that payment-standard tables aren't loaded yet for any ZIP.
19. **Team database** -- contractor/vendor CRUD with PREFERRED/BACKUP/DO NOT USE.

Also: light/dark design tokens per spec section 39, Simple/Pro terminology toggle that never
changes a calculation (section 2), deal-killers panel with STOP flags (section 8), auditable
number breakdowns in the Financing tab (section 44), demo BRRRR deal seeded and clearly
labeled DEMO/EDUCATIONAL DATA (section 38).

## Facebook / community inbound seller lead generation module (new)

Full vertical slice of the spec's Facebook inbound lead-gen system, built human-approval-first
-- this app never posts, messages, or scrapes anything on a platform automatically:

- **Markets -> Groups** (`/leadgen/markets`) -- each market (e.g. "Rochester, NY") holds its own
  saved-group database with the spec's fields (type, priority HIGH_PRIORITY/TEST/LOW_PRIORITY/
  STOP_USING, posting rules, promotion/RE-allowed flags, dates).
- **Quick Post workflow** (`/leadgen/groups/[id]`) -- deterministic template generator
  (`src/lib/leadgen/postGenerator.ts`) with post-type variants (Tired Landlord, Fixer-Upper,
  Referral, etc.), natural phrasing for general groups vs. investor phrasing only for
  investor-type groups, and rotation (never repeats a variant already used in that group).
  Copy Post / Open Group / Mark as Posted / Generate Another / Skip Today, then "Did anyone
  respond?" (None/Comment/DM/Seller Lead) -- choosing Seller Lead creates a CRM lead and drops
  the user straight into qualifying it.
- **Group performance** (`src/lib/leadgen/groupPerformance.ts`, unit-tested) -- conversion
  rates (response/lead/qualified/offer/contract rate) and a plain recommendation (KEEP
  POSTING / KEEP TESTING / REVIEW APPROACH / STOP USING / NOT ENOUGH DATA) from actual results,
  never from group size.
- **Seller qualification + response assistant** (`/leads/[id]`) -- progress bar ("X of 16
  answered"), one next-best-question at a time, paste-or-voice seller-message analysis
  (`AiProvider.analyzeSellerMessage`) that extracts candidate answers for confirmation and
  drafts one reply -- never a list of ten questions.
- **Transparent lead priority** (`src/lib/leadgen/leadPriority.ts`, unit-tested) -- STRONG/
  MODERATE/UNCLEAR with the exact observable reasons shown (vacant, short timeline, mortgage
  info provided, etc.) -- no hidden AI score, matching the spec's worked example.
- **Deal handoff** (`POST /api/leads/[id]/handoff`) -- transfers what the seller said into a
  new Deal as NEEDS_VERIFICATION facts, never as verified data.
- **Follow-up engine** -- last-contact/next-follow-up dates, a drafted follow-up message the
  user must copy and send themselves (nothing here sends anything).
- **AI Mentor integration** -- now also flags days since any group was posted in, a
  lead-generation-vs-calling-back bottleneck, per-group "stop using" calls, and the single
  most overdue follow-up.

## Seller Conversation Engine -- "10 Magic Questions" system (new)

Rebuilds seller qualification around the spec's exact 10 core questions (previously a flat
16-field list), and adds the objection assistant, strategy router, and terms-verification
gate on top of it:

- **10 core questions** (`src/lib/types/leadgen.ts` -> `CORE_QUESTIONS`, `src/lib/leadgen/
  coreQuestions.ts`) -- each question maps to one or more underlying facts, so a seller who
  volunteers information out of order (spec's worked example) is never asked for it twice.
  Progress shown as "X of 10 core questions answered," not a raw field count. Question 9
  (payment + interest rate) is explicitly labeled as our own underwriting addition, not part
  of the source framework, per the spec's source-labeling requirement.
- **Next Best Question card** -- one question at a time, with Copy Question / Edit / Mark
  Answered / Skip / Seller Doesn't Know, exactly per spec. Skipped questions persist
  (`Lead.skippedQuestions`) and are excluded from rotation until revisited.
- **Seller response assistant** -- "Here's what I heard" now lets you edit an extracted
  value inline before confirming (not just accept/reject), and "next best question" always
  resolves to one of the 10 scripted questions, never a granular field prompt.
- **Objection assistant** (`src/lib/leadgen/objections.ts`, unit-tested) -- all 8 scripted
  objection responses from the spec (cash-only, not-interested-in-terms, wants-asking-price,
  why-payments, taking-over-mortgage, what-if-you-stop-paying, needs-to-consult,
  just-make-an-offer), matched from pasted text or picked manually. Tested to never let the
  subject-to script promise "the bank won't care" or claim "there's no risk."
- **Strategy router** (`src/lib/leadgen/strategyRouter.ts`, unit-tested) -- routes to one or
  more of the 10 lanes (Cash/BRRRR, Seller Finance, Subject-To, Hybrid, Lease Option,
  Wholesale, Wholetail, Traditional, Follow-Up, Pass) from the seller's actual answers.
  Never recommends a terms-based lane when the seller said cash-only; PASS is always a valid
  output, never forced into a structure to avoid losing a lead.
- **Terms verification gate** -- the moment a seller responds OPEN_TO_TERMS or MAYBE, a
  "POTENTIAL CREATIVE-FINANCE OPPORTUNITY -- DO NOT SIGN YET" card appears with the full
  verification checklist (mortgage statement, title, insurance, attorney/title review, etc.),
  persisted per lead, nothing pre-checked.
- **Resume context** -- reopening a lead (or the AI Mentor's follow-up nudge) states which
  topics are already known ("property overview, motivation, mortgage balance...") so
  qualification is never restarted from scratch.

## Not yet built (next in sequence)

- **18. Creative-finance analyzer** -- seller-financing / subject-to modeling, risk warnings,
  exit-strategy engine. `creativeFinance` JSON field and DB model exist; no UI yet.
- **20. Actual-vs-estimate learning loop** -- Scope-of-Work / contractor bidding, and
  post-acquisition tracking of estimate vs. actual (rehab, rent, ARV, timeline).
- ARV comparable-sales *matching logic* is manual today (user picks STRONG/MODERATE/WEAK/
  EXCLUDED and types a reason) rather than computed from listing data -- no licensed
  MLS/property-data API is wired in, per the spec's instruction not to fake one.
- Section 8 payment-standard tables are a placeholder (not yet loaded/versioned per ZIP).
- Lender contact center (email integration, sent/response tracking) is not built --
  `email`/`phone`/`website` fields exist on the Lender record but there's no send flow.
- CSV/XLSX import/export for lenders.
- Rent-to-own analyzer, appraisal-sensitivity UI (the calc function
  `appraisalSensitivity()` exists and is tested; no screen surfaces it yet).

## One real bug caught and fixed during this pass

The hard-money `points` field (e.g. `2` meaning "2 points" = 2% of the loan) was being
multiplied directly into the loan amount instead of divided by 100 first, inflating points
cost 100x. Caught by a stress-test unit test whose result didn't match economic intuition;
fixed in `src/lib/calc/hardMoney.ts` and the test that had encoded the same bug.
