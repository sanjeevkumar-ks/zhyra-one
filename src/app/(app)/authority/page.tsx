import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, btnClass, Card, Page, PageHeader, SectionTitle, Stat, Table, Td, Th, trClass, Tip, Why } from "@/components/ui";
import { MiniLine, ProgressBar } from "@/components/charts";
import { getWorkspace } from "@/lib/queries";
import { aiSummary, authority } from "@/lib/mock-data";

export default async function AuthorityPage() {
  const w = await getWorkspace();
  if (w.mode === "simple") redirect("/settings?reveal=advanced");
  return (
    <Page>
      <PageHeader title="Authority Centre" description="Five separate dimensions of credibility. We deliberately don't combine them into one magic score — they measure different things." />

      <section className="mb-10">
        <SectionTitle title="1 · Domain strength" description="Third-party link-based estimates. Google does not use DR or DA as a ranking factor." />
        <div className="mb-4 flex flex-wrap divide-x divide-line rounded-2xl border border-line py-5 pl-5">
          <Stat label="Referring domains" value={authority.referringDomains.toLocaleString()} delta={authority.rdDelta} source="Illustrative · backlink provider" />
          <Stat label="New backlinks" value={authority.newBacklinks} sub="+18 this month" />
          <Stat label="Lost backlinks" value={authority.lostBacklinks} />
          <Stat label="Domain Rating" value="—" sub="Ahrefs · requires licensed integration" />
          <Stat label="Domain Authority" value="—" sub="Moz · requires licensed integration" />
        </div>
        <Card className="p-5"><MiniLine data={authority.backlinkTrend} x="m" lines={[{ key: "rd", name: "Referring domains" }]} height={200} /></Card>
      </section>

      <section className="mb-10">
        <SectionTitle title="2 · Topical authority" description="Depth and relevance of your coverage of each subject." />
        <Card className="space-y-4 p-5">
          {authority.topicCoverage.map((t) => (
            <div key={t.topic}><div className="mb-1 flex justify-between text-sm"><span>{t.topic}</span><span className="tabular-nums text-muted">{t.pct}%</span></div><ProgressBar pct={t.pct} /></div>
          ))}
          <Link href="/topic-groups" className={btnClass("outline", "sm")}>Open content pillars</Link>
        </Card>
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle title="3 · Brand authority" description="Recognition, trust and consistency outside your site." />
          <Card className="space-y-3 p-5 text-sm">
            <p><span className="font-medium">{authority.brand.unlinked}</span> brand mentions without a backlink <Link href="/ai-visibility/outside-sources" className="ml-2 font-medium underline underline-offset-4">Review</Link></p>
            <p>Reviews: {authority.brand.reviews}</p>
            <p>Business info: {authority.brand.nap}</p>
          </Card>
        </div>
        <div>
          <SectionTitle title="4 · AI authority" description="From the AI visibility monitoring sample." />
          <Card className="grid grid-cols-3 gap-3 p-5">
            <div><p className="text-sm font-medium text-muted">Citations</p><p className="mt-1 text-[30px] font-normal leading-tight text-fg">{aiSummary.citations}</p></div>
            <div><p className="text-sm font-medium text-muted">Mentions</p><p className="mt-1 text-[30px] font-normal leading-tight text-fg">{aiSummary.mentions}</p></div>
            <div><p className="text-sm font-medium text-muted">Cited pages</p><p className="mt-1 text-[30px] font-normal leading-tight text-fg">{aiSummary.citedPages}</p></div>
            <Link href="/ai-visibility/competitors" className="col-span-3 text-sm font-medium underline underline-offset-4">Compare with competitors</Link>
          </Card>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="5 · Authority-building recommendations" />
        <Table>
          <thead><tr><Th>Recommendation</Th><Th>Detail</Th><Th /><Th /></tr></thead>
          <tbody>{authority.recs.map((r) => <tr key={r.title} className={trClass}><Td className="font-medium">{r.title}</Td><Td>{r.detail}</Td><Td><Why impact="Medium" effort="Medium" confidence="Medium" goal="High" reason={r.detail} /></Td><Td><Link href={r.href} className={btnClass("outline", "sm")}>{r.action}</Link></Td></tr>)}</tbody>
        </Table>
      </section>

      <Tip text="If we offer a composite later it will be called the Visibility Authority Index with published components and weights."><Badge tone="outline">Why no single authority score?</Badge></Tip>
      <p className="caption mt-3">Illustrative metrics — not Google authority measurements.</p>
    </Page>
  );
}
