"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, btnClass, Card, intentTone, SectionTitle, Stat, Table, Td, Th, Tip, trClass, Term } from "@/components/ui";
import { Bars, MiniLine } from "@/components/charts";
import { Chip, Sheet } from "@/components/ui-client";
import { aiChecks, aiTrend, AI_PLATFORMS, type AICheck } from "@/lib/mock-data";

export function AIOverview() {
  const [platform, setPlatform] = useState<string>("All");
  const rows = useMemo(() => aiChecks.filter((c) => platform === "All" || c.platform === platform), [platform]);
  const mentions = rows.filter((r) => r.mention).length;
  const cites = rows.filter((r) => r.cited).length;
  const rate = rows.length ? Math.round((mentions / rows.length) * 100) : 0;
  const compCount: Record<string, number> = {};
  rows.forEach((r) => r.competitors.forEach((c) => (compCount[c] = (compCount[c] ?? 0) + 1)));
  const compTotal = Object.values(compCount).reduce((a, b) => a + b, 0) + mentions;
  const byPlatform = AI_PLATFORMS.map((p) => { const r = aiChecks.filter((c) => c.platform === p); return { platform: p, "Mention rate": r.length ? Math.round((r.filter((x) => x.mention).length / r.length) * 100) : 0, "Citation rate": r.length ? Math.round((r.filter((x) => x.cited).length / r.length) * 100) : 0 }; });
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">{["All", ...AI_PLATFORMS].map((p) => <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</Chip>)}</div>
      <div className="flex flex-wrap divide-x divide-line rounded-2xl border border-line py-5 pl-5">
        <Stat label={<Tip text="AI visibility rate = responses mentioning your brand ÷ valid monitored responses × 100. A platform-defined metric from a controlled sample, not a universal measure."><span className="cursor-help underline decoration-dotted underline-offset-4">AI visibility rate</span></Tip>} value={`${rate}%`} sub={`${mentions} of ${rows.length} responses`} />
        <Stat label={<Term t="Mention">Brand mentions</Term>} value={mentions} sub="Named in the answer" />
        <Stat label={<Term t="Citation">Domain citations</Term>} value={cites} sub="Your site linked as a source" />
        <Stat label="Cited pages" value={new Set(rows.filter((r) => r.citedUrl).map((r) => r.citedUrl)).size} />
        <Stat label="Your share of mentions" value={`${compTotal ? Math.round((mentions / compTotal) * 100) : 0}%`} sub="vs tracked competitors" />
        <Stat label="Monitored questions" value={rows.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><SectionTitle title="Mentions and citations over time" description="Weekly controlled checks" /><MiniLine data={aiTrend} x="week" lines={[{ key: "mentions", name: "Mentions" }, { key: "citations", name: "Citations", dashed: true, color: "var(--faint)" }]} /></Card>
        <Card className="p-5"><SectionTitle title="Visibility by platform" description="% of monitored responses" /><Bars data={byPlatform} x="platform" bars={[{ key: "Mention rate", name: "Mention rate", color: "var(--fg)" }, { key: "Citation rate", name: "Citation rate", color: "var(--faint)" }]} /></Card>
      </div>
      <p className="caption">Monitoring uses controlled queries through official APIs where available. Answers can differ from what individual users see, and Google AI Overviews has no official API, so it relies on a labelled SERP sample.</p>
    </div>
  );
}

const yes = <Badge tone="success"><Check size={12} /> Yes</Badge>;
const no = <Badge tone="outline"><Minus size={12} /> No</Badge>;

export function SearchesTable() {
  const [open, setOpen] = useState<AICheck | null>(null);
  const [filter, setFilter] = useState<"all" | "missing" | "mention" | "cited">("all");
  const rows = aiChecks.filter((c) => filter === "all" || (filter === "missing" ? !c.mention : filter === "mention" ? c.mention : c.cited));
  return (
    <>
      <div className="mb-3 flex gap-2">{([["all", "All"], ["mention", "Brand mentioned"], ["cited", "Site cited"], ["missing", "Not mentioned"]] as const).map(([id, l]) => <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{l}</Chip>)}</div>
      <Table>
        <thead><tr><Th>Search question</Th><Th>Topic</Th><Th><Term t="Intent">Intent</Term></Th><Th>Platform</Th><Th><Term t="Mention">Mention</Term></Th><Th><Term t="Citation">Citation</Term></Th><Th>Competitors</Th><Th>Last checked</Th><Th>Trend</Th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className={`${trClass} cursor-pointer`} onClick={() => setOpen(c)}>
              <Td className="max-w-md truncate font-medium">{c.question}</Td><Td>{c.topic}</Td><Td><Badge tone={intentTone(c.intent)}>{c.intent}</Badge></Td><Td>{c.platform}</Td>
              <Td>{c.mention ? yes : no}</Td><Td>{c.cited ? yes : no}</Td><Td className="max-w-[180px] truncate text-muted">{c.competitors.join(", ") || "—"}</Td><Td className="whitespace-nowrap text-muted">{c.lastChecked}</Td>
              <Td>{c.trend === "up" ? <TrendingUp size={16} className="text-success" aria-label="Improving" /> : c.trend === "down" ? <TrendingDown size={16} className="text-danger" aria-label="Declining" /> : <Minus size={16} className="text-faint" aria-label="Flat" />}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.question ?? ""} subtitle={open ? `${open.platform} · checked ${open.lastChecked} · ${open.intent}` : ""} width={560}
        footer={open && <Link href={`/articles/new?keyword=${encodeURIComponent(open.question)}`} className={btnClass("primary")}>Create content for this question</Link>}>
        {open && (
          <div className="space-y-6 text-sm">
            <section>
              <p className="mb-1 text-sm font-medium text-muted">Answer snapshot · {open.platform} · {open.lastChecked}</p>
              <p className="rounded-xl bg-subtle p-3 italic leading-relaxed">{open.snippet}</p>
              <p className="caption mt-1">Snapshot from a controlled check. AI answers change; compare over time rather than treating one answer as permanent.</p>
            </section>
            <section className="grid grid-cols-2 gap-3">
              <div><p className="text-sm font-medium text-muted">Brand mention</p><p className="mt-1">{open.mention ? <>{yes} <span className="caption">position {open.position}</span></> : no}</p></div>
              <div><p className="text-sm font-medium text-muted">Website citation</p><p className="mt-1">{open.cited ? yes : no}</p></div>
            </section>
            {open.citedUrl && <section><p className="mb-1 text-sm font-medium text-muted">Cited URL</p><p className="mono">{open.citedUrl}</p></section>}
            <section><p className="mb-1 text-sm font-medium text-muted">Competitors mentioned</p><div className="flex flex-wrap gap-1.5">{open.competitors.length ? open.competitors.map((c) => <Badge key={c}>{c}</Badge>) : <span className="text-muted">None</span>}</div></section>
            <section><p className="mb-1 text-sm font-medium text-muted">Other cited sources</p><div className="flex flex-wrap gap-1.5">{open.sources.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}</div></section>
            <section>
              <p className="mb-2 text-sm font-medium text-muted">History</p>
              <ol className="space-y-2 border-l border-line pl-4 text-sm">{["4 weeks ago: not mentioned", "2 weeks ago: " + (open.mention ? "mentioned, not cited" : "not mentioned"), `Latest: ${open.mention ? (open.cited ? "mentioned and cited" : "mentioned") : "not mentioned"}`].map((h) => <li key={h}>{h}</li>)}</ol>
            </section>
            <section>
              <p className="mb-1 text-sm font-medium text-muted">Recommended content improvements</p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">{open.mention ? ["Strengthen the cited page with a direct answer in the first paragraph", "Add primary-source references"] : ["Publish a page that answers this question directly", "Add a short comparison table and FAQ with verified answers", "Earn mentions on sources AI platforms already cite"]}</ul>
            </section>
          </div>
        )}
      </Sheet>
    </>
  );
}
