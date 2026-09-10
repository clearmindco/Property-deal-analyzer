import { requireUserId } from "@/lib/session";
import { fetchOnboardingInputs } from "@/lib/onboarding/fetchOnboardingInputs";
import { computeOnboardingProgress } from "@/lib/onboarding/computeOnboardingProgress";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

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
      <OnboardingChecklist progress={progress} />
    </div>
  );
}
