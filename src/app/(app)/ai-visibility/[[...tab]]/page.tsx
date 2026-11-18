import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, btnClass, Card, Estimate, Page, PageHeader, SampleChip, Table, Tabs, Td, Th, trClass, Tip, Term } from "@/components/ui";
import { Bars } from "@/components/charts";
import { AIOverview, SearchesTable } from "@/components/ai-visibility-client";
import { aiChecks, aiCompetitors, aiSources, aiTopics, outsideSources } from "@/lib/mock-data";

const TABS = [
  { id: "overview", label: "Overview", href: "/ai-visibility" }, { id: "searches", label: "Searches", href: "/ai-visibility/searches" }, { id: "topics", label: "Topics", href: "/ai-visibility/topics" },
  { id: "competitors", label: "Competitors", href: "/ai-visibility/competitors" }, { id: "sources", label: "Sources", href: "/ai-visibility/sources" }, { id: "outside-sources", label: "Outside sources", href: "/ai-visibility/outside-sources" },
  { id: "opportunities", label: "Opportunities", href: "/ai-visibility/opportunities" },
];

export default async function AIVisibilityPage({ params }: { params: Promise<{ tab?: string[] }> }) {
  const { tab: t } = await params;
  const tab = t?.[0] ?? "overview";
  if (!TABS.some((x) => x.id === tab) || (t && t.length > 1)) notFound();
  const missing = aiChecks.filter((c) => !c.mention);
  return (
    <Page wide>
      <PageHeader title={<span className="flex items-center gap-3">AI visibility <Badge tone="outline">Beta</Badge></span>} description="How often your brand is mentioned and your site is cited in AI answers, measured on a controlled set of questions." actions={<SampleChip />} />
      <Tabs items={TABS} active={tab} />

      {tab === "overview" && <AIOverview />}
      {tab === "searches" && <SearchesTable />}
      {tab === "topics" && (
        <Table>
          <thead><tr><Th>Topic</Th><Th>Questions</Th><Th>Mention rate</Th><Th>Citation rate</Th><Th>Top cited page</Th><Th>Competitor presence</Th><Th>Missing questions</Th></tr></thead>
          <tbody>{aiTopics.map((x) => <tr key={x.topic} className={trClass}><Td className="font-medium">{x.topic}</Td><Td>{x.questions}</Td><Td>{x.mention}%</Td><Td>{x.citation}%</Td><Td className="mono">{x.topPage}</Td><Td className="text-muted">{x.competitors.join(", ")}</Td><Td>{x.missing}</Td></tr>)}</tbody>
        </Table>
      )}
      {tab === "competitors" && (
        <div className="space-y-6">
          <Card className="p-5">
            <p className="h3 mb-1">Mention vs citation share</p>
            <p className="caption mb-3">A model can mention a company without linking to its website — the two are shown separately.</p>
            <Bars layout="vertical" stacked height={320} data={aiCompetitors.map((c) => ({ brand: c.brand, "Cited (with link)": c.citation, "Mentioned only": Math.max(0, c.mention - c.citation) }))} x="brand" bars={[{ key: "Cited (with link)", name: "Cited (with link)", color: "var(--fg)" }, { key: "Mentioned only", name: "Mentioned only", color: "var(--border-strong)" }]} />
          </Card>
          <Table>
            <thead><tr><Th>Brand</Th><Th>Mention share</Th><Th>Citation share</Th><Th>Platforms where they appear</Th></tr></thead>
            <tbody>{aiCompetitors.map((c) => <tr key={c.brand} className={trClass}><Td className="font-medium">{c.brand} {c.you && <Badge tone="outline">You</Badge>}</Td><Td>{c.mention}%</Td><Td>{c.citation}%</Td><Td>{c.platforms.join(", ")}</Td></tr>)}</tbody>
          </Table>
        </div>
      )}
      {tab === "sources" && (
        <>
          <p className="mb-3 text-sm text-muted">Websites and publications that repeatedly appear in AI answers for your monitored questions.</p>
          <Table>
            <thead><tr><Th>Source domain</Th><Th>Appearances</Th><Th>Questions</Th><Th>Brands mentioned</Th><Th>Type</Th><Th>Opportunity</Th></tr></thead>
            <tbody>{aiSources.map((s) => <tr key={s.domain} className={trClass}><Td className="font-medium">{s.domain}</Td><Td>{s.appearances}</Td><Td>{s.questions}</Td><Td className="text-muted">{s.brands.join(", ")}</Td><Td><Badge>{s.type}</Badge></Td><Td>{s.opportunity}</Td></tr>)}</tbody>
          </Table>
        </>
      )}
      {tab === "outside-sources" && (
        <>
          <p className="mb-3 text-sm text-muted">Third-party websites discussing your brand. Sentiment is <Tip text="Estimated by AI from the surrounding text. Review the source before acting."><span className="underline decoration-dotted underline-offset-4">AI-estimated</span></Tip>.</p>
          <Table>
            <thead><tr><Th>Source</Th><Th>Type</Th><Th>Mention context</Th><Th>Sentiment (AI-estimated)</Th><Th>Backlink</Th><Th>AI citations</Th><Th>Date</Th><Th>Credibility</Th></tr></thead>
            <tbody>{outsideSources.map((s) => <tr key={s.domain} className={trClass}><Td className="font-medium">{s.domain}</Td><Td>{s.type}</Td><Td className="max-w-xs">{s.context}</Td><Td><Badge tone={s.sentiment === "Positive" ? "success" : s.sentiment === "Mixed" ? "warning" : "neutral"}>{s.sentiment}</Badge></Td><Td>{s.backlink ? <Badge tone="success">Linked</Badge> : <Badge tone="warning">Unlinked mention</Badge>}</Td><Td>{s.citations}</Td><Td className="whitespace-nowrap text-muted">{s.date}</Td><Td>{s.credibility}</Td></tr>)}</tbody>
          </Table>
        </>
      )}
      {tab === "opportunities" && (
        <>
          <p className="mb-3 text-sm text-muted">Questions where your brand isn&apos;t mentioned. Create genuinely helpful answers — we don&apos;t promise AI citations.</p>
          <Table>
            <thead><tr><Th>Question</Th><Th>Platform</Th><Th>Competitors present</Th><Th>Why it matters</Th><Th /></tr></thead>
            <tbody>{missing.slice(0, 12).map((c) => <tr key={c.id} className={trClass}><Td className="max-w-md truncate">{c.question}</Td><Td>{c.platform}</Td><Td className="text-muted">{c.competitors.join(", ") || "—"}</Td><Td className="text-muted">{c.competitors.length ? "Competitors are named instead" : "No clear leader — room to be the answer"}</Td><Td><Link className={btnClass("outline", "sm")} href={`/articles/new?keyword=${encodeURIComponent(c.question)}`}>Create content</Link></Td></tr>)}</tbody>
          </Table>
          <p className="caption mt-3">Search volume for these questions is <Estimate>not available</Estimate> from AI platforms; prioritise by relevance to your <Term t="Intent">intent</Term>.</p>
        </>
      )}
    </Page>
  );
}
