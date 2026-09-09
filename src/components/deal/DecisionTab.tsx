"use client";

import type { InvestorRequirements, DealKillerFlag } from "@/lib/types/deal";
import type { AcquisitionPriceResult } from "@/lib/calc/acquisitionPrice";
import type { StressScenario } from "@/lib/calc/stressTest";
import type { DecisionResult } from "@/lib/calc/decision";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DecisionPill, StressPill } from "@/components/ui/StatusPill";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { DealKillersPanel } from "./DealKillersPanel";
import { useMode } from "@/lib/mode-context";
import { term, tooltipFor } from "@/lib/terminology";

export function DecisionTab({
  requirements,
  onRequirementsChange,
  onSave,
  saving,
  acquisition,
  stressScenarios,
  decision,
  dealKillers,
  onDealKillersChange,
}: {
  requirements: InvestorRequirements;
  onRequirementsChange: (next: InvestorRequirements) => void;
  onSave: () => void;
  saving: boolean;
  acquisition: AcquisitionPriceResult | null;
  stressScenarios: StressScenario[];
  decision: DecisionResult | null;
  dealKillers: DealKillerFlag[];
  onDealKillersChange: (next: DealKillerFlag[]) => void;
}) {
  const { mode } = useMode();

  return (
    <div className="flex flex-col gap-6">
      {mode === "simple" && (
        <p className="rounded-card bg-soft-blue px-4 py-3 text-sm text-navy">
          This is where it all comes together. Tell us what you need out of a deal below, and
          we&apos;ll tell you the most you should pay -- and whether this property, at its current
          asking price, actually fits.
        </p>
      )}

      <Card>
        <CardTitle>{mode === "simple" ? "What you need out of a deal" : "Your investment requirements"}</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="text-sm font-medium text-text-secondary">
            {term("minCashFlowPerDoor", mode)}<InfoTooltip text={tooltipFor("minCashFlowPerDoor")} />
            <input type="number" value={requirements.minMonthlyCashFlowPerDoor}
              onChange={(e) => onRequirementsChange({ ...requirements, minMonthlyCashFlowPerDoor: Number(e.target.value) })}
              className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </label>
          <label className="text-sm font-medium text-text-secondary">
            {term("maxCashLeftAfterRefi", mode)}<InfoTooltip text={tooltipFor("maxCashLeftAfterRefi")} />
            <input type="number" value={requirements.maxCashLeftInPropertyAfterRefi}
              onChange={(e) => onRequirementsChange({ ...requirements, maxCashLeftInPropertyAfterRefi: Number(e.target.value) })}
              className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </label>
          <label className="text-sm font-medium text-text-secondary">
            {term("minEquityCreated", mode)} (%)<InfoTooltip text={tooltipFor("minEquityCreated")} />
            <input type="number" value={Math.round(requirements.minEquityCreatedPct * 100)}
              onChange={(e) => onRequirementsChange({ ...requirements, minEquityCreatedPct: Number(e.target.value) / 100 })}
              className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </label>
          <label className="text-sm font-medium text-text-secondary">
            {term("reservesRequired", mode)}<InfoTooltip text={tooltipFor("reservesRequired")} />
            <input type="number" value={requirements.reservesRequired}
              onChange={(e) => onRequirementsChange({ ...requirements, reservesRequired: Number(e.target.value) })}
              className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save requirements"}</Button>
        </div>
      </Card>

      {!acquisition && (
        <Card>
          <p className="text-sm text-text-secondary">
            {mode === "simple"
              ? "We can't calculate a price yet. Go to the Value/ARV tab and enter what the property could be worth after repairs, then check Rehab, Rent, and Financing."
              : "Add an ARV (Value/ARV tab), rehab estimate, rent, and financing assumptions to calculate an acquisition price."}
          </p>
        </Card>
      )}

      {acquisition && (
        <Card>
          <CardTitle>
            {mode === "simple" ? "What you should pay" : "Acquisition price"}
            <InfoTooltip text="The highest price you can safely pay while still meeting every requirement you selected above." />
          </CardTitle>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-card border border-silver/30 p-4">
              <p className="text-xs uppercase text-text-secondary">{term("targetOffer", mode)}</p>
              <p className="mt-1 text-2xl font-bold text-navy">${Math.round(acquisition.targetOffer).toLocaleString()}</p>
              <p className="mt-1 text-xs text-text-secondary">{tooltipFor("targetOffer")}</p>
            </div>
            <div className="rounded-card border border-primary-blue/50 bg-soft-blue p-4">
              <p className="text-xs uppercase text-text-secondary">{term("idealAcquisition", mode)}</p>
              <p className="mt-1 text-2xl font-bold text-navy">${Math.round(acquisition.idealAcquisition).toLocaleString()}</p>
              <p className="mt-1 text-xs text-text-secondary">{tooltipFor("idealAcquisition")}</p>
            </div>
            <div className="rounded-card border border-silver/30 p-4">
              <p className="text-xs uppercase text-text-secondary">{term("maximumAcquisition", mode)}</p>
              <p className="mt-1 text-2xl font-bold text-navy">${Math.round(acquisition.maximumAcquisition).toLocaleString()}</p>
              <p className="mt-1 text-xs text-text-secondary">{tooltipFor("maximumAcquisition")}</p>
            </div>
          </div>
          {acquisition.askingPrice !== undefined && (
            <p className="mt-4 rounded-card bg-soft-blue px-3 py-2 text-sm text-navy">
              {mode === "simple" ? "The seller is asking" : "Asking price is"} ${Math.round(acquisition.askingPrice).toLocaleString()}, which is{" "}
              {acquisition.differenceFromAsking !== undefined && acquisition.differenceFromAsking > 0
                ? `$${Math.round(acquisition.differenceFromAsking).toLocaleString()} above the most you should pay.`
                : `at or below the most you should pay -- good sign.`}
            </p>
          )}
        </Card>
      )}

      {decision && (
        <Card>
          <div className="flex items-center gap-3">
            <DecisionPill verdict={decision.verdict} />
            <h4 className="font-semibold text-text-primary">{decision.headline}</h4>
          </div>
          <p className="mt-2 text-sm text-text-secondary">{decision.explanation}</p>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase text-text-secondary">Your next move</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-text-primary">
              {decision.nextActions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        </Card>
      )}

      {stressScenarios.length > 0 && (
        <Card>
          <CardTitle>
            {mode === "simple" ? "Does this still work if things go wrong?" : "Stress test"}
            <InfoTooltip text="Automatically checks whether the deal still works if rehab runs over, ARV comes in low, rent is soft, rates rise, or the hold takes longer." />
          </CardTitle>
          {mode === "simple" && (
            <p className="mt-1 text-xs text-text-secondary">
              Every deal gets checked against six worse-than-expected scenarios automatically --
              you don&apos;t need to do anything for this.
            </p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary">
                  <th className="py-1">Scenario</th>
                  <th>{term("cashLeftInProperty", mode)}</th>
                  <th>{term("cashFlow", mode)}</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {stressScenarios.map((s) => (
                  <tr key={s.name} className="border-t border-silver/20">
                    <td className="py-2">{s.name}</td>
                    <td>${Math.round(s.cashRemainingInProperty).toLocaleString()}</td>
                    <td>${Math.round(s.postRefiCashFlowMonthly).toLocaleString()}/mo</td>
                    <td><StressPill verdict={s.verdict} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <DealKillersPanel dealKillers={dealKillers} onChange={onDealKillersChange} />
    </div>
  );
}
