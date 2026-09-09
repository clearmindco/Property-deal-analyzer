import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { MarketsBoard } from "@/components/leadgen/MarketsBoard";

export default async function MarketsPage() {
  const userId = await requireUserId();
  const markets = await prisma.market.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { groups: true },
  });
  return <MarketsBoard initialMarkets={JSON.parse(JSON.stringify(markets))} />;
}
