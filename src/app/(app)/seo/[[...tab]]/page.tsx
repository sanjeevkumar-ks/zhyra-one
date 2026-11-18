import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Badge, Card, intentTone, Page, PageHeader, SampleChip, SectionTitle, Stat, Table, Tabs, Td, Th, trClass, Unavailable, Estimate } from "@/components/ui";
import { Bars, SearchChart, Spark } from "@/components/charts";
import { AuditList } from "@/components/audit-list";
import { AuditView } from "@/components/audit/audit-view";
import { PagesTable } from "@/components/pages-table";
import { getKeywords, getWorkspace } from "@/lib/queries";
import { getCurrentAudit, getAuditHistory, getAuditSchedule } from "@/lib/services/audit-service";
import { auditIssues, authority, backlinks, countries, devices, pageRows, rankDistribution, rankRows, searchSeries, spark } from "@/lib/mock-data";

const TABS = [
  { id: "overview", label: "Overview", href: "/seo" }, { id: "keywords", label: "Keywords", href: "/seo/keywords" }, { id: "rankings", label: "Rankings", href: "/seo/rankings" },
  { id: "pages", label: "Pages", href: "/seo/pages" }, { id: "audit", label: "Technical audit", href: "/seo/audit" }, { id: "backlinks", label: "Backlinks", href: "/seo/backlinks" },
];

export default async function SeoPage({ params }: { params: Promise<{ tab?: string[] }> }) {
  const { tab: t } = await params;
  const tab = t?.[0] ?? "overview";
  if (!TABS.some((x) => x.id === tab) || (t && t.length > 1)) notFound();
  const w = await getWorkspace();
  const gsc = w.integrations.gsc;
  const series = searchSeries(28);
  const clicks = series.reduce((n, p) => n + p.clicks, 0);
  const imps = series.reduce((n, p) => n + p.impressions, 0);

  return (
    <Page wide>
      <PageHeader title="SEO" description="Search visibility and website health from Google Search Console." actions={<SampleChip />} />
      <Tabs items={TABS} active={tab} />

      {tab === "overview" && (
        <div className="space-y-8">
          {gsc ? (
            <>
              <div className="flex flex-wrap divide-x divide-line rounded-2xl border border-line py-5 pl-5">
                <Stat label="Organic clicks" value={clicks.toLocaleString()} delta={18.6} source="Google Search Console"><Spark data={spark("c")} /></Stat>
                <Stat label="Impressions" value={`${(imps / 1000).toFixed(0)}K`} delta={11.2} source="Google Search Console"><Spark data={spark("i")} /></Stat>
                <Stat label="Average CTR" value="4.7%" delta={0.4} source="Google Search Console"><Spark data={spark("ctr")} /></Stat>
                <Stat label="Average position" value="11.9" sub="Lower is better" source="Google Search Console"><Spark data={spark("p", false)} up={false} /></Stat>
                <Stat label="Indexed pages" value="212" sub="2 not indexed" source="Search Console coverage" />
              </div>
              <Card className="p-5"><SearchChart data={series} /><p className="caption mt-3">Search Console may not return every underlying query, so totals are indicative rather than a complete keyword database.</p></Card>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-5"><SectionTitle title="Clicks by country" /><Bars layout="vertical" data={countries} x="name" bars={[{ key: "clicks", name: "Clicks", color: "var(--fg)" }]} height={220} /></Card>
                <Card className="p-5"><SectionTitle title="Device split" /><Bars data={devices} x="name" bars={[{ key: "value", name: "Share %", color: "var(--fg)" }]} height={220} /></Card>
                <Card className="p-5"><SectionTitle title="Ranking distribution" /><Bars data={rankDistribution} x="bucket" bars={[{ key: "count", name: "Keywords", color: "var(--fg)" }]} height={220} /></Card>
              </div>
            </>
          ) : <Unavailable source="Google Search Console" />}
          <div>
            <SectionTitle title="Organic sessions" description="GA4 sessions are a different measurement from Search Console clicks and are never added together." />
            {w.integrations.ga4 ? <Card className="p-5"><p className="text-[36px] font-normal leading-tight text-fg">18,240</p><p className="mt-1 text-sm text-muted">Organic sessions · Google Analytics 4</p></Card> : <Unavailable source="Google Analytics 4" compact />}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div><SectionTitle title="Top-performing pages" /><Table><thead><tr><Th>Page</Th><Th>Clicks</Th></tr></thead><tbody>{[...pageRows].sort((a, b) => b.clicks - a.clicks).slice(0, 5).map((p) => <tr key={p.url} className={trClass}><Td className="mono truncate">{p.url}</Td><Td>{p.clicks.toLocaleString()}</Td></tr>)}</tbody></Table></div>
            <div><SectionTitle title="Declining pages" /><Table><thead><tr><Th>Page</Th><Th>Change</Th><Th /></tr></thead><tbody>{[...pageRows].sort((a, b) => a.delta - b.delta).slice(0, 5).map((p) => <tr key={p.url} className={trClass}><Td className="mono truncate">{p.url}</Td><Td><Badge tone="danger">{p.delta}%</Badge></Td><Td><Link href="/past-content" className="text-sm font-medium underline underline-offset-4">Refresh</Link></Td></tr>)}</tbody></Table></div>
          </div>
        </div>
      )}

      {tab === "keywords" && <KeywordsTab />}
      {tab === "rankings" && (
        <>
          <p className="mb-3 text-sm text-muted">Positions in this view come from a rank-tracking sample. Search Console&apos;s average position is a different measure and isn&apos;t interchangeable.</p>
          <Table>
            <thead><tr><Th>Keyword</Th><Th>Position</Th><Th>Change</Th><Th>Trend</Th><Th>Ranking URL</Th><Th>Location</Th><Th>Device</Th><Th>Intent</Th><Th>SERP features</Th></tr></thead>
            <tbody>
              {rankRows.map((r) => {
                const d = r.previous - r.position;
                return (
                  <tr key={r.keyword} className={trClass}>
                    <Td className="font-medium">{r.keyword}</Td><Td className="tabular-nums">{r.position}</Td>
                    <Td><span className={`inline-flex items-center gap-0.5 ${d > 0 ? "text-success-fg" : d < 0 ? "text-danger-fg" : "text-muted"}`}>{d > 0 ? <ArrowUp size={12} /> : d < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}{Math.abs(d)}</span></Td>
                    <Td className="w-24"><Spark data={r.trend} up={d >= 0} /></Td><Td className="mono max-w-[200px] truncate">{r.url}</Td><Td>{r.location}</Td><Td>{r.device}</Td><Td><Badge tone={intentTone(r.intent)}>{r.intent}</Badge></Td>
                    <Td>{r.features.map((f) => <Badge key={f} tone="outline">{f}</Badge>)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      )}
      {tab === "pages" && (gsc ? <PagesTable rows={pageRows} ga4={w.integrations.ga4} /> : <Unavailable source="Google Search Console" />)}
      {tab === "audit" && (
        <AuditView
          initialAudit={getCurrentAudit()}
          initialHistory={getAuditHistory()}
          initialSchedule={getAuditSchedule()}
          websiteUrl={w.website ? `https://${w.website}` : "https://verdantbotanics.com"}
          simple={w.mode === "simple"}
        />
      )}
      {tab === "backlinks" && (
        <>
          <div className="mb-6 flex flex-wrap divide-x divide-line rounded-2xl border border-line py-5 pl-5">
            <Stat label="Referring domains" value={authority.referringDomains.toLocaleString()} delta={authority.rdDelta} source="Illustrative · backlink provider" />
            <Stat label="New backlinks" value={authority.newBacklinks} sub="this month" />
            <Stat label="Lost backlinks" value={authority.lostBacklinks} sub="this month" />
          </div>
          <Table>
            <thead><tr><Th>Linking domain</Th><Th>Your page</Th><Th>Anchor</Th><Th>Status</Th><Th>Relevance</Th></tr></thead>
            <tbody>{backlinks.map((b) => <tr key={b.domain + b.url} className={trClass}><Td>{b.domain}</Td><Td className="mono">{b.url}</Td><Td>{b.anchor}</Td><Td><Badge tone={b.status === "New" ? "success" : b.status === "Active" ? "neutral" : "danger"}>{b.status}</Badge></Td><Td>{b.relevance}</Td></tr>)}</tbody>
          </Table>
          <p className="caption mt-3">Backlink data requires a licensed provider. Values shown are sample data.</p>
        </>
      )}
    </Page>
  );
}

async function KeywordsTab() {
  const kws = (await getKeywords()).filter((k) => k.tracked);
  return (
    <Table>
      <thead><tr><Th>Tracked keyword</Th><Th>Position</Th><Th>Volume</Th><Th>Intent</Th><Th>Target URL</Th></tr></thead>
      <tbody>{kws.map((k) => <tr key={k.id} className={trClass}><Td className="font-medium">{k.keyword}</Td><Td>{k.position ?? "—"}</Td><Td><Estimate>{k.volume.toLocaleString()}</Estimate></Td><Td><Badge tone={intentTone(k.intent)}>{k.intent}</Badge></Td><Td className="mono">{k.targetUrl || "—"}</Td></tr>)}</tbody>
    </Table>
  );
}
