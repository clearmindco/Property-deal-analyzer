import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchOnboardingInputs } from "@/lib/onboarding/fetchOnboardingInputs";
import { computeOnboardingProgress } from "@/lib/onboarding/computeOnboardingProgress";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [deals, leadCount, lenderCount, onboardingInputs] = await Promise.all([
    prisma.deal.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.lead.count({ where: { userId } }),
    prisma.lender.count({ where: { userId } }),
    fetchOnboardingInputs(userId),
  ]);
  const dealCount = await prisma.deal.count({ where: { userId } });
  const onboardingProgress = computeOnboardingProgress(onboardingInputs);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-text-secondary">From address to answer. Understand the deal. Know the risk. Know your next move.</p>
        </div>
        <Link href="/deals/new">
          <Button>+ New Deal</Button>
        </Link>
      </div>

      {!onboardingProgress.allDone && (
        <Card className="border-primary-blue/40 bg-soft-blue/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-navy">New here? Start with your first deal.</CardTitle>
              <p className="mt-1 text-sm text-text-primary">
                {onboardingProgress.nextStep
                  ? `Next: ${onboardingProgress.nextStep.title}`
                  : "You're almost through the guided walkthrough."}{" "}
                ({onboardingProgress.percentComplete}% of the way through the required steps)
              </p>
            </div>
            <Link href="/getting-started">
              <Button>Continue walkthrough</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Deals</CardTitle>
          <p className="mt-2 text-3xl font-bold text-navy">{dealCount}</p>
        </Card>
        <Card>
          <CardTitle>Seller leads</CardTitle>
          <p className="mt-2 text-3xl font-bold text-navy">{leadCount}</p>
        </Card>
        <Card>
          <CardTitle>Saved lenders</CardTitle>
          <p className="mt-2 text-3xl font-bold text-navy">{lenderCount}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Recent deals</CardTitle>
        <div className="mt-3 flex flex-col divide-y divide-silver/30">
          {deals.length === 0 && (
            <p className="py-4 text-sm text-text-secondary">
              No deals yet. Start with the seeded demo deal on the Deals page, or create your own.
            </p>
          )}
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center justify-between py-3 text-sm hover:bg-soft-blue/40"
            >
              <div>
                <p className="font-medium text-text-primary">
                  {deal.address} {deal.isDemo && <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning">DEMO</span>}
                </p>
                <p className="text-text-secondary">{deal.stage.replace("_", " ")}</p>
              </div>
              <p className="text-text-secondary">
                {deal.askingPrice ? `$${Math.round(deal.askingPrice).toLocaleString()}` : "No asking price"}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
