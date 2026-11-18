"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Avatar, Badge, Button, btnClass, EmptyState, PageTabs, statusTone, Table, Td, Th, Tip, trClass, Disclaimer } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { importFromWebsite } from "@/app/actions";

interface Row { id: number; title: string; keyword: string; group: string; score: number | null; seo: string; ready: string; words: number; owner: string; updated: string; status: string; imported: boolean }
type Tab = "all" | "drafts" | "review" | "scheduled" | "published" | "optimise" | "archived";

export function ArticlesTable({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [pending, start] = useTransition();
  const f = (r: Row) =>
    tab === "all" ? r.status !== "archived" : tab === "drafts" ? ["idea", "planned", "brief", "drafting", "editing"].includes(r.status) : tab === "review" ? r.status === "review" : tab === "scheduled" ? r.status === "scheduled" : tab === "published" ? ["published", "monitoring"].includes(r.status) : tab === "optimise" ? r.seo === "Needs attention" || r.seo === "Poor" || r.ready === "Low" : r.status === "archived";
  const list = rows.filter(f);
  const countFor = (t: Tab) => {
    switch (t) {
      case "all":
        return rows.filter((r) => r.status !== "archived").length;
      case "drafts":
        return rows.filter((r) => ["idea", "planned", "brief", "drafting", "editing"].includes(r.status)).length;
      case "review":
        return rows.filter((r) => r.status === "review").length;
      case "scheduled":
        return rows.filter((r) => r.status === "scheduled").length;
      case "published":
        return rows.filter((r) => ["published", "monitoring"].includes(r.status)).length;
      case "optimise":
        return rows.filter((r) => r.seo === "Needs attention" || r.seo === "Poor" || r.ready === "Low").length;
      case "archived":
        return rows.filter((r) => r.status === "archived").length;
    }
  };

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <PageTabs
              value={tab}
              onChange={setTab}
              items={[
                { id: "all", label: "All", count: countFor("all") },
                { id: "drafts", label: "Drafts", count: countFor("drafts") },
                { id: "review", label: "In review", count: countFor("review") },
                { id: "scheduled", label: "Scheduled", count: countFor("scheduled") },
                { id: "published", label: "Published", count: countFor("published") },
                { id: "optimise", label: "Needs optimisation", count: countFor("optimise") },
                { id: "archived", label: "Archived", count: countFor("archived") },
              ]}
              ariaLabel="Article status tabs"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const n = await importFromWebsite();
                  toast(`${n} articles imported from your website`);
                })
              }
            >
              <Download size={16} strokeWidth={1.5} /> Import from website
            </Button>
            <Link href="/articles/new" className={btnClass("primary")}>
              Create article
            </Link>
          </div>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Article</Th><Th>Primary keyword</Th><Th>Topic group</Th>
            <Th><Tip text="Share of applicable SEO, GEO, AEO and editorial checks that pass. Checks that can't be verified are excluded. Readiness, not a ranking prediction."><span className="cursor-help underline decoration-dotted underline-offset-4">Content score</span></Tip></Th>
            <Th>SEO status</Th><Th>GEO / AEO readiness</Th><Th>Words</Th><Th>Author</Th><Th>Updated</Th><Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className={trClass}>
              <Td className="max-w-sm truncate font-medium"><Link href={`/articles/${r.id}`} className="hover:underline">{r.title}</Link>{r.imported && <Badge tone="outline" className="ml-2">Imported</Badge>}</Td>
              <Td>{r.keyword || "—"}</Td><Td>{r.group}</Td>
              <Td>{r.score === null ? <span className="text-faint">—</span> : <Badge tone={r.score >= 75 ? "success" : r.score >= 50 ? "warning" : "danger"}>{r.score}</Badge>}</Td>
              <Td>{r.seo === "—" ? "—" : <Badge tone={r.seo === "Good" ? "success" : r.seo === "Poor" ? "danger" : "warning"}>{r.seo}</Badge>}</Td>
              <Td>{r.ready === "—" ? "—" : <Badge tone={r.ready === "Ready" ? "success" : r.ready === "Low" ? "danger" : "warning"}>{r.ready}</Badge>}</Td>
              <Td className="tabular-nums">{r.words ? r.words.toLocaleString() : "—"}</Td>
              <Td><span className="flex items-center gap-2"><Avatar name={r.owner} />{r.owner.split(" ")[0]}</span></Td>
              <Td className="whitespace-nowrap text-muted">{format(new Date(r.updated), "MMM d")}</Td>
              <Td><Badge tone={statusTone(r.status)}>{r.status}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!list.length && <EmptyState title="Nothing here yet" description="Articles matching this filter will appear here." action={<Link href="/articles/new" className={btnClass("primary")}>Create article</Link>} />}
      <Disclaimer />
    </>
  );
}
