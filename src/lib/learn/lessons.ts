// Education Center content. This is static, hand-written documentation of how THIS app actually
// works -- not generic real-estate advice and not a licensed data feed. Every claim here is
// either (a) a description of this app's own deterministic logic, which we can state as fact
// because we built it, or (b) explicitly framed as "go verify this yourself" for anything that
// depends on real-world data we don't have (market prices, statutes, local ordinances). Never
// add a lesson that states a specific market statistic, price, or legal conclusion as fact.

export type LessonCategory =
  | "how-this-app-works"
  | "finding-sellers"
  | "underwriting"
  | "creative-finance"
  | "legal"
  | "rochester-playbook";

export const LESSON_CATEGORY_LABELS: Record<LessonCategory, string> = {
  "how-this-app-works": "How This App Works",
  "finding-sellers": "Finding & Qualifying Sellers",
  underwriting: "Understanding the Numbers",
  "creative-finance": "Creative Finance",
  legal: "Legal & Contracts",
  "rochester-playbook": "Rochester Market Playbook",
};

export interface LessonSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Lesson {
  slug: string;
  category: LessonCategory;
  title: string;
  summary: string;
  readMinutes: number;
  sections: LessonSection[];
  relatedHref?: string;
  relatedLabel?: string;
}

export const LESSONS: Lesson[] = [
  {
    slug: "how-this-app-thinks",
    category: "how-this-app-works",
    title: "How this app thinks",
    summary: "The five rules that explain every screen you'll see -- read this first.",
    readMinutes: 3,
    relatedHref: "/getting-started",
    relatedLabel: "Start the guided walkthrough",
    sections: [
      {
        paragraphs: [
          "Every screen in this app follows the same five rules. Once you know them, nothing here should feel arbitrary -- including the parts that look like plain forms.",
        ],
      },
      {
        heading: "1. Math decides, never a guess",
        paragraphs: [
          "Every calculation -- acquisition price, cash flow, DSCR, stress test, the Decision verdict -- runs through the same plain code every time, for every deal. It never gets more optimistic because a deal looks exciting. If you enter the same numbers twice, you get the same answer twice.",
        ],
      },
      {
        heading: "2. Simple and Pro are the same math, different words",
        paragraphs: [
          "The Simple/Pro toggle in the top bar changes labels and explanations, never numbers. A beginner in Simple mode and an experienced investor in Pro mode looking at the same deal get the identical Target Offer, the identical cash flow, the identical verdict. Switch freely -- it's just a translation layer.",
        ],
      },
      {
        heading: "3. AI explains. AI never decides.",
        paragraphs: [
          "Where you see AI-generated text -- the deal summary's \"what looks good / what concerns us,\" the seller-message analysis, the AI Mentor -- it is describing numbers the calculation engine already produced. It is never the thing deciding whether a deal is good. If you swapped out the AI provider entirely, every number on every screen would stay exactly the same.",
        ],
      },
      {
        heading: "4. Every fact has a confidence level",
        paragraphs: [
          "You'll see small badges like VERIFIED, ASSUMPTION, or NEEDS VERIFICATION next to property and deal facts. This app refuses to treat a seller's guess, a Zillow estimate, or your own assumption as equivalent to something you've actually confirmed. See the \"Reading confidence badges\" lesson for the full list.",
        ],
      },
      {
        heading: "5. The app never tells you to buy",
        paragraphs: [
          "The Decision tab produces STRONG FIT, NEEDS WORK, or DOESN'T FIT -- never \"buy this\" or a percentage score. That's deliberate: the verdict is a structured summary of the numbers you entered, not a recommendation to spend money. You make the call.",
        ],
      },
    ],
  },
  {
    slug: "reading-confidence-badges",
    category: "how-this-app-works",
    title: "Reading confidence badges",
    summary: "What VERIFIED, ASSUMPTION, and NEEDS VERIFICATION actually mean, and why the app makes you look at them.",
    readMinutes: 2,
    sections: [
      {
        paragraphs: [
          "Most calculator apps quietly treat every number you type as equally solid. This one doesn't -- because in real underwriting, the difference between \"I confirmed this with a contractor\" and \"I'm guessing\" is the difference between a good deal and a costly surprise.",
        ],
      },
      {
        heading: "The confidence levels",
        bullets: [
          "VERIFIED -- you've independently confirmed this (inspection, title report, lender quote, mortgage statement).",
          "HIGH_CONFIDENCE / MEDIUM_CONFIDENCE / LOW_CONFIDENCE -- your own estimate, ranked by how sure you are.",
          "ASSUMPTION -- a placeholder or industry-standard default you haven't checked against this specific property.",
          "NEEDS_INSPECTION -- a hidden system (roof, foundation, electrical) you haven't been able to look at yet.",
          "NEEDS_VERIFICATION -- something a seller or lead told you, not yet confirmed independently.",
        ],
      },
      {
        heading: "Why it matters",
        paragraphs: [
          "The AI deal summary and the deal-killer flags both read these badges. A property with three NEEDS_INSPECTION items isn't wrong to analyze -- but the app will keep reminding you those numbers are soft until you tighten them up. When a seller hands off into a deal (from the Lead Gen module), every fact they told you starts as NEEDS_VERIFICATION on purpose, even if it sounds certain.",
        ],
      },
    ],
  },
  {
    slug: "brrrr-explained",
    category: "underwriting",
    title: "BRRRR and the acquisition-price engine",
    summary: "Why this app never uses a flat '70% rule,' and what Target Offer / Ideal Acquisition / Maximum Acquisition actually mean.",
    readMinutes: 4,
    relatedHref: "/deals",
    relatedLabel: "Open a deal's Decision tab",
    sections: [
      {
        paragraphs: [
          "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat -- you buy a property below market value, fix it up, rent it out, then refinance to pull most or all of your cash back out, ready for the next deal.",
        ],
      },
      {
        heading: "Why not just use '70% of ARV minus repairs'?",
        paragraphs: [
          "That rule of thumb ignores your actual financing costs, your actual expenses, and what you personally need out of a deal. This app instead works backward from three things you set on the Decision tab: the minimum monthly cash flow per door you want, the maximum cash you're willing to leave in the property after refinancing, and the minimum equity you want to create. It solves for the purchase price that satisfies all three -- not a generic percentage.",
        ],
      },
      {
        heading: "Target Offer, Ideal Acquisition, Maximum Acquisition",
        bullets: [
          "Target Offer -- what you'd actually offer: comfortably meets your requirements with room to negotiate.",
          "Ideal Acquisition -- the price where refinancing returns essentially all of your cash.",
          "Maximum Acquisition -- the ceiling: above this price, the deal no longer meets your own stated requirements.",
        ],
      },
      {
        heading: "The stress test",
        paragraphs: [
          "Every deal is automatically re-run under harder conditions -- rehab costs 20% more, ARV comes in 10% lower, rent is 10% lower, refi rates are 1% higher, the hold period runs 3 months longer, and all five at once. Each scenario is classified SURVIVES, TIGHT, or FAILS. A deal that only works in the base case is a deal that's one bad surprise away from trouble.",
        ],
      },
    ],
  },
  {
    slug: "finding-sellers-facebook",
    category: "finding-sellers",
    title: "Finding sellers without automation",
    summary: "How the Lead Gen module works, and why this app will never post, message, or scrape anything for you.",
    readMinutes: 3,
    relatedHref: "/leadgen",
    relatedLabel: "Open Lead Gen",
    sections: [
      {
        paragraphs: [
          "This app treats Facebook (and community groups generally) as a place you build real visibility over time -- not a scraping target. Every action in this module requires you to actually click Post, actually copy the message, actually paste it yourself.",
        ],
      },
      {
        heading: "The workflow",
        bullets: [
          "Markets -> Groups: save the city you invest in, then the specific groups you post in, each with its own priority (High Priority, Test, Low Priority, Stop Using).",
          "Quick Post: generate a template-based post (rotated so you're never repeating yourself in the same group), copy it, open the group yourself, and mark it posted.",
          "Track what happened: none, a comment, a DM, or a seller lead -- this is what group performance is actually built from, not guesses.",
        ],
      },
      {
        heading: "Group performance, not group size",
        paragraphs: [
          "A 50,000-member group that never converts is worse than a 2,000-member group with three seller conversations. The app tracks response rate, lead rate, and contract rate per group and will eventually tell you plainly to stop posting somewhere that isn't working -- never based on how big the group looks.",
        ],
      },
    ],
  },
  {
    slug: "ten-magic-questions",
    category: "finding-sellers",
    title: "The 10 Magic Questions",
    summary: "Why seller qualification is 10 flexible questions, not a 16-field intake form.",
    readMinutes: 3,
    relatedHref: "/leads",
    relatedLabel: "Open Leads",
    sections: [
      {
        paragraphs: [
          "A real seller conversation doesn't happen in the order a form would ask it. Someone might tell you about their mortgage balance in the first sentence and not mention their timeline until the end. The 10 core questions track the underlying facts, not the order you collected them in -- so nothing gets asked twice.",
        ],
      },
      {
        heading: "The questions, in the order the app suggests them",
        bullets: [
          "1. Tell me about the property. 2. Why are you selling? 3. How soon? 4. Does it need work? 5. Anything owed besides the mortgage? 6. Are taxes current? 7. Mortgage balance? 8. Asking price? 9. Payment & rate (our own underwriting addition -- not part of the original source framework). 10. Open to receiving payments over time?",
        ],
      },
      {
        heading: "PASS is a successful outcome",
        paragraphs: [
          "The strategy router at the end can recommend Cash/BRRRR, Seller Finance, Subject-To, Hybrid, Lease Option, Wholesale, Wholetail, Traditional Purchase, Follow-Up -- or Pass. Passing on a deal that doesn't work isn't a failure of the conversation. Forcing a structure to avoid \"losing\" a lead is a much more expensive mistake.",
        ],
      },
    ],
  },
  {
    slug: "creative-finance-basics",
    category: "creative-finance",
    title: "Subject-To, Seller Finance, and Hybrid -- in plain English",
    summary: "What each structure actually is, what risk it actually carries, and why this app refuses to call any of them 'safe.'",
    readMinutes: 5,
    relatedHref: "/deals",
    relatedLabel: "Open a deal's Creative Finance tab",
    sections: [
      {
        heading: "Subject-To",
        paragraphs: [
          "You take ownership of the property, but the seller's existing mortgage stays in their name -- you just start making the payments. It can mean little or no cash needed at closing. It also means the loan is still legally the seller's, and most mortgages contain a due-on-sale clause letting the lender demand full repayment when title transfers. This app shows that risk on every subject-to scenario, every time, with no exceptions.",
        ],
      },
      {
        heading: "Seller Finance",
        paragraphs: [
          "The seller acts as the bank: you pay them directly over time under a note, instead of getting a new mortgage. Terms (rate, term, down payment, and whether there's a balloon payment due at some point) are whatever you and the seller agree to. Missing a payment carries the same default risk as any other loan -- and a balloon payment means you must refinance or sell before a hard deadline.",
        ],
      },
      {
        heading: "Hybrid",
        paragraphs: [
          "A combination: the existing loan stays in place (subject-to) and the seller carries a second position for the remaining equity gap. It combines the risks of both structures -- due-on-sale exposure on the first loan, default risk on the seller-carried second.",
        ],
      },
      {
        heading: "Why the cash-on-cash number sometimes says 'n/a'",
        paragraphs: [
          "When you put almost no cash into a deal, dividing your annual cash flow by that tiny number produces a meaningless, inflated percentage. The Creative Finance tab shows \"n/a (little cash invested)\" instead of a fake number in that case -- an honest answer beats an impressive-looking one.",
        ],
      },
    ],
  },
  {
    slug: "why-the-legal-tab-exists",
    category: "legal",
    title: "Why the Legal tab exists (and what it can't do)",
    summary: "The red gate, attorney review statuses, and why every generated document says 'placeholder' on it.",
    readMinutes: 4,
    relatedHref: "/deals",
    relatedLabel: "Open a deal's Legal tab",
    sections: [
      {
        paragraphs: [
          "This app is not a lawyer and does not give legal advice. The Legal tab exists to make sure you never accidentally skip the step where one gets involved -- especially on creative-finance deals, where the seller's protection matters as much as your own.",
        ],
      },
      {
        heading: "The red gate",
        paragraphs: [
          "New York (like many states) puts extra protections around buying a home from someone in specific distress situations -- for example an owner-occupied 1-4 family property where the seller is in foreclosure, has received a notice of default, or would stay in the home after closing. This app recognizes that exact fact pattern from the Pre-Contract Legal Screen and stops -- it will not generate even a placeholder document, and tells you plainly to get an attorney before doing anything else. It never tries to tell you whether the deal is legal; it just refuses to pretend it knows.",
        ],
      },
      {
        heading: "Attorney review status",
        paragraphs: [
          "Every document template carries a status: Draft (not attorney reviewed), Under Attorney Review, Attorney Approved, Attorney Approved With Restrictions, Rejected, or Needs Re-Review. \"Needs Re-Review\" appears automatically the moment anyone edits a previously approved template's content -- an approval can never silently carry over to different words.",
        ],
      },
      {
        heading: "Why generated documents are worksheets, not contracts",
        paragraphs: [
          "The \"Generate draft documents\" button doesn't draft a contract -- it assembles the facts you've already entered (address, price, financing terms) into a plain worksheet, clearly labeled PLACEHOLDER -- NOT A CONTRACT, meant to hand to an attorney so they don't start from zero. It is never something to show a seller or sign.",
        ],
      },
    ],
  },
  {
    slug: "rochester-market-playbook",
    category: "rochester-playbook",
    title: "Rochester Market Playbook",
    summary: "How to point this app at Rochester specifically -- and where to get the real local numbers this app doesn't invent.",
    readMinutes: 4,
    relatedHref: "/leadgen/markets",
    relatedLabel: "Set up your Rochester market",
    sections: [
      {
        paragraphs: [
          "This app's first target market is Rochester, NY (Monroe County), alongside Buffalo (Erie County) and Syracuse (Onondaga County). That's a deliberate starting niche, not a limitation -- every engine underneath is written generically so more markets can be added later without changing how any of this works.",
        ],
      },
      {
        heading: "What's already wired up for Rochester",
        bullets: [
          "The Legal tab's jurisdiction engine automatically recognizes a Rochester address and files it under Monroe County -- you'll see that reflected once you start a deal's legal workflow.",
          "The Lead Gen module's Markets page is exactly where you'd add \"Rochester, NY\" and then save the specific local Facebook groups you're posting in.",
        ],
      },
      {
        heading: "What this app deliberately does not do",
        paragraphs: [
          "It does not invent Rochester price averages, cap rates, or \"good neighborhood\" lists. Real estate data changes constantly and varies block by block -- a number baked into an app would go stale and could steer you wrong. Instead, this app gives you a place to record what you've verified (the ARV comparables grid, the rent comparables, the property-condition confidence badges) and a Decision engine that works from those verified numbers, whatever they turn out to be.",
        ],
      },
      {
        heading: "Where to get real Rochester numbers",
        bullets: [
          "Monroe County's property and tax records for assessed value, tax history, and ownership.",
          "The City of Rochester's Certificate of Occupancy and rental-registration requirements -- relevant to the Property tab's CO confidence field.",
          "Local Rochester landlord and real-estate-investor Facebook groups and meetups -- exactly what the Lead Gen module's Groups page is built to track once you've found them.",
          "A local title company or real-estate attorney for anything the Legal tab flags as needing attorney review -- especially before any creative-finance deal.",
        ],
      },
      {
        heading: "Expanding beyond Rochester later",
        paragraphs: [
          "When you're ready to promote in another city, the same Markets page, the same Jurisdiction engine, and the same calculation engine already support it -- Buffalo and Syracuse are already recognized, and any other market works the same way with a generic jurisdiction fallback. Rochester is the beachhead, not a ceiling.",
        ],
      },
    ],
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function lessonsByCategory(): { category: LessonCategory; lessons: Lesson[] }[] {
  const order: LessonCategory[] = [
    "how-this-app-works", "finding-sellers", "underwriting", "creative-finance", "legal", "rochester-playbook",
  ];
  return order.map((category) => ({ category, lessons: LESSONS.filter((l) => l.category === category) }));
}
