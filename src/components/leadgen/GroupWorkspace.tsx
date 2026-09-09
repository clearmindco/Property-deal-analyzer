"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { generatePostCopy, computeGroupPerformance } from "@/lib/leadgen";
import { GROUP_TYPE_LABELS, POST_TYPE_LABELS, type GroupType, type PostType } from "@/lib/types/leadgen";

interface Post {
  id: string;
  postType: string;
  copy: string;
  status: string;
  postedAt: string | null;
  responseOutcome: string | null;
  leadId: string | null;
  createdAt: string;
}

interface Group {
  id: string;
  marketId: string;
  market: { id: string; name: string };
  name: string;
  url: string | null;
  groupType: string;
  memberCount: number | null;
  activityLevel: string | null;
  sellerPotential: string | null;
  investorSaturation: string | null;
  postingRules: string | null;
  promotionAllowed: boolean | null;
  realEstateAllowed: boolean | null;
  priority: string;
  notes: string | null;
  lastPostDate: string | null;
  posts: Post[];
}

interface LeadSummary {
  id: string;
  status: string;
}

const STAGE_ORDER = ["NEW", "TALKING", "QUALIFIED", "CALL_SCHEDULED", "ANALYZING", "OFFER", "FOLLOW_UP", "UNDER_CONTRACT", "CLOSED"];

function reachedStage(status: string, stage: string): boolean {
  if (status === "DEAD") return false;
  return STAGE_ORDER.indexOf(status) >= STAGE_ORDER.indexOf(stage);
}

const POST_TYPES = Object.keys(POST_TYPE_LABELS) as PostType[];

export function GroupWorkspace({ group: initialGroup, leads }: { group: Group; leads: LeadSummary[] }) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);
  const [posts, setPosts] = useState<Post[]>(initialGroup.posts);
  const [postType, setPostType] = useState<PostType>("general_seller");
  const [draftCopy, setDraftCopy] = useState<string | null>(null);
  const [shownThisSession, setShownThisSession] = useState<string[]>([]);
  const [pendingPost, setPendingPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);

  const performance = useMemo(() => {
    const postedCount = posts.filter((p) => p.status === "POSTED").length;
    const responses = posts.filter((p) => p.responseOutcome && p.responseOutcome !== "NONE").length;
    return computeGroupPerformance({
      posts: postedCount,
      responses,
      leads: leads.length,
      qualifiedLeads: leads.filter((l) => reachedStage(l.status, "QUALIFIED")).length,
      calls: leads.filter((l) => reachedStage(l.status, "CALL_SCHEDULED")).length,
      offers: leads.filter((l) => reachedStage(l.status, "OFFER")).length,
      contracts: leads.filter((l) => reachedStage(l.status, "UNDER_CONTRACT")).length,
      closedDeals: leads.filter((l) => l.status === "CLOSED").length,
    });
  }, [posts, leads]);

  function generate() {
    const previousCopies = [...posts.map((p) => p.copy), ...shownThisSession];
    const copy = generatePostCopy({
      postType,
      groupType: group.groupType as GroupType,
      marketName: group.market.name,
      previousCopies,
    });
    setDraftCopy(copy);
    setShownThisSession((s) => [...s, copy]);
  }

  async function markPosted() {
    if (!draftCopy) return;
    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, postType, copy: draftCopy, status: "POSTED" }),
    });
    setSaving(false);
    if (res.ok) {
      const post = await res.json();
      setPosts((p) => [post, ...p]);
      setPendingPost(post);
      setDraftCopy(null);
      setGroup((g) => ({ ...g, lastPostDate: post.postedAt }));
    }
  }

  async function recordResponse(outcome: "NONE" | "COMMENT" | "DIRECT_MESSAGE" | "SELLER_LEAD") {
    if (!pendingPost) return;
    if (outcome === "SELLER_LEAD") {
      const leadRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerName: "New seller lead",
          marketId: group.marketId,
          groupId: group.id,
          sourcePostId: pendingPost.id,
        }),
      });
      if (leadRes.ok) {
        const lead = await leadRes.json();
        await fetch(`/api/posts/${pendingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responseOutcome: "SELLER_LEAD", leadId: lead.id }),
        });
        router.push(`/leads/${lead.id}`);
        return;
      }
    } else {
      await fetch(`/api/posts/${pendingPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseOutcome: outcome }),
      });
      setPosts((p) => p.map((x) => (x.id === pendingPost.id ? { ...x, responseOutcome: outcome } : x)));
    }
    setPendingPost(null);
  }

  const copyToClipboard = () => {
    if (draftCopy) navigator.clipboard.writeText(draftCopy).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/leadgen/markets/${group.marketId}`} className="text-sm text-primary-blue">&larr; {group.market.name}</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">{group.name}</h1>
          <span className="rounded-full bg-soft-blue px-3 py-1 text-xs font-medium text-navy">{group.priority.replace("_", " ")}</span>
        </div>
      </div>

      {!pendingPost && (
        <Card>
          <CardTitle>Today&apos;s post</CardTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={postType} onChange={(e) => setPostType(e.target.value as PostType)} className="rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm">
              {POST_TYPES.map((t) => <option key={t} value={t}>{POST_TYPE_LABELS[t]}</option>)}
            </select>
            <Button onClick={generate}>{draftCopy ? "Generate another" : "Generate post"}</Button>
            {draftCopy && (
              <button onClick={() => setDraftCopy(null)} className="text-sm text-text-secondary">Skip today</button>
            )}
          </div>

          {draftCopy && (
            <div className="mt-4">
              <div className="rounded-card border border-silver/40 bg-soft-blue p-4 text-sm text-navy">{draftCopy}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={copyToClipboard}>Copy post</Button>
                {group.url && (
                  <a href={group.url} target="_blank" rel="noreferrer">
                    <Button variant="secondary">Open group</Button>
                  </a>
                )}
                <Button onClick={markPosted} disabled={saving}>{saving ? "Saving..." : "Mark as posted"}</Button>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                This app never posts on your behalf -- copy the text, paste it into the group yourself, then come back and mark it posted.
              </p>
            </div>
          )}
        </Card>
      )}

      {pendingPost && (
        <Card className="border-primary-blue/50 bg-soft-blue">
          <CardTitle>Did anyone respond?</CardTitle>
          <p className="mt-1 text-sm text-navy">Posted just now. Check back after a bit, then let us know what happened.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => recordResponse("NONE")}>No responses yet</Button>
            <Button variant="secondary" onClick={() => recordResponse("COMMENT")}>Comment</Button>
            <Button variant="secondary" onClick={() => recordResponse("DIRECT_MESSAGE")}>Direct message</Button>
            <Button onClick={() => recordResponse("SELLER_LEAD")}>Seller lead</Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>
          Performance
          <InfoTooltip text="Computed from every post and lead tied to this group -- decides whether to keep posting here, not the group's size." />
        </CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>Posts<br /><strong>{performance.posts}</strong></div>
          <div>Responses<br /><strong>{performance.responses}</strong></div>
          <div>Seller leads<br /><strong>{performance.leads}</strong></div>
          <div>Qualified leads<br /><strong>{performance.qualifiedLeads}</strong></div>
          <div>Calls<br /><strong>{performance.calls}</strong></div>
          <div>Offers<br /><strong>{performance.offers}</strong></div>
          <div>Contracts<br /><strong>{performance.contracts}</strong></div>
          <div>Closed deals<br /><strong>{performance.closedDeals}</strong></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-card bg-soft-blue p-4 text-sm sm:grid-cols-4">
          <div>Response / post<br /><strong>{(performance.responsePerPost * 100).toFixed(0)}%</strong></div>
          <div>Lead / post<br /><strong>{(performance.leadPerPost * 100).toFixed(0)}%</strong></div>
          <div>Qualified rate<br /><strong>{(performance.qualifiedLeadRate * 100).toFixed(0)}%</strong></div>
          <div>Offer rate<br /><strong>{(performance.offerRate * 100).toFixed(0)}%</strong></div>
        </div>
        <p className="mt-3 text-sm font-semibold text-navy">Recommendation: {performance.recommendation}</p>
      </Card>

      <Card>
        <CardTitle>Post history</CardTitle>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Nothing posted here yet.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-silver/20">
            {posts.map((p) => (
              <div key={p.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{POST_TYPE_LABELS[p.postType as PostType] ?? p.postType}</span>
                  <span className="text-text-secondary">{p.postedAt ? new Date(p.postedAt).toLocaleDateString() : p.status}</span>
                </div>
                <p className="mt-1 text-text-secondary">{p.copy}</p>
                {p.responseOutcome && <p className="mt-1 text-xs text-primary-blue">Response: {p.responseOutcome.replace("_", " ")}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
