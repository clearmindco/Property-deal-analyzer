"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Market {
  id: string;
  name: string;
  notes: string | null;
  groups: Array<{ id: string; priority: string }>;
}

export function MarketsBoard({ initialMarkets }: { initialMarkets: Market[] }) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function addMarket(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (res.ok) {
      const market = await res.json();
      setMarkets((m) => [...m, { ...market, groups: [] }]);
      setName("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Markets</h1>
        <p className="text-text-secondary">Each market gets its own Facebook/community group list.</p>
      </div>

      <Card>
        <CardTitle>Add a market</CardTitle>
        <form onSubmit={addMarket} className="mt-3 flex gap-2">
          <input
            placeholder="e.g. Rochester, NY"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={creating}>{creating ? "Adding..." : "Add market"}</Button>
        </form>
      </Card>

      {markets.length === 0 ? (
        <Card><p className="text-sm text-text-secondary">No markets yet. Add your first one above.</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => {
            const highPriority = market.groups.filter((g) => g.priority === "HIGH_PRIORITY").length;
            return (
              <Link key={market.id} href={`/leadgen/markets/${market.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <p className="font-semibold text-text-primary">{market.name}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {market.groups.length} group{market.groups.length === 1 ? "" : "s"}
                    {highPriority > 0 ? ` -- ${highPriority} high priority` : ""}
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
