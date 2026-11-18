"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, LayoutDashboard, Share2, MessagesSquare } from "lucide-react";
import { Badge, Button, Card, PageTabs, SectionTitle, Table, Td, Th, trClass, Unavailable, AIAction } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { capabilities, linkedinVariants, redditThreads, subreddits } from "@/lib/mock-data";

type Tab = "dashboard" | "linkedin" | "reddit";

export function SocialView({ connected, articles }: { connected: { linkedin: boolean; reddit: boolean }; articles: { id: number; title: string }[] }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [article, setArticle] = useState(articles[0]?.id ?? 0);
  const [generated, setGenerated] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [scheduled, setScheduled] = useState<string[]>([]);
  const title = articles.find((a) => a.id === article)?.title ?? "";
  const variants = useMemo(() => linkedinVariants(title), [title]);
  const tone = (s: string) => (s === "available" ? "success" : s === "needs-approval" ? "warning" : "outline") as "success" | "warning" | "outline";

  return (
    <div className="space-y-6">
      <PageTabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "linkedin", label: "LinkedIn", icon: Share2 },
          { id: "reddit", label: "Reddit", icon: MessagesSquare },
        ]}
        ariaLabel="Social channels navigation"
      />

      {tab === "dashboard" && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            {(["LinkedIn", "Reddit"] as const).map((n) => {
              const on = n === "LinkedIn" ? connected.linkedin : connected.reddit;
              return (
                <Card key={n} className="p-5">
                  <div className="mb-3 flex items-center justify-between"><p className="h3">{n}</p>{on ? <Badge tone="success">Connected</Badge> : <Badge tone="outline">Not connected</Badge>}</div>
                  <p className="caption mb-2">Capability matrix — real status depends on API access, app review and account type.</p>
                  <ul className="space-y-1.5">{Object.entries(capabilities[n]).map(([cap, s]) => <li key={cap} className="flex justify-between text-sm"><span>{cap}</span><Badge tone={tone(s)}>{s === "available" ? "Available" : s === "needs-approval" ? "Needs approval" : "Not supported"}</Badge></li>)}</ul>
                  {!on && <div className="mt-4"><Link href="/integrations" className="text-sm font-medium underline underline-offset-4">Connect {n}</Link></div>}
                </Card>
              );
            })}
          </div>
          <div>
            <SectionTitle title="Distribution performance" />
            {connected.linkedin || connected.reddit ? <p className="text-sm text-muted">Engagement and referral data appears here once analytics scopes are approved.</p> : <Unavailable source="LinkedIn or Reddit" />}
          </div>
          <div><SectionTitle title="Scheduled posts" />{scheduled.length ? <ul className="divide-y divide-line rounded-2xl border border-line">{scheduled.map((s) => <li key={s} className="px-5 py-3 text-sm">{s} · LinkedIn</li>)}</ul> : <p className="text-sm text-muted">No scheduled posts yet. Generate variants from a published article in the LinkedIn tab.</p>}</div>
        </div>
      )}

      {tab === "linkedin" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <select className="field !w-auto max-w-md" aria-label="Source article" value={article} onChange={(e) => { setArticle(Number(e.target.value)); setGenerated(false); }}>{articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
            <AIAction onClick={() => setGenerated(true)}>Generate 5 variants</AIAction>
          </div>
          {!connected.linkedin && <p className="rounded-xl bg-warning-bg p-3 text-sm text-warning-fg">LinkedIn isn&apos;t connected — you can draft now and publish after connecting.</p>}
          {generated && (
            <div className="grid gap-4 md:grid-cols-2">
              {variants.map((v) => {
                const text = drafts[v.kind] ?? v.text;
                return (
                  <Card key={v.kind} className="p-4">
                    <div className="mb-2 flex items-center justify-between"><Badge>{v.kind}</Badge><Link href={`/articles/${article}`} className="caption underline underline-offset-4">Linked to article</Link></div>
                    <textarea className="field" rows={6} value={text} onChange={(e) => setDrafts({ ...drafts, [v.kind]: e.target.value })} aria-label={`${v.kind} post`} />
                    <div className="mt-3 flex gap-2"><Button size="sm" disabled={!connected.linkedin} onClick={() => { setScheduled([...scheduled, v.kind]); toast("Scheduled on LinkedIn"); }}>Schedule</Button><Button size="sm" variant="outline" onClick={() => { void navigator.clipboard?.writeText(text); toast("Copied"); }}>Copy</Button></div>
                  </Card>
                );
              })}
            </div>
          )}
          <p className="caption">Review the placeholders in brackets — never post invented stories, stats or testimonials.</p>
        </div>
      )}

      {tab === "reddit" && (
        <div className="space-y-8">
          <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning-bg p-4 text-sm text-warning-fg"><AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <p><span className="font-medium">Monitoring and draft-assist only.</span> We never auto-post to Reddit. Follow each subreddit&apos;s rules and Reddit&apos;s policies, disclose any affiliation, and only contribute genuinely helpful replies.</p></div>
          <div><SectionTitle title="Subreddit discovery" /><div className="grid gap-3 md:grid-cols-3">{subreddits.map((s) => <Card key={s.name} className="p-4"><p className="text-sm font-medium">{s.name}</p><p className="caption">Size: {s.members}</p><Badge tone={s.fit === "High" ? "success" : "warning"} className="mt-2">{s.fit} fit</Badge></Card>)}</div></div>
          <div>
            <SectionTitle title="Relevant threads & brand mentions" />
            <Table>
              <thead><tr><Th>Thread</Th><Th>Subreddit</Th><Th>Age</Th><Th>Relevance</Th><Th>Community rule</Th><Th /></tr></thead>
              <tbody>{redditThreads.map((t) => <tr key={t.title} className={trClass}><Td className="max-w-sm truncate font-medium">{t.title}</Td><Td>{t.sub}</Td><Td>{t.age}</Td><Td><Badge tone={t.relevance === "High" ? "success" : "neutral"}>{t.relevance}</Badge></Td><Td className="text-muted">{t.rules}</Td><Td><Button size="sm" variant="outline" onClick={() => toast("Draft prepared — copy it and post manually")}>Draft helpful reply</Button></Td></tr>)}</tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
