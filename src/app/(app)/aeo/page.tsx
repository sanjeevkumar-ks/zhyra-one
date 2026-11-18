import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, btnClass, Dot, Page, PageHeader, SampleChip, SectionTitle, Table, Td, Th, trClass, Term } from "@/components/ui";
import { getWorkspace } from "@/lib/queries";
import { aeoQuestions, answerLibrary, schemaChecks } from "@/lib/mock-data";

export default async function AeoPage() {
  const w = await getWorkspace();
  if (w.mode === "simple") redirect("/settings?reveal=advanced");
  return (
    <Page>
      <PageHeader title="Answer optimisation (AEO)" description="Answer real customer questions clearly. This isn't an FAQ generator — a page should exist because someone genuinely needs the answer." actions={<SampleChip />} />

      <section className="mb-10">
        <SectionTitle title="Question discovery & answer opportunities" description="From People Also Ask, related searches, AI monitoring, your site search and communities." />
        <Table>
          <thead><tr><Th>Question</Th><Th>Found in</Th><Th>Status</Th><Th>Current page</Th><Th /></tr></thead>
          <tbody>{aeoQuestions.map((q) => <tr key={q.q} className={trClass}><Td className="font-medium">{q.q}</Td><Td><Badge>{q.source}</Badge></Td><Td><Badge tone={q.status === "No answer" ? "danger" : "warning"}>{q.status}</Badge></Td><Td className="mono">{q.page || "—"}</Td><Td><Link className={btnClass("outline", "sm")} href={q.page ? "/past-content" : `/articles/new?keyword=${encodeURIComponent(q.q)}`}>{q.page ? "Improve article" : "Create content"}</Link></Td></tr>)}</tbody>
        </Table>
      </section>

      <section className="mb-10">
        <SectionTitle title="Answer library" description="Approved, verified answers reused across pages. Unreviewed answers are flagged." />
        <Table>
          <thead><tr><Th>Question</Th><Th>Approved answer</Th><Th>Evidence</Th><Th>Sources</Th><Th>Related page</Th><Th>Last reviewed</Th></tr></thead>
          <tbody>{answerLibrary.map((a) => <tr key={a.q} className={trClass}><Td className="font-medium">{a.q}</Td><Td className="max-w-md whitespace-normal py-2 leading-5">{a.a.startsWith("[") ? <span className="text-warning-fg">{a.a}</span> : a.a}</Td><Td>{a.evidence}</Td><Td>{a.sources}</Td><Td className="mono">{a.page}</Td><Td>{a.reviewed === "Overdue" ? <Badge tone="danger">Overdue</Badge> : a.reviewed}</Td></tr>)}</tbody>
        </Table>
      </section>

      <section>
        <SectionTitle title="Structured data checks" description={<>Checks for <Term t="Schema">schema</Term> types that fit your content.</>} />
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {schemaChecks.map((s) => (
            <li key={s.type} className="flex items-center gap-3 px-5 py-3 text-sm"><Dot tone={s.state === "pass" ? "success" : s.state === "attention" ? "warning" : "neutral"} /><span className="w-36 font-medium">{s.type}</span><span className="flex-1 text-muted">{s.detail}</span><Badge tone={s.state === "pass" ? "success" : s.state === "attention" ? "warning" : "outline"}>{s.state === "pass" ? "Passed" : s.state === "attention" ? "Needs attention" : "Not applicable"}</Badge></li>
          ))}
        </ul>
        <p className="caption mt-3">Adding schema does not guarantee enhanced search features. Eligibility and display are decided by each search engine.</p>
      </section>
    </Page>
  );
}
