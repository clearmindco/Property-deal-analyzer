import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DailyChecklist } from "@/components/leadgen/DailyChecklist";

function isToday(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export default async function LeadGenDashboardPage() {
  const userId = await requireUserId();
  const [groups, posts, leads] = await Promise.all([
    prisma.group.findMany({ where: { userId }, include: { market: true } }),
    prisma.post.findMany({ where: { userId } }),
    prisma.lead.findMany({ where: { userId } }),
  ]);

  const postsToday = posts.filter((p) => p.status === "POSTED" && isToday(p.postedAt)).length;
  const responsesToday = posts.filter((p) => p.responseOutcome && p.responseOutcome !== "NONE" && isToday(p.updatedAt)).length;
  const newLeadsToday = leads.filter((l) => isToday(l.createdAt)).length;
  const now = new Date();
  const followUpsDue = leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= now && l.status !== "CLOSED" && l.status !== "DEAD").length;
  const callsScheduled = leads.filter((l) => l.status === "CALL_SCHEDULED").length;

  const notPostedToday = groups
    .filter((g) => (g.priority === "HIGH_PRIORITY" || g.priority === "TEST") && !isToday(g.lastPostDate))
    .slice(0, 3);

  const dueLeads = leads
    .filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= now && l.status !== "CLOSED" && l.status !== "DEAD")
    .slice(0, 3);

  const awaitingResponseCheck = posts.filter((p) => p.status === "POSTED" && !p.responseOutcome).slice(0, 3);

  const checklist: string[] = [
    ...notPostedToday.map((g) => `Post in ${g.name} (${g.market.name})`),
    ...awaitingResponseCheck.map((p) => `Check for responses on your last post`),
    ...dueLeads.map((l) => `Follow up with ${l.sellerName}`),
  ];
  if (checklist.length === 0) checklist.push("Nothing urgent -- consider posting in a new group or reviewing group performance.");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Today&apos;s lead generation plan</h1>
          <p className="text-text-secondary">Facebook / community-group seller lead generation -- no paid ads, no automated posting.</p>
        </div>
        <Link href="/leadgen/markets"><Button>Markets &amp; groups</Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card><p className="text-xs uppercase text-text-secondary">Posts today</p><p className="mt-1 text-2xl font-bold text-navy">{postsToday}</p></Card>
        <Card><p className="text-xs uppercase text-text-secondary">Responses</p><p className="mt-1 text-2xl font-bold text-navy">{responsesToday}</p></Card>
        <Card><p className="text-xs uppercase text-text-secondary">New leads</p><p className="mt-1 text-2xl font-bold text-navy">{newLeadsToday}</p></Card>
        <Card><p className="text-xs uppercase text-text-secondary">Follow-ups due</p><p className="mt-1 text-2xl font-bold text-navy">{followUpsDue}</p></Card>
        <Card><p className="text-xs uppercase text-text-secondary">Calls scheduled</p><p className="mt-1 text-2xl font-bold text-navy">{callsScheduled}</p></Card>
      </div>

      <Card>
        <CardTitle>30 minutes</CardTitle>
        <DailyChecklist items={checklist} />
      </Card>

      {groups.length === 0 && (
        <Card>
          <p className="text-sm text-text-secondary">
            No markets or groups saved yet. <Link href="/leadgen/markets" className="text-primary-blue">Add your first market</Link> to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
