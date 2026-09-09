import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { MarketDetail } from "@/components/leadgen/MarketDetail";

export default async function MarketDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const market = await prisma.market.findFirst({
    where: { id: params.id, userId },
    include: { groups: { orderBy: { createdAt: "asc" } } },
  });
  if (!market) notFound();

  return <MarketDetail market={JSON.parse(JSON.stringify(market))} />;
}
