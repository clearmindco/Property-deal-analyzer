import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { COURSE_RULE_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";
import { CourseRulesBoard, type CourseRuleRecord } from "@/components/settings/CourseRulesBoard";

export default async function CourseRulesPage() {
  const userId = await requireUserId();
  const rowsRaw = await prisma.courseRule.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const rows = rowsRaw.map((r) => deserializeJsonFields(JSON.parse(JSON.stringify(r)), COURSE_RULE_JSON_FIELDS)) as CourseRuleRecord[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Course Rules</h1>
        <p className="text-text-secondary">
          CFP course-source facts, stored verbatim. When two sources conflict, both stay here side by
          side until you designate one authoritative -- nothing is silently reconciled.
        </p>
      </div>
      <CourseRulesBoard initial={rows} />
    </div>
  );
}
