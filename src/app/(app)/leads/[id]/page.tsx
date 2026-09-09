import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LEAD_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";
import { LeadWorkspace } from "@/components/leads/LeadWorkspace";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const leadRaw = await prisma.lead.findFirst({ where: { id: params.id, userId } });
  if (!leadRaw) notFound();
  const lead = deserializeJsonFields(JSON.parse(JSON.stringify(leadRaw)), LEAD_JSON_FIELDS);

  const [group, market] = await Promise.all([
    lead.groupId ? prisma.group.findFirst({ where: { id: lead.groupId as string, userId } }) : null,
    lead.marketId ? prisma.market.findFirst({ where: { id: lead.marketId as string, userId } }) : null,
  ]);

  return (
    <LeadWorkspace
      lead={lead as any}
      groupName={group?.name ?? null}
      marketName={market?.name ?? null}
    />
  );
}
