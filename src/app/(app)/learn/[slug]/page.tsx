import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LESSON_CATEGORY_LABELS, getLesson } from "@/lib/learn/lessons";

export default function LessonPage({ params }: { params: { slug: string } }) {
  const lesson = getLesson(params.slug);
  if (!lesson) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/learn" className="text-sm text-primary-blue hover:underline">
          &larr; Education Center
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {LESSON_CATEGORY_LABELS[lesson.category]} -- {lesson.readMinutes} min read
        </p>
        <h1 className="mt-1 text-2xl font-bold text-navy">{lesson.title}</h1>
        <p className="mt-1 text-text-secondary">{lesson.summary}</p>
      </div>

      <Card>
        <div className="flex flex-col gap-5">
          {lesson.sections.map((section, i) => (
            <div key={i}>
              {section.heading && <h2 className="mb-2 text-lg font-semibold text-navy">{section.heading}</h2>}
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="mb-2 text-sm leading-relaxed text-text-primary">{p}</p>
              ))}
              {section.bullets && (
                <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-text-primary">
                  {section.bullets.map((b, j) => <li key={j} className="py-0.5">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>

      {lesson.relatedHref && (
        <Link href={lesson.relatedHref}>
          <Button>{lesson.relatedLabel ?? "Try it"}</Button>
        </Link>
      )}
    </div>
  );
}
