"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GROUP_TYPE_LABELS, type GroupPriority, type GroupType } from "@/lib/types/leadgen";

interface Group {
  id: string;
  name: string;
  url: string | null;
  groupType: string;
  priority: string;
  memberCount: number | null;
}

interface Market {
  id: string;
  name: string;
  notes: string | null;
  groups: Group[];
}

const PRIORITY_STYLES: Record<string, string> = {
  HIGH_PRIORITY: "bg-success/15 text-success",
  TEST: "bg-primary-blue/15 text-primary-blue",
  LOW_PRIORITY: "bg-slate/15 text-slate",
  STOP_USING: "bg-danger/10 text-danger",
};

const GROUP_TYPES = Object.keys(GROUP_TYPE_LABELS) as GroupType[];
const PRIORITIES: GroupPriority[] = ["HIGH_PRIORITY", "TEST", "LOW_PRIORITY", "STOP_USING"];

export function MarketDetail({ market }: { market: Market }) {
  const [groups, setGroups] = useState<Group[]>(market.groups);
  const [form, setForm] = useState({ name: "", url: "", groupType: "community", priority: "TEST" });
  const [creating, setCreating] = useState(false);

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, marketId: market.id }),
    });
    setCreating(false);
    if (res.ok) {
      const group = await res.json();
      setGroups((g) => [...g, group]);
      setForm({ name: "", url: "", groupType: "community", priority: "TEST" });
    }
  }

  const inputClass = "rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/leadgen/markets" className="text-sm text-primary-blue">&larr; All markets</Link>
        <h1 className="mt-1 text-2xl font-bold text-navy">{market.name}</h1>
      </div>

      <Card>
        <CardTitle>Add a group</CardTitle>
        <form onSubmit={addGroup} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input placeholder="Group name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${inputClass} col-span-2`} />
          <input placeholder="Group URL" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} className={inputClass} />
          <select value={form.groupType} onChange={(e) => setForm((f) => ({ ...f, groupType: e.target.value }))} className={inputClass}>
            {GROUP_TYPES.map((t) => <option key={t} value={t}>{GROUP_TYPE_LABELS[t]}</option>)}
          </select>
          <Button type="submit" disabled={creating}>{creating ? "Adding..." : "Add group"}</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Groups</CardTitle>
        {groups.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">No groups saved yet for this market.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-silver/20">
            {groups.map((group) => (
              <Link key={group.id} href={`/leadgen/groups/${group.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-soft-blue/40">
                <div>
                  <p className="font-medium text-text-primary">{group.name}</p>
                  <p className="text-text-secondary">
                    {GROUP_TYPE_LABELS[group.groupType as GroupType] ?? group.groupType}
                    {group.memberCount ? ` -- ${group.memberCount.toLocaleString()} members` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${PRIORITY_STYLES[group.priority] ?? ""}`}>
                  {group.priority.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-text-secondary">
        Don&apos;t assume the biggest group is the best one -- {PRIORITIES.join(" / ")} should be set from actual results
        (see each group&apos;s performance) once you have a few posts in.
      </p>
    </div>
  );
}
