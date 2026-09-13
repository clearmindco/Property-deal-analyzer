import type { BestDealRouterResult, StrategyResult } from "@/lib/types/strategy";
import { STRATEGY_LABELS } from "@/lib/types/strategy";

// Best Deal Router: after every available strategy has been run, rank the ones that actually
// work and name a recommendation, a backup, an alternative exit, and a walk-away point --
// never a hidden score, always the reasoning that produced the ranking.

function cashEfficiency(result: StrategyResult): number {
  if (result.monthlyCashFlow === null) return -Infinity;
  if (!result.cashRequired || result.cashRequired <= 0) {
    return result.monthlyCashFlow > 0 ? Number.POSITIVE_INFINITY : result.monthlyCashFlow;
  }
  return result.monthlyCashFlow / result.cashRequired;
}

export function rankStrategies(results: StrategyResult[]): BestDealRouterResult {
  const passing = results.filter((r) => r.verdict === "PASS");
  const ranked = [...passing].sort((a, b) => cashEfficiency(b) - cashEfficiency(a));

  const recommended = ranked[0] ?? null;
  const backup = ranked[1] ?? null;
  const alternativeExit = results.find((r) => r.strategy === "WHOLESALE_ASSIGNMENT" && r.available) ?? null;

  const walkAwayPoint = recommended
    ? `If ${STRATEGY_LABELS[recommended.strategy]} can't be structured close to the numbers above, none of the other evaluated strategies currently meet your target -- that's the point to pass.`
    : "No evaluated strategy currently meets your target cash flow. Review the rescue options on each failing strategy before deciding whether to renegotiate or pass.";

  const nextInformationNeeded = Array.from(new Set(
    results
      .filter((r) => r.verdict === "NEEDS_INFO")
      .flatMap((r) => r.reasoning)
  ));

  return { ranked, recommended, backup, alternativeExit, walkAwayPoint, nextInformationNeeded };
}
