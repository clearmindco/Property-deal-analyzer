import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { fetchOnboardingInputs } from "@/lib/onboarding/fetchOnboardingInputs";
import { computeOnboardingProgress } from "@/lib/onboarding/computeOnboardingProgress";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { Card } from "@/components/ui/Card";

export default async function GettingStartedPage() {
  const userId = await requireUserId();
  const inputs = await fetchOnboardingInputs(userId);
  const progress = computeOnboardingProgress(inputs);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Getting started</h1>
        <p className="text-text-secondary">
          A beginner-level walkthrough of everything in this app, in the order you&apos;d actually use it on a
          real deal -- find a seller, qualify them, run the numbers, get a plain-language decision, and
          (if you&apos;re using creative financing) get it in front of an attorney before you sign anything.
        </p>
      </div>

      <Link href="/learn">
        <Card className="border-primary-blue/30 bg-soft-blue/30 transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-navy">This checklist tells you what to do. The Education Center explains why.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Short lessons on how the numbers work, how to talk to sellers, and what the legal tab actually does --
            including a Rochester-specific playbook. Open the Education Center &rarr;
          </p>
        </Card>
      </Link>

      <OnboardingChecklist progress={progress} />
    </div>
  );
}
