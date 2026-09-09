import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { GroupWorkspace } from "@/components/leadgen/GroupWorkspace";

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const group = await prisma.group.findFirst({
    where: { id: params.id, userId },
    include: { market: true, posts: { orderBy: { createdAt: "desc" } } },
  });
  if (!group) notFound();

  const leads = await prisma.lead.findMany({ where: { userId, groupId: group.id } });

  return <GroupWorkspace group={JSON.parse(JSON.stringify(group))} leads={JSON.parse(JSON.stringify(leads))} />;
}
