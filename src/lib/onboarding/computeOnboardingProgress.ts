// Guided first-deal journey: ties the modules that were built as separate specs (lead
// generation, seller qualification, deal underwriting, legal workflow) into one visible spine
// for a brand-new user. Deliberately computed from data that already exists -- no new required
// fields, no separate "mark step done" button that can drift from reality.

export interface OnboardingInputs {
  marketCount: number;
  groupCount: number;
  postedCount: number;
  leadCount: number;
  /** Leads with at least half of the 10 core questions confirmed -- enough to route a strategy. */
  qualifiedLeadCount: number;
  dealCount: number;
  /** Deals with an ARV and a market rent entered -- enough for the acquisition engine to run. */
  dealsWithNumbersCount: number;
  /** Deals with an asking price set, so the Decision tab has produced a verdict. */
  decisionsReachedCount: number;
  legalCasesStartedCount: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  ctaHref: string;
  optional?: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  /** Excludes optional steps -- the legal step is often correctly skipped on a cash deal. */
  requiredCount: number;
  percentComplete: number;
  nextStep: OnboardingStep | null;
  allDone: boolean;
}

export function computeOnboardingProgress(inputs: OnboardingInputs): OnboardingProgress {
  const steps: OnboardingStep[] = [
    {
      id: "market-group",
      title: "Save your first market and group",
      description: "Add the city you invest in and one Facebook group where sellers post -- this is where inbound leads start.",
      done: inputs.marketCount > 0 && inputs.groupCount > 0,
      ctaLabel: "Set up Lead Gen",
      ctaHref: "/leadgen/markets",
    },
    {
      id: "first-post",
      title: "Post your first seller-attraction message",
      description: "Generate a post, copy it into the group, and mark it posted -- visibility compounds.",
      done: inputs.postedCount > 0,
      ctaLabel: "Generate a post",
      ctaHref: "/leadgen",
    },
    {
      id: "qualify-lead",
      title: "Qualify your first seller lead",
      description: "Walk through the 10 core questions one at a time -- you'll always know what to ask next.",
      done: inputs.qualifiedLeadCount > 0,
      ctaLabel: "Open Leads",
      ctaHref: "/leads",
    },
    {
      id: "first-deal",
      title: "Get a deal into the analyzer",
      description: "Hand off a qualified lead, or create a deal directly if you already have an address.",
      done: inputs.dealCount > 0,
      ctaLabel: "Create a deal",
      ctaHref: "/deals/new",
    },
    {
      id: "run-numbers",
      title: "Run the numbers",
      description: "Enter ARV and market rent so the acquisition-price and BRRRR engine has something to work with.",
      done: inputs.dealsWithNumbersCount > 0,
      ctaLabel: "Open your deal",
      ctaHref: "/deals",
    },
    {
      id: "decision",
      title: "See your Decision",
      description: "Add an asking price to get a plain-language STRONG FIT / NEEDS WORK / DOESN'T FIT verdict and stress test.",
      done: inputs.decisionsReachedCount > 0,
      ctaLabel: "View Decision tab",
      ctaHref: "/deals",
    },
    {
      id: "legal",
      title: "Start the legal workflow (if you're using creative financing)",
      description: "For seller-finance, subject-to, or hybrid deals, run the pre-contract legal screen before talking price with the seller. Not needed for a straight cash purchase.",
      done: inputs.legalCasesStartedCount > 0,
      ctaLabel: "Open the Legal tab",
      ctaHref: "/deals",
      optional: true,
    },
  ];

  const requiredSteps = steps.filter((s) => !s.optional);
  const completedCount = steps.filter((s) => s.done).length;
  const requiredCompletedCount = requiredSteps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done) ?? null;

  return {
    steps,
    completedCount,
    requiredCount: requiredSteps.length,
    percentComplete: Math.round((requiredCompletedCount / requiredSteps.length) * 100),
    nextStep,
    allDone: requiredCompletedCount === requiredSteps.length,
  };
}
