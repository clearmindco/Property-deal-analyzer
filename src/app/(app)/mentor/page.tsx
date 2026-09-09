import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/Card";
import type { DealKillerFlag } from "@/lib/types/deal";
import { computeGroupPerformance } from "@/lib/leadgen";

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function MentorPage() {
  const userId = await requireUserId();
  const [deals, leads, groups, posts] = await Promise.all([
    prisma.deal.findMany({ where: { userId } }),
    prisma.lead.findMany({ where: { userId } }),
    prisma.group.findMany({ where: { userId }, include: { market: true } }),
    prisma.post.findMany({ where: { userId } }),
  ]);

  const analyzedCount = deals.filter((d) => d.valueArv || d.rehab || d.rent).length;
  const activeLeadCount = leads.filter((l) => !["CLOSED", "DEAD"].includes(l.status)).length;
  const dealsWithOpenKillers = deals.filter((d) => {
    const killers: DealKillerFlag[] = d.dealKillers ? JSON.parse(d.dealKillers) : [];
    return killers.some((k) => k.status === "STOP");
  });

  const actions: string[] = [];

  // Lead-gen: has it been a while since anything was posted anywhere?
  const lastPostDates = groups.map((g) => g.lastPostDate).filter((d): d is Date => d !== null);
  const mostRecentPost = lastPostDates.length > 0 ? new Date(Math.max(...lastPostDates.map((d) => d.getTime()))) : null;
  const daysSincePost = daysSince(mostRecentPost);
  if (groups.length > 0 && (daysSincePost === null || daysSincePost >= 4)) {
    actions.push(
      daysSincePost === null
        ? "You've saved groups but haven't posted in any of them yet. Pick one and generate today's post."
        : `You haven't posted in a seller group in ${daysSincePost} days. Visibility compounds -- post something today.`
    );
  }

  // Lead-gen: leads generated but not called -- the bottleneck is follow-up, not generation.
  const calledLeads = leads.filter((l) => l.lastContactAt !== null).length;
  if (leads.length >= 5 && calledLeads < leads.length / 3) {
    actions.push(
      `You've generated ${leads.length} leads but only followed up with ${calledLeads}. Lead generation is not your bottleneck right now -- calling sellers back is.`
    );
  }

  // Lead-gen: per-group performance -- call out a clear best and a clear "stop using."
  const postsByGroup = new Map<string, typeof posts>();
  for (const p of posts) postsByGroup.set(p.groupId, [...(postsByGroup.get(p.groupId) ?? []), p]);
  const leadsByGroup = new Map<string, number>();
  for (const l of leads) if (l.groupId) leadsByGroup.set(l.groupId, (leadsByGroup.get(l.groupId) ?? 0) + 1);

  for (const group of groups) {
    const groupPosts = postsByGroup.get(group.id) ?? [];
    const postedCount = groupPosts.filter((p) => p.status === "POSTED").length;
    if (postedCount < 3) continue;
    const performance = computeGroupPerformance({
      posts: postedCount,
      responses: groupPosts.filter((p) => p.responseOutcome && p.responseOutcome !== "NONE").length,
      leads: leadsByGroup.get(group.id) ?? 0,
      qualifiedLeads: 0, calls: 0, offers: 0, contracts: 0, closedDeals: 0,
    });
    if (performance.recommendation === "STOP USING") {
      actions.push(`Stop posting in ${group.name} for now -- ${postedCount} posts have produced no seller conversations.`);
    }
  }

  if (dealsWithOpenKillers.length > 0) {
    actions.push(`${dealsWithOpenKillers.length} deal(s) have a STOP flag -- verify before offering: ${dealsWithOpenKillers.map((d) => d.address).join(", ")}.`);
  }
  if (analyzedCount > activeLeadCount * 2 && analyzedCount > 2) {
    actions.push(`You've analyzed ${analyzedCount} properties but only have ${activeLeadCount} active seller leads. Don't research another deal today -- generate seller leads instead.`);
  }

  // Most urgent follow-up, if any.
  const now = new Date();
  const dueLead = leads
    .filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= now && l.status !== "CLOSED" && l.status !== "DEAD")
    .sort((a, b) => (a.nextFollowUpAt as Date).getTime() - (b.nextFollowUpAt as Date).getTime())[0];
  if (dueLead) {
    actions.push(`Your next action is to follow up with ${dueLead.sellerName}${dueLead.address ? ` about ${dueLead.address}` : ""}.`);
  }

  if (deals.length === 0) {
    actions.push("Create your first deal (or open the seeded demo deal) to see how the acquisition price and decision engine work.");
  }
  if (groups.length === 0) {
    actions.push("No markets or groups saved yet. Set one up on the Lead Gen page and post your first seller-attraction message today.");
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
          These prompts come from a deterministic, rule-based reading of your deal, lead, and lead-generation pipeline
          (no external AI key required). Swap in a real model behind <code>src/lib/ai/provider.ts</code> to make the
          mentor conversational -- the interface (<code>AiProvider</code>) is already there.
        </p>
      </Card>
    </div>
  );
}
