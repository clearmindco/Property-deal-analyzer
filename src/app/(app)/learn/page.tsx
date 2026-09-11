import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { LESSON_CATEGORY_LABELS, lessonsByCategory } from "@/lib/learn/lessons";

export default function LearnPage() {
  const groups = lessonsByCategory();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Education Center</h1>
        <p className="text-text-secondary">
          This app is built on a specific method, not just a pile of input boxes. These lessons explain the
          thinking behind every tab -- what the numbers mean, why the legal gate exists, and how to actually
          run a deal with this, start to finish.
        </p>
      </div>

      {groups.map(({ category, lessons }) => (
        <div key={category}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            {LESSON_CATEGORY_LABELS[category]}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link key={lesson.slug} href={`/learn/${lesson.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-navy">{lesson.title}</CardTitle>
                    <span className="shrink-0 text-xs text-text-secondary">{lesson.readMinutes} min</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{lesson.summary}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
