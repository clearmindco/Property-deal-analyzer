import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { DealWorkspace } from "@/components/deal/DealWorkspace";
import { DEAL_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const deal = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!deal) notFound();

  const serialized = deserializeJsonFields(JSON.parse(JSON.stringify(deal)), DEAL_JSON_FIELDS);
  return <DealWorkspace deal={serialized} />;
}
