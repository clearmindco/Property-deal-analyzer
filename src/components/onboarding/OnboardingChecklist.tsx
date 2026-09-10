import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { OnboardingProgress } from "@/lib/onboarding/computeOnboardingProgress";

export function OnboardingChecklist({ progress }: { progress: OnboardingProgress }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Your first deal, start to finish</CardTitle>
          <span className="text-sm font-semibold text-navy">{progress.percentComplete}% complete</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-soft-blue">
          <div
            className="h-full rounded-full bg-primary-blue transition-all"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
        {progress.allDone ? (
          <p className="mt-3 text-sm font-medium text-success">
            You&apos;ve made it through every required step. Keep working leads and analyzing deals -- the pipeline is the job now.
          </p>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            This app has a lot in it. You don&apos;t need all of it on day one -- just this list, in order.
          </p>
        )}
      </Card>

      <Card>
        <ul className="flex flex-col divide-y divide-silver/30">
          {progress.steps.map((step) => {
            const isNext = progress.nextStep?.id === step.id;
            return (
              <li key={step.id} className={`flex items-start gap-3 py-4 ${isNext ? "rounded-card bg-soft-blue/40 px-3" : "px-1"}`}>
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done ? "bg-success text-white" : "border-2 border-silver/60 text-text-secondary"
                  }`}
                >
                  {step.done ? "✓" : ""}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${step.done ? "text-text-secondary line-through" : "text-navy"}`}>
                      {step.title}
                    </p>
                    {step.optional && (
                      <span className="rounded-full bg-silver/30 px-2 py-0.5 text-[11px] font-medium text-text-secondary">Optional</span>
                    )}
                    {isNext && <span className="rounded-full bg-primary-blue/15 px-2 py-0.5 text-[11px] font-semibold text-primary-blue">Do this next</span>}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{step.description}</p>
                  {!step.done && (
                    <Link href={step.ctaHref} className="mt-2 inline-block">
                      <Button variant={isNext ? "primary" : "secondary"}>{step.ctaLabel}</Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
