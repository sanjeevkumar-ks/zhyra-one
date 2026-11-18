import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Badge, btnClass, Estimate, intentTone, Page, SampleChip, Table, Td, Th, Tabs, trClass, Term } from "@/components/ui";
import { getKeywords, getTopicGroups } from "@/lib/queries";
import { competitorGaps, questionOpps } from "@/lib/mock-data";
import { INITIAL_PAGE_OPPORTUNITIES } from "@/lib/website-intelligence-data";
import { PageOpportunitiesView } from "@/components/pages/page-opportunities-view";
import { KeywordsTable } from "./keywords-table";

/* ---------- Compact design primitives (shared with Overview / Keywords) ---------- */

const PANEL = "rounded-2xl border border-line bg-surface";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Bordered surface that holds a desktop table and scrolls horizontally if needed. */
function TablePanel({ children }: { children: ReactNode }) {
  return (
    <div className={cx(PANEL, "hidden overflow-hidden md:block")}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Divided list used instead of a table on small screens. */
function MobileList({ children }: { children: ReactNode }) {
  return <ul className={cx(PANEL, "divide-y divide-line overflow-hidden md:hidden")}>{children}</ul>;
}

function TabIntro({ children }: { children: ReactNode }) {
  return <p className="mb-3 max-w-3xl text-[13px] leading-5 text-muted">{children}</p>;
}

function PanelTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
      {description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>}
    </div>
  );
}

function CoverageBar({ covered, total }: { covered: number; total: number }) {
  const pct = total ? Math.round((covered / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-14 text-[13px] tabular-nums text-fg">
        {covered} of {total}
      </span>
      <span className="h-1 w-16 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <span className="block h-full rounded-full bg-fg" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/* ---------- Page ---------- */

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "keywords" } = await searchParams;
  const [kws, groups] = await Promise.all([getKeywords(), getTopicGroups()]);
  const tabs = [
    { id: "keywords", label: "Keywords", href: "/opportunities" },
    { id: "pages", label: "Page Opportunities", href: "/opportunities?tab=pages" },
    { id: "topics", label: "Content pillars", href: "/opportunities?tab=topics" },
    { id: "questions", label: "Questions", href: "/opportunities?tab=questions" },
    { id: "gaps", label: "Competitor gaps", href: "/opportunities?tab=gaps" },
  ];

  const topicRows = groups.map((g) => {
    const ks = kws.filter((k) => k.topicGroupId === g.id);
    return {
      g,
      count: ks.length,
      volume: ks.reduce((n, k) => n + k.volume, 0),
      covered: ks.filter((k) => k.coverage === "Covered").length,
    };
  });

  return (
    <Page wide>
      {/* Header */}
      <header className="mb-4 flex flex-col gap-2 sm:mb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            We find what your customers are searching for, so you don&apos;t have to start with a keyword. Pick an opportunity to see why it matters before you write.
          </p>
        </div>
        <div className="shrink-0">
          <SampleChip label="Sample data · estimates" />
        </div>
      </header>

      {/* In-page Tab Navigation */}
      <Tabs items={tabs} active={tab} className="mb-6" />

      {tab === "keywords" && <KeywordsTable keywords={kws} groups={groups.map((g) => ({ id: g.id, name: g.name }))} />}

      {tab === "pages" && <PageOpportunitiesView opportunities={INITIAL_PAGE_OPPORTUNITIES} />}

      {/* Content pillars */}
      {tab === "topics" && (
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TablePanel>
              <Table>
                <thead>
                  <tr>
                    <Th>Topic</Th>
                    <Th>Keywords</Th>
                    <Th>
                      Volume <span className="font-normal">(est.)</span>
                    </Th>
                    <Th>Covered</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {topicRows.map(({ g, count, volume, covered }) => (
                    <tr key={g.id} className={trClass}>
                      <Td className="font-medium text-fg">{g.name}</Td>
                      <Td className="tabular-nums">{count}</Td>
                      <Td className="tabular-nums">
                        <Estimate>{volume.toLocaleString()}</Estimate>
                      </Td>
                      <Td>
                        <CoverageBar covered={covered} total={count} />
                      </Td>
                      <Td className="text-right">
                        <Link className={cx(btnClass("outline", "sm"), FOCUS)} href={`/topic-groups/${g.id}`}>
                          Open pillar
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TablePanel>

            <MobileList>
              {topicRows.map(({ g, count, volume, covered }) => (
                <li key={g.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium leading-5 text-fg">{g.name}</h3>
                    <Link
                      href={`/topic-groups/${g.id}`}
                      aria-label={`Open pillar: ${g.name}`}
                      className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90", FOCUS)}
                    >
                      <ArrowRight size={14} strokeWidth={1.75} />
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                    <span className="tabular-nums">{count} keywords</span>
                    <span className="tabular-nums">
                      <Estimate>{volume.toLocaleString()}</Estimate> vol (est.)
                    </span>
                  </div>
                  <div className="mt-2">
                    <CoverageBar covered={covered} total={count} />
                  </div>
                </li>
              ))}
            </MobileList>
          </div>

          <div className={cx(PANEL, "p-4 lg:col-span-2")}>
            <PanelTitle title="Topic clusters" description="Bubble size = estimated search volume" />
            <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
              {topicRows.map(({ g, volume }) => {
                const size = 64 + Math.min(96, volume / 1700);
                return (
                  <Link
                    key={g.id}
                    href={`/topic-groups/${g.id}`}
                    className={cx("orb flex items-center justify-center p-2.5 text-center text-xs font-medium text-neutral-900 transition-transform hover:scale-105", FOCUS)}
                    style={{ width: size, height: size }}
                  >
                    {g.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {tab === "questions" && (
        <>
          <TablePanel>
            <Table>
              <thead>
                <tr>
                  <Th>Question</Th>
                  <Th>
                    Volume <span className="font-normal">(est.)</span>
                  </Th>
                  <Th>Found in</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {questionOpps.map((q) => (
                  <tr key={q.q} className={trClass}>
                    <Td className="max-w-md font-medium text-fg">{q.q}</Td>
                    <Td className="tabular-nums">
                      <Estimate>{q.volume.toLocaleString()}</Estimate>
                    </Td>
                    <Td>
                      <Badge>{q.source}</Badge>
                    </Td>
                    <Td>{q.covered ? <Badge tone="success">Answered</Badge> : <Badge tone="warning">No dedicated answer</Badge>}</Td>
                    <Td className="text-right">
                      <Link className={cx(btnClass("outline", "sm"), FOCUS)} href={`/articles/new?keyword=${encodeURIComponent(q.q)}`}>
                        Create content
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TablePanel>

          <MobileList>
            {questionOpps.map((q) => (
              <li key={q.q} className="p-3.5">
                <h3 className="text-sm font-medium leading-5 text-fg">{q.q}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge>{q.source}</Badge>
                  {q.covered ? <Badge tone="success">Answered</Badge> : <Badge tone="warning">No dedicated answer</Badge>}
                  <span className="text-xs tabular-nums text-muted">
                    <Estimate>{q.volume.toLocaleString()}</Estimate> vol (est.)
                  </span>
                </div>
                <Link
                  className={cx(btnClass("outline", "sm"), FOCUS, "mt-3 inline-flex w-full items-center justify-center")}
                  href={`/articles/new?keyword=${encodeURIComponent(q.q)}`}
                >
                  Create content
                </Link>
              </li>
            ))}
          </MobileList>
        </>
      )}

      {/* Competitor gaps */}
      {tab === "gaps" && (
        <>
          <TabIntro>
            Keywords competitors rank for that you don&apos;t target yet. Overlap is estimated from <Term t="SERP">search results</Term> samples.
          </TabIntro>

          <TablePanel>
            <Table>
              <thead>
                <tr>
                  <Th>Keyword</Th>
                  <Th>Competitor</Th>
                  <Th>Volume (est.)</Th>
                  <Th>
                    <Term t="KD">Difficulty</Term> (est.)
                  </Th>
                  <Th>
                    <Term t="Intent">Intent</Term>
                  </Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {competitorGaps.map((g) => (
                  <tr key={g.keyword} className={trClass}>
                    <Td className="font-medium text-fg">{g.keyword}</Td>
                    <Td className="mono">{g.competitor}</Td>
                    <Td className="tabular-nums">
                      <Estimate>{g.volume.toLocaleString()}</Estimate>
                    </Td>
                    <Td className="tabular-nums">{g.difficulty}</Td>
                    <Td>
                      <Badge tone={intentTone(g.intent)} className="capitalize">
                        {g.intent}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Link className={cx(btnClass("primary", "sm"), FOCUS)} href={`/articles/new?keyword=${encodeURIComponent(g.keyword)}`}>
                        Create content
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TablePanel>

          <MobileList>
            {competitorGaps.map((g) => (
              <li key={g.keyword} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 text-sm font-medium leading-5 text-fg">{g.keyword}</h3>
                  <Link
                    href={`/articles/new?keyword=${encodeURIComponent(g.keyword)}`}
                    aria-label={`Create content: ${g.keyword}`}
                    className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90", FOCUS)}
                  >
                    <ArrowRight size={14} strokeWidth={1.75} />
                  </Link>
                </div>
                <p className="mono mt-1 truncate text-xs text-muted">{g.competitor}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Badge tone={intentTone(g.intent)} className="capitalize">
                    {g.intent}
                  </Badge>
                  <span className="text-xs tabular-nums text-muted">
                    Vol <Estimate>{g.volume.toLocaleString()}</Estimate>
                  </span>
                  <span className="text-xs tabular-nums text-muted">KD {g.difficulty}</span>
                </div>
              </li>
            ))}
          </MobileList>
        </>
      )}
    </Page>
  );
}