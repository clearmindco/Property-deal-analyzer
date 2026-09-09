import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function LendersPage() {
  const userId = await requireUserId();
  const lenders = await prisma.lender.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Lenders</h1>
        <Link href="/lenders/new"><Button>+ Add lender</Button></Link>
      </div>

      {lenders.length === 0 ? (
        <Card><p className="text-sm text-text-secondary">No lenders saved yet. Add your first hard-money or DSCR lender.</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lenders.map((lender) => {
            const terms = JSON.parse(lender.terms) as any;
            return (
              <Link key={lender.id} href={`/lenders/${lender.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-primary">{lender.name}</p>
                    {lender.verified ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">Verified quote</span>
                    ) : (
                      <span className="rounded-full bg-slate/15 px-2 py-0.5 text-[11px] text-slate">Advertised</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{lender.geography || "No geography set"}</p>
                  <p className="mt-2 text-sm">
                    {terms?.ratePct !== undefined ? `${(terms.ratePct * 100).toFixed(2)}%` : "--"} rate, {terms?.points ?? "--"} points
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
