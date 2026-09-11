import Link from "next/link";
import { Card } from "@/components/ui/Card";

/** A short "why this matters" framing card at the top of a Deal Workspace tab -- the thing
 * that stops a plain form from feeling like a generic calculator. Every tab that's mostly
 * input fields should have one. */
export function TabIntro({
  blurb, learnHref, learnLabel,
}: {
  blurb: string;
  learnHref?: string;
  learnLabel?: string;
}) {
  return (
    <Card className="border-primary-blue/20 bg-soft-blue/20">
      <p className="text-sm text-text-primary">{blurb}</p>
      {learnHref && (
        <Link href={learnHref} className="mt-1 inline-block text-sm font-medium text-primary-blue hover:underline">
          {learnLabel ?? "Learn more"} &rarr;
        </Link>
      )}
    </Card>
  );
}
