"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DealKillerFlag, Financing, InvestorRequirements, PropertyDetails, Rehab, Rent, ValueArv,
} from "@/lib/types/deal";
import {
  defaultDealKillers, defaultFinancing, defaultPropertyDetails, defaultRehab, defaultRent,
  defaultRequirements, defaultValueArv,
} from "@/lib/dealDefaults";
import { calculateAcquisitionPrice } from "@/lib/calc/acquisitionPrice";
import { runStressTest } from "@/lib/calc/stressTest";
import { evaluateDecision } from "@/lib/calc/decision";
import type { DealSummaryContext } from "@/lib/ai/types";
import { OverviewTab } from "./OverviewTab";
import { PropertyTab } from "./PropertyTab";
import { ValueArvTab } from "./ValueArvTab";
import { RehabTab } from "./RehabTab";
import { RentTab } from "./RentTab";
import { FinancingTab } from "./FinancingTab";
import { DecisionTab } from "./DecisionTab";

const TABS = ["Overview", "Property", "Value / ARV", "Rehab", "Rent", "Financing", "Decision"] as const;
type Tab = (typeof TABS)[number];

interface SerializedDeal {
  id: string; address: string; city: string | null; state: string | null; zip: string | null;
  askingPrice: number | null; propertyType: string | null; units: number; bedrooms: number | null;
  bathrooms: number | null; sqft: number | null; isDemo: boolean; stage: string;
  property: PropertyDetails | null; valueArv: ValueArv | null; rehab: Rehab | null; rent: Rent | null;
  financing: Financing | null; assumptions: InvestorRequirements | null; dealKillers: DealKillerFlag[] | null;
}

export function DealWorkspace({ deal }: { deal: SerializedDeal }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [saving, setSaving] = useState(false);

  const [header, setHeader] = useState({
    address: deal.address, city: deal.city ?? "", state: deal.state ?? "", zip: deal.zip ?? "",
    askingPrice: deal.askingPrice?.toString() ?? "", propertyType: deal.propertyType ?? "",
    units: String(deal.units), bedrooms: deal.bedrooms?.toString() ?? "", bathrooms: deal.bathrooms?.toString() ?? "",
    sqft: deal.sqft?.toString() ?? "",
  });
  const [voiceNote, setVoiceNote] = useState("");
  const [property, setProperty] = useState<PropertyDetails>(deal.property ?? defaultPropertyDetails());
  const [valueArv, setValueArv] = useState<ValueArv>(deal.valueArv ?? defaultValueArv());
  const [rehab, setRehab] = useState<Rehab>(deal.rehab ?? defaultRehab());
  const [rent, setRent] = useState<Rent>(deal.rent ?? defaultRent());
  const [financing, setFinancing] = useState<Financing>(deal.financing ?? defaultFinancing());
  const [requirements, setRequirements] = useState<InvestorRequirements>(deal.assumptions ?? defaultRequirements());
  const [dealKillers, setDealKillers] = useState<DealKillerFlag[]>(deal.dealKillers ?? defaultDealKillers());

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    router.refresh();
  }

  const rehabTotal = useMemo(
    () => rehab.lineItems.reduce((s, i) => s + i.expected, 0) * (1 + rehab.contingencyPct),
    [rehab]
  );
  const arv = valueArv.brrrUnderwritingArv?.value ?? valueArv.likelyArv?.value ?? 0;
  const rentMonthly = rent.market.likelyRent?.value ?? 0;
  const askingPriceNum = header.askingPrice ? Number(header.askingPrice) : undefined;

  const acquisition = useMemo(() => {
    if (arv <= 0) return null;
    return calculateAcquisitionPrice({
      arv, rehabTotal, hardMoneyTerms: financing.hardMoney, refinanceTerms: financing.refinance,
      expenses: financing.expenses, rentMonthly, holdPeriodMonths: financing.holdPeriodMonths,
      requirements, askingPrice: askingPriceNum,
    });
  }, [arv, rehabTotal, financing, rentMonthly, requirements, askingPriceNum]);

  const stressScenarios = useMemo(() => {
    if (arv <= 0 || askingPriceNum === undefined) return [];
    return runStressTest({
      arv, rehabTotal, hardMoneyTerms: financing.hardMoney, refinanceTerms: financing.refinance,
      expenses: financing.expenses, rentMonthly, holdPeriodMonths: financing.holdPeriodMonths,
      requirements, purchasePrice: askingPriceNum,
    });
  }, [arv, rehabTotal, financing, rentMonthly, requirements, askingPriceNum]);

  const openDealKillerCount = dealKillers.filter((k) => k.status !== "OK").length;

  const decision = useMemo(() => {
    if (!acquisition) return null;
    return evaluateDecision(acquisition, stressScenarios.length > 0 ? stressScenarios : [
      { name: "Base case", rehabTotal, arv, rentMonthly, refinanceTerms: financing.refinance, holdPeriodMonths: financing.holdPeriodMonths, cashRemainingInProperty: acquisition.projectionAtAsking?.cashRemainingInProperty ?? 0, postRefiCashFlowMonthly: acquisition.projectionAtAsking?.postRefiCashFlowMonthly ?? 0, verdict: "SURVIVES" },
    ], openDealKillerCount);
  }, [acquisition, stressScenarios, openDealKillerCount, rehabTotal, arv, rentMonthly, financing.refinance, financing.holdPeriodMonths]);

  const summaryContext: DealSummaryContext = {
    address: header.address,
    askingPrice: askingPriceNum,
    arv: arv > 0 ? arv : undefined,
    arvConfidence: valueArv.brrrUnderwritingArv?.provenance.status,
    rehabTotal: rehabTotal > 0 ? rehabTotal : undefined,
    rentMonthly: rentMonthly > 0 ? rentMonthly : undefined,
    targetOffer: acquisition?.targetOffer,
    idealAcquisition: acquisition?.idealAcquisition,
    maximumAcquisition: acquisition?.maximumAcquisition,
    cashRemainingAtAsking: acquisition?.projectionAtAsking?.cashRemainingInProperty,
    postRefiCashFlowAtAsking: acquisition?.projectionAtAsking?.postRefiCashFlowMonthly,
    decisionVerdict: decision?.verdict,
    openDealKillers: dealKillers.filter((k) => k.status !== "OK").map((k) => ({ label: k.label, note: k.status === "STOP" ? "Stop -- verify before offering" : undefined })),
    unknownFacts: [],
    worstStressVerdict: stressScenarios.length > 0 ? stressScenarios[stressScenarios.length - 1]!.verdict : undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-navy">{header.address || "New deal"}</h1>
        {deal.isDemo && <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">DEMO / EDUCATIONAL DATA</span>}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-silver/40">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-card px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? "border-b-2 border-primary-blue text-navy" : "text-text-secondary hover:text-navy"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab
          header={header}
          onHeaderChange={setHeader}
          saving={saving}
          summaryContext={summaryContext}
          onSave={() =>
            patch({
              address: header.address, city: header.city || null, state: header.state || null, zip: header.zip || null,
              askingPrice: header.askingPrice ? Number(header.askingPrice) : null,
              units: header.units ? Number(header.units) : 1,
              bedrooms: header.bedrooms ? Number(header.bedrooms) : null,
              bathrooms: header.bathrooms ? Number(header.bathrooms) : null,
            })
          }
        />
      )}

      {tab === "Property" && (
        <PropertyTab
          property={property}
          onChange={setProperty}
          saving={saving}
          voiceNote={voiceNote}
          onVoiceNoteChange={setVoiceNote}
          onSave={() => patch({ property })}
        />
      )}

      {tab === "Value / ARV" && (
        <ValueArvTab valueArv={valueArv} onChange={setValueArv} saving={saving} onSave={() => patch({ valueArv })} />
      )}

      {tab === "Rehab" && (
        <RehabTab rehab={rehab} onChange={setRehab} saving={saving} onSave={() => patch({ rehab })} />
      )}

      {tab === "Rent" && (
        <RentTab rent={rent} onChange={setRent} saving={saving} onSave={() => patch({ rent })} />
      )}

      {tab === "Financing" && (
        <FinancingTab
          financing={financing} onChange={setFinancing} saving={saving} onSave={() => patch({ financing })}
          purchasePrice={askingPriceNum ?? 0} rehabTotal={rehabTotal} arv={arv} rentMonthly={rentMonthly}
        />
      )}

      {tab === "Decision" && (
        <DecisionTab
          requirements={requirements}
          onRequirementsChange={setRequirements}
          saving={saving}
          onSave={() => patch({ assumptions: requirements })}
          acquisition={acquisition}
          stressScenarios={stressScenarios}
          decision={decision}
          dealKillers={dealKillers}
          onDealKillersChange={(next) => {
            setDealKillers(next);
            patch({ dealKillers: next });
          }}
        />
      )}
    </div>
  );
}
