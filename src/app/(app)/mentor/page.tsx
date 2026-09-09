import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/Card";
import type { DealKillerFlag } from "@/lib/types/deal";

export default async function MentorPage() {
  const userId = await requireUserId();
  const [deals, leads] = await Promise.all([
    prisma.deal.findMany({ where: { userId } }),
    prisma.lead.findMany({ where: { userId } }),
  ]);

  const analyzedCount = deals.filter((d) => d.valueArv || d.rehab || d.rent).length;
  const activeLeadCount = leads.filter((l) => !["CLOSED", "DEAD"].includes(l.status)).length;
  const dealsWithOpenKillers = deals.filter((d) => {
    const killers: DealKillerFlag[] = d.dealKillers ? JSON.parse(d.dealKillers) : [];
    return killers.some((k) => k.status === "STOP");
  });

  const actions: string[] = [];
  if (analyzedCount > activeLeadCount * 2 && analyzedCount > 2) {
    actions.push(`You've analyzed ${analyzedCount} properties but only have ${activeLeadCount} active seller leads. Don't research another deal today -- generate seller leads instead.`);
  }
  if (dealsWithOpenKillers.length > 0) {
    actions.push(`${dealsWithOpenKillers.length} deal(s) have a STOP flag -- verify before offering: ${dealsWithOpenKillers.map((d) => d.address).join(", ")}.`);
  }
  if (deals.length === 0) {
    actions.push("Create your first deal (or open the seeded demo deal) to see how the acquisition price and decision engine work.");
  }
  if (activeLeadCount === 0) {
    actions.push("No active seller leads yet. Post in one local community group today and log the response here.");
  }
  if (actions.length === 0) {
    actions.push("Pipeline looks healthy. Follow up with your most recently contacted lead.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">AI Mentor</h1>
        <p className="text-text-secondary">Not a motivational coach -- a check on what you&apos;re avoiding.</p>
      </div>

      <Card>
        <CardTitle>Today</CardTitle>
        <ul className="mt-3 list-disc pl-5 text-sm text-text-primary">
          {actions.map((a, i) => <li key={i} className="py-1">{a}</li>)}
        </ul>
      </Card>

      <Card>
        <CardTitle>How this works</CardTitle>
        <p className="mt-2 text-sm text-text-secondary">
          These prompts come from a deterministic, rule-based reading of your deal and lead pipeline (no external AI
          key required). Swap in a real model behind <code>src/lib/ai/provider.ts</code> to make the mentor
          conversational -- the interface (<code>AiProvider</code>) is already there.
        </p>
      </Card>
    </div>
  );
}
