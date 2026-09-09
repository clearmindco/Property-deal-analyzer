import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LeadsBoard } from "@/components/leads/LeadsBoard";

export default async function LeadsPage() {
  const userId = await requireUserId();
  const leads = await prisma.lead.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return <LeadsBoard initialLeads={JSON.parse(JSON.stringify(leads))} />;
}
