import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DealsPage() {
  const userId = await requireUserId();
  const deals = await prisma.deal.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Deals</h1>
        <Link href="/deals/new">
          <Button>+ New Deal</Button>
        </Link>
      </div>

      {deals.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">No deals yet. Create your first one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text-primary">{deal.address}</p>
                  {deal.isDemo && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">DEMO</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-secondary">{deal.stage.replace("_", " ")}</p>
                <p className="mt-3 text-lg font-bold text-navy">
                  {deal.askingPrice ? `$${Math.round(deal.askingPrice).toLocaleString()}` : "No asking price yet"}
                </p>
                <p className="text-xs text-text-secondary">
                  {deal.units} unit{deal.units > 1 ? "s" : ""}
                  {deal.bedrooms ? ` · ${deal.bedrooms} bed` : ""}
                  {deal.bathrooms ? ` · ${deal.bathrooms} bath` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
