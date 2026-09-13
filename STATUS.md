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

## Smart Contract Builder -- New York creative-finance legal workflow (new)

Smallest safe vertical slice of the spec's legal module, built without touching any existing
calc engine, screen, or data model: Seller Lead -> Deal -> Transaction Type -> Legal Intake ->
Risk Gate -> Required Document Checklist -> Attorney Intake Summary. Generic architecture
(`Jurisdiction`, `LegalRule`/`LegalSource`, `LegalCase`, `DocumentTemplate`/`TemplateVersion`,
`GeneratedDocument`, `ComplianceEvent`) so later phases (template registry, document assembly,
subject-to/seller-finance/hybrid packages, servicing, local jurisdiction modules) can be added
without rewriting the trigger logic.

- **Non-negotiable architecture**: "AI explains. Data supports. Math decides. Human approves.
  Attorney-approved language stays locked." No engine invents statutory text, claims a document
  is airtight, or guarantees enforceability -- every template and generated document carries an
  explicit `AttorneyReviewStatus`, and every summary/gate message carries a plain disclaimer.
- **Jurisdiction engine** (`src/lib/legal/jurisdiction.ts`) -- resolves Rochester/Monroe,
  Buffalo/Erie, Syracuse/Onondaga by name; generic NY fallback for anything else. Initial
  jurisdiction is New York State only, per spec.
- **New York distressed-property red gate** (`src/lib/legal/riskGate.ts`, unit-tested) -- shaped
  after RPL Article 12-B / the Home Equity Theft Prevention Act (RPL 265-a): fires only on the
  spec's own fact pattern (owner-occupied 1-4 family + one of foreclosure / notice of default /
  notice of pendency / tax-or-utility lien sale / prior foreclosure reconveyance / seller-retained
  possession). An unanswered distress question keeps the case in an incomplete-intake state
  rather than silently clearing the gate. Never restates statutory text or claims compliance.
  When triggered, standard contract generation is blocked and the checklist collapses to
  attorney-drafted documents only.
- **Required document checklist** (`src/lib/legal/documentRequirements.ts`, unit-tested) --
  varies by transaction type (cash / seller finance / subject-to / hybrid) and property facts
  (e.g. property condition disclosure for owner-occupied 1-4 family/condo), each item with a
  plain-language reason and an explicit attorney-review flag.
- **Financing verification precedence** (`src/lib/legal/financingVerification.ts`, unit-tested)
  -- a verified monthly payment/loan balance always controls over what the seller reported from
  memory, but the seller-reported value is never discarded -- it stays visible for the audit
  trail.
- **Attorney review versioning + document immutability** (`src/lib/legal/templateVersioning.ts`,
  `src/lib/legal/documentImmutability.ts`, unit-tested) -- editing clause content on a new
  template version can never silently carry forward a prior attorney approval (resets to
  "needs re-review"); an executed (signed) document can never be modified in place.
  9 spec test scenarios covered by name across these engines' unit tests.
- **Attorney intake summary** (`src/lib/legal/attorneySummary.ts`) -- property facts, trigger
  flags, financing summary (with source), required documents, open questions, and a standing
  disclaimer -- built entirely from the deterministic engines above, never from a free-form AI
  narrative.
- **UI** -- new Legal tab on the deal workspace (`src/components/deal/LegalTab.tsx`): start
  workflow, pre-contract legal screen (tri-state Yes/No/Unknown distress questions so "unknown"
  is never conflated with "no"), red-gate banner, required document checklist, attorney intake
  summary.
- **API** -- `POST/GET /api/deals/[id]/legal-case` (idempotent create, seeds transaction type
  from the lead's strategy-router recommendation so the seller is never asked twice) and
  `PATCH /api/legal-cases/[id]` (updates intake/transaction type, recomputes gate + checklist +
  summary together through one `computeLegalCase` pipeline so they can't drift apart; logs a
  `ComplianceEvent` the moment a case newly trips the red gate).
- **AI Mentor** -- surfaces any case on the red gate as the top-priority action, and flags
  creative-finance deals with an unfinished legal screen.

Live-tested against the production build: triggering "owner-occupied + notice of default"
correctly raises the red gate, collapses the document checklist to attorney-only documents, and
is surfaced by the AI Mentor as the top action -- all confirmed via screenshot.

## Guided first-deal journey (new)

A beginner-friendliness pass tying every module above into one visible spine, built entirely
from data that already exists (no new required input, no separate "mark done" button that can
drift from reality):

- **Onboarding progress engine** (`src/lib/onboarding/computeOnboardingProgress.ts`,
  unit-tested) -- 7 ordered steps (save a market/group, post, qualify a lead, get a deal into
  the analyzer, run the numbers, see the Decision, optionally start the legal workflow), each
  computed from real counts, never a stored flag. A user who skips lead-gen and creates a deal
  directly still progresses correctly.
- **`/getting-started` page** -- the full checklist with a progress bar, "Do this next"
  highlighting, and a direct link into the right existing screen for every step.
- **Dashboard banner** -- "New here? Start with your first deal," shown only while required
  steps remain, naming the next step and linking to the walkthrough.

## Creative-finance analyzer (new -- closes item 18 below)

Real cash-flow/ROI modeling for subject-to, seller-finance, and hybrid structures, side by side
with the existing Cash/BRRRR plan -- the biggest functional gap between the legal/seller-
conversation modules and the underwriting math:

- **`src/lib/calc/creativeFinance.ts`** (unit-tested) -- `analyzeSubjectTo`/`analyzeSellerFinance`/
  `analyzeHybrid` each produce monthly debt service, cash flow (reusing the existing
  `calculateCashFlow` engine), cash-to-close, cash-on-cash return (`null`, not a fake number,
  when cash-to-close is near zero), equity captured at close, and explicit risk flags --
  due-on-sale risk is always shown for any structure that keeps an existing loan in place, and
  balloon risk only when a balloon is actually set. Never claims a structure is "safe" or
  estimates the odds a lender calls a loan due.
- **Exit-strategy suggestion** -- deterministic, transparent-reasons pick of the cash-flow-
  positive scenario needing the least cash to close among what's been entered; explicitly says
  "no modeled structure cash flows yet" rather than forcing a recommendation.
- **New "Creative Finance" tab** on the Deal Workspace, between Financing and Decision.

## Legal document assembly (new -- extends the Smart Contract Builder)

Extends the vertical slice past the checklist into an actual (placeholder, attorney-gated)
document-generation step, per the module's own stated build order:

- **Template Registry** (`src/lib/legal/templateRegistry.ts`) -- a static catalog of document
  *shapes*, not legal content. Every body is a generic, jurisdiction-agnostic worksheet framed
  explicitly as "PLACEHOLDER -- NOT A CONTRACT -- DO NOT SIGN," listing the deal facts an
  attorney needs rather than anything phrased as usable contract language. Distressed-property
  documents are permanently excluded from the registry -- that fact pattern always needs
  attorney-drafted documents from scratch.
- **Document assembly** (`src/lib/legal/documentAssembly.ts`, unit-tested) -- builds a field
  snapshot from the deal and legal intake (reusing the same verified-vs-seller-reported
  financing precedence as the attorney summary), then substitutes it into a template; an unknown
  token renders as an explicit `[MISSING: x]` marker rather than a blank or a guess.
  Templates and their first version are created lazily on first use
  (`src/lib/legal/ensureTemplateVersion.ts`), so the static registry stays the single source of
  truth for content.
- **API** -- `GET/POST /api/legal-cases/[id]/documents` (list with assembled body / generate
  drafts for every required doc that doesn't have one yet -- refuses outright with a 409 while
  the case is on the red gate) and `PATCH /api/generated-documents/[id]` (status transitions,
  blocked once EXECUTED or VOID via the existing `canModifyGeneratedDocument`).
- **UI** -- a "Draft documents" panel on the Legal tab: generate, expand to read the assembled
  placeholder text, and move a document through DRAFT -> UNDER REVIEW -> APPROVED -> EXECUTED
  (or VOID), with generation itself disabled and clearly explained the moment a case is gated.

Live-tested against the production build: generated all 5 applicable draft worksheets for the
demo deal, confirmed the assembled body renders deal facts correctly with the full placeholder
disclaimer, then triggered the red gate on that same case and confirmed the "Generate draft
documents" button disappears with an explanation, while previously generated drafts remain
visible untouched.

## Education Center + "why this matters" tab framing (new)

Addresses a direct piece of feedback: even with the guided walkthrough, the individual Deal
tabs still read as generic input forms with no explanation of why any of it mattered. Two
changes, both content-only (no schema or engine changes):

- **`/learn` Education Center** (`src/lib/learn/lessons.ts`) -- 8 short lessons grouped into How
  This App Works, Finding & Qualifying Sellers, Understanding the Numbers, Creative Finance,
  Legal & Contracts, and a Rochester Market Playbook. Every lesson documents how *this specific
  app's* own logic works (confidence badges, the acquisition-price engine, the 10 core
  questions, subject-to/seller-finance/hybrid risk, why the legal red gate exists) -- nothing
  here states a market statistic, price, or legal conclusion as fact. The Rochester lesson is
  explicit that the app does not invent local numbers, and instead points to where to get real
  ones (county property/tax records, the city's CO/rental-registration office, local investor
  Facebook groups, a local title company or attorney).
- **`TabIntro` component** -- a one-paragraph "why this matters" card, with a link into the
  matching lesson, added to the top of every previously-bare form tab (Property, Value/ARV,
  Rehab, Rent, Financing, Creative Finance, Legal). Getting Started also links into the
  Education Center.

Rochester (Monroe County), Buffalo (Erie County), and Syracuse (Onondaga County) remain the
supported jurisdictions for now -- a deliberate initial niche for local Facebook-group
promotion, not a ceiling; the jurisdiction engine already falls back generically for any other
NY address, so opening up additional markets later is a content decision, not an engineering one.

## Acquisition OS Phase 1 -- unified Contacts + Deal source/pipeline (new)

First phase of the "Master Build Prompt" real-estate acquisition OS: turning this from a deal
calculator into a system that remembers relationships and routes deals by source type. Built as
an extension of the existing data model, not a replacement -- every existing screen (Lead Gen,
the 10 Magic Questions, the Legal module) keeps working exactly as before.

- **Unified Contact model** (`src/lib/types/contact.ts`) -- one person, multiple roles (Direct
  Seller, Realtor/Agent, Wholesaler/Deal Source, Investor, Referral, Lender, Contractor,
  Property Manager, Attorney, Unknown) stored as a role array, never a single bucket. The
  contractor-only Team page is now the **Contacts** CRM (`/contacts`): add a contact with any
  combination of roles, and only show the contractor trade/rating fields when the Contractor
  role is selected. A contact detail page (`/contacts/[id]`) shows every property linked to
  that person via `Deal.sourceContactId` -- the exact "one wholesaler, several properties,
  never duplicated" case from the spec's own example.
- **Deal extended into the Property/Opportunity record** (`prisma/schema.prisma`) -- rather than
  building a second, competing `Property` table, `Deal` (which already carries address,
  condition, ARV, rehab, rent, financing, documents) gained `sourceContactId`/`sourceType`,
  wholesaler `contractPrice`/`assignmentFee`, and follow-up ownership fields
  (`nextAction`/`nextActionOwner`/`nextContactMethod`/`followUpCadence`), plus a widened
  `stage` pipeline (`DEAL_STAGES` in `src/lib/types/deal.ts`) covering the full acquisition
  lifecycle from New Lead through Closed. All additive and nullable -- every deal created
  before this change keeps working unchanged.
- **Wholesaler math** (`src/lib/calc/acquisitionTotal.ts`, unit-tested) --
  `resolveTotalAcquisitionPrice(contractPrice, assignmentFee)` always returns the sum, shown as
  three separate numbers on the Deal Overview tab's new "Source & pipeline" card -- the
  assignment fee is never folded into or hidden behind a single blended price.
- **Deal Overview "Source & pipeline" card** -- deal stage, source contact (pulled from the
  Contacts CRM), source type, the wholesaler fields when relevant, and the four follow-up
  fields, all on the tab that already anchors the rest of the deal record.

Live-tested against the production build: created a contact with both Wholesaler and Investor
roles, set a deal's source to Wholesaler with a $54,000 contract price and $1,500 assignment
fee, confirmed the $55,500 total displays live and survives a save + page reload.

## Not yet built (next in sequence)

- **Acquisition OS phases 2+** (per the Master Build Prompt's own priority order) -- lead
  routing that actually branches the UI by contact role (Direct Seller vs. Realtor vs.
  Wholesaler intake screens), the source-claim/verified/underwritten/actual quad-field display
  for ARV and rent (today's confidence-badge system covers the same intent with one tagged
  value per field rather than four parallel numbers), the Deal Source Scorecard, the unified
  Follow-Up Command Center dashboard view ("who needs a response today" across every deal), the
  Property Comparison Engine, and the expanded Documents/Due-Diligence checklist beyond the
  Legal module's existing one. The data model above (source linkage, wholesaler fields, the
  long stage pipeline, follow-up ownership) is the foundation all of these build on.
- **20. Actual-vs-estimate learning loop** -- Scope-of-Work / contractor bidding, and
  post-acquisition tracking of estimate vs. actual (rehab, rent, ARV, timeline).
- ARV comparable-sales *matching logic* is manual today (user picks STRONG/MODERATE/WEAK/
  EXCLUDED and types a reason) rather than computed from listing data -- no licensed
  MLS/property-data API is wired in, per the spec's instruction not to fake one.
- **Legal module phases beyond document assembly** -- Attorney Review Versioning UI (there is
  no screen yet to edit a template's clauses or record a real attorney's approval -- the
  versioning engine exists and is tested), Subject-To / Seller-Finance / Hybrid document
  *packages* (bundling several documents together with package-level status), Servicing
  Workflow, Local Jurisdiction Modules beyond Rochester/Buffalo/Syracuse name-matching.
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
