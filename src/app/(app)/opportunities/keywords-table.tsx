"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpDown, X } from "lucide-react";
import { Badge, Button, btnClass, Estimate, intentTone, Table, Td, Th, trClass, Term, EmptyState } from "@/components/ui";
import { SearchInput, SelectDropdown } from "@/components/ui-form";
import { Sheet, toast } from "@/components/ui-client";
import { addKeywordsToPlanner, trackKeyword } from "@/app/actions";
import { factorsFor, priorityScore } from "@/lib/services/scoring";
import type { KeywordRow } from "@/lib/queries";
import { hash } from "@/lib/hash";

type SortKey = "priority" | "volume" | "difficulty";
type Priority = ReturnType<typeof priorityScore>;

const PRIORITY_TONE = { High: "success", Medium: "warning", Low: "neutral" } as const;

/* ---------- Compact design primitives (shared language with Overview) ---------- */

const PANEL = "rounded-2xl border border-line bg-surface";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";
const FILTER = "!h-9 !min-h-9 !rounded-full text-[13px] py-1";
const CHECKBOX = "h-4 w-4 cursor-pointer rounded accent-fg";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "priority", label: "Sort: Priority" },
  { value: "volume", label: "Sort: Volume" },
  { value: "difficulty", label: "Sort: Difficulty (easiest)" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Priority badge with factor popover ---------- */

function PriorityBadge({ p, align = "left" }: { p: Priority; align?: "left" | "right" }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={`Priority ${p.label}, view factors`} className={cx("rounded-full", FOCUS)}>
        <Badge tone={PRIORITY_TONE[p.label]}>
          {p.label} · {p.score}
        </Badge>
      </button>
      <span
        role="tooltip"
        className={cx(
          "invisible absolute top-full z-50 mt-1.5 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-3 text-[13px] opacity-0 shadow-lg",
          "group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        <span className="mb-1.5 block font-medium text-fg">
          Opportunity Priority: {p.label} ({p.score}/100)
        </span>
        {p.rows.map((r) => (
          <span key={r.key} className="flex justify-between gap-3 py-0.5">
            <span className="text-muted">
              {r.label} <span className="text-faint">({Math.round(r.weight * 100)}%)</span>
            </span>
            <span className="shrink-0 tabular-nums text-fg">
              {r.level} · +{r.contribution}
            </span>
          </span>
        ))}
        <span className="mt-2 block text-xs text-faint">A prioritisation estimate, not a ranking prediction.</span>
      </span>
    </span>
  );
}

/* ---------- Sortable column header ---------- */

function SortHead({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center gap-1 rounded transition-colors hover:text-fg",
        active ? "text-fg" : "text-muted",
        FOCUS,
      )}
    >
      {children}
      <ArrowUpDown size={12} strokeWidth={1.75} className={active ? "text-fg" : "text-faint"} />
    </button>
  );
}

/* ---------- Table ---------- */

export function KeywordsTable({ keywords, groups }: { keywords: KeywordRow[]; groups: { id: number; name: string }[] }) {
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState("all");
  const [group, setGroup] = useState("all");
  const [cover, setCover] = useState("all");
  const [sort, setSort] = useState<SortKey>("priority");
  const [sel, setSel] = useState<number[]>([]);
  const [open, setOpen] = useState<KeywordRow | null>(null);
  const [pending, start] = useTransition();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = keywords
      .filter(
        (k) =>
          k.keyword.includes(needle) &&
          (intent === "all" || k.intent === intent) &&
          (group === "all" || String(k.topicGroupId) === group) &&
          (cover === "all" || k.coverage === cover),
      )
      .map((k) => ({ k, p: priorityScore(factorsFor(k)) }));
    r.sort((a, b) =>
      sort === "priority" ? b.p.score - a.p.score : sort === "volume" ? b.k.volume - a.k.volume : a.k.difficulty - b.k.difficulty,
    );
    return r;
  }, [keywords, q, intent, group, cover, sort]);

  const filtersActive = q !== "" || intent !== "all" || group !== "all" || cover !== "all";
  const clearFilters = () => {
    setQ("");
    setIntent("all");
    setGroup("all");
    setCover("all");
  };

  const allSelected = rows.length > 0 && rows.every((r) => sel.includes(r.k.id));
  const someSelected = sel.length > 0 && !allSelected;
  const toggleOne = (id: number, on: boolean) => setSel((s) => (on ? [...s, id] : s.filter((x) => x !== id)));

  const addMany = (ids: number[]) =>
    start(async () => {
      const n = await addKeywordsToPlanner(ids);
      setSel([]);
      toast(n ? `${n} item${n > 1 ? "s" : ""} added to the content planner` : "Already in the planner");
    });

  const groupName = (id: number | null) => groups.find((g) => g.id === id)?.name ?? "—";

  return (
    <>
      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="w-full md:w-64">
          <SearchInput
            placeholder="Filter keywords"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ("")}
            className={FILTER}
            aria-label="Filter keywords"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="min-w-0 sm:w-auto">
            <SelectDropdown
              className={FILTER}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              aria-label="Intent"
              options={[
                { value: "all", label: "All intents" },
                { value: "informational", label: "Informational" },
                { value: "commercial", label: "Commercial" },
                { value: "transactional", label: "Transactional" },
                { value: "navigational", label: "Navigational" },
              ]}
            />
          </div>
          <div className="min-w-0 sm:w-auto">
            <SelectDropdown
              className={FILTER}
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              aria-label="Topic group"
              options={[{ value: "all", label: "All topic groups" }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]}
            />
          </div>
          <div className="min-w-0 sm:w-auto">
            <SelectDropdown
              className={FILTER}
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              aria-label="Coverage"
              options={[
                { value: "all", label: "Any coverage" },
                { value: "Missing", label: "No content yet" },
                { value: "Planned", label: "Planned" },
                { value: "Covered", label: "Covered" },
              ]}
            />
          </div>
          {/* Sort control only on small screens (table headers sort on md+) */}
          <div className="min-w-0 sm:w-auto md:hidden">
            <SelectDropdown
              className={FILTER}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort keywords"
              options={SORT_OPTIONS}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:ml-auto">
          {filtersActive && (
            <button type="button" onClick={clearFilters} className={cx("text-[13px] font-medium text-fg hover:underline", FOCUS)}>
              Clear filters
            </button>
          )}
          <span className="text-xs tabular-nums text-muted">
            {rows.length} of {keywords.length} keywords
          </span>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          {/* Desktop / tablet table */}
          <div className={cx(PANEL, "hidden md:block")}>
            <Table>
              <thead>
                <tr>
                  <Th className="w-10">
                    <input
                      type="checkbox"
                      className={CHECKBOX}
                      aria-label="Select all"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.k.id) : [])}
                    />
                  </Th>
                  <Th>Keyword</Th>
                  <Th>
                    <SortHead active={sort === "volume"} onClick={() => setSort("volume")}>
                      <Term t="Volume">Volume</Term>
                    </SortHead>
                  </Th>
                  <Th>
                    <SortHead active={sort === "difficulty"} onClick={() => setSort("difficulty")}>
                      <Term t="KD">KD</Term>
                    </SortHead>
                  </Th>
                  <Th>
                    <Term t="Intent">Intent</Term>
                  </Th>
                  <Th>Position</Th>
                  <Th className="hidden xl:table-cell">
                    <Term t="SERP">SERP</Term> features
                  </Th>
                  <Th className="hidden lg:table-cell">Target URL</Th>
                  <Th>
                    <SortHead active={sort === "priority"} onClick={() => setSort("priority")}>
                      Priority
                    </SortHead>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ k, p }) => {
                  const selected = sel.includes(k.id);
                  return (
                    <tr
                      key={k.id}
                      className={cx(trClass, "cursor-pointer", selected && "bg-subtle", FOCUS)}
                      tabIndex={0}
                      onClick={() => setOpen(k)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setOpen(k);
                        }
                      }}
                    >
                      <Td>
                        <input
                          type="checkbox"
                          className={CHECKBOX}
                          aria-label={`Select ${k.keyword}`}
                          checked={selected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleOne(k.id, e.target.checked)}
                        />
                      </Td>
                      <Td className="max-w-[260px] truncate font-medium text-fg">{k.keyword}</Td>
                      <Td className="tabular-nums">
                        <Estimate>{k.volume.toLocaleString()}</Estimate>
                      </Td>
                      <Td className="tabular-nums">
                        <Estimate>{k.difficulty}</Estimate>
                      </Td>
                      <Td>
                        <Badge tone={intentTone(k.intent)} className="capitalize">
                          {k.intent}
                        </Badge>
                      </Td>
                      <Td className="tabular-nums">{k.position ?? <span className="text-faint">—</span>}</Td>
                      <Td className="hidden xl:table-cell">
                        {k.serpFeatures.length ? (
                          <span className="flex flex-wrap gap-1">
                            {k.serpFeatures.slice(0, 2).map((f) => (
                              <Badge key={f} tone="outline">
                                {f}
                              </Badge>
                            ))}
                            {k.serpFeatures.length > 2 && (
                              <span className="self-center text-xs text-muted" title={k.serpFeatures.slice(2).join(", ")}>
                                +{k.serpFeatures.length - 2}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </Td>
                      <Td className="mono hidden max-w-[180px] truncate lg:table-cell">
                        {k.targetUrl || <span className="font-sans text-faint">Proposed: new page</span>}
                      </Td>
                      <Td>
                        <span onClick={(e) => e.stopPropagation()}>
                          <PriorityBadge p={p} align="right" />
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Mobile list */}
          <ul className={cx(PANEL, "divide-y divide-line md:hidden")}>
            {rows.map(({ k, p }) => {
              const selected = sel.includes(k.id);
              return (
                <li key={k.id} className={cx("flex items-start gap-3 p-3.5", selected && "bg-subtle")}>
                  <input
                    type="checkbox"
                    className={cx(CHECKBOX, "mt-0.5")}
                    aria-label={`Select ${k.keyword}`}
                    checked={selected}
                    onChange={(e) => toggleOne(k.id, e.target.checked)}
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setOpen(k)}
                      className={cx("block w-full truncate text-left text-sm font-medium text-fg", FOCUS)}
                    >
                      {k.keyword}
                    </button>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
                      <span className="tabular-nums">
                        Vol <Estimate>{k.volume.toLocaleString()}</Estimate>
                      </span>
                      <span className="tabular-nums">
                        KD <Estimate>{k.difficulty}</Estimate>
                      </span>
                      <span className="tabular-nums">Pos {k.position ?? "—"}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={intentTone(k.intent)} className="capitalize">
                        {k.intent}
                      </Badge>
                      <PriorityBadge p={p} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className={cx(PANEL, "px-4 py-8")}>
          <EmptyState title="No keywords match these filters" description="Clear a filter to see more opportunities." />
          {filtersActive && (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={clearFilters} className={btnClass("outline", "sm")}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {sel.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="enter fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-primary py-1.5 pl-4 pr-1.5 text-primary-fg shadow-xl"
        >
          <span className="whitespace-nowrap text-[13px] font-medium tabular-nums">{sel.length} selected</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => addMany(sel)}
            className="whitespace-nowrap rounded-full bg-primary-fg px-3.5 py-1.5 text-[13px] font-medium text-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Add to planner
          </button>
          <button
            type="button"
            onClick={() => setSel([])}
            aria-label="Clear selection"
            className="flex h-7 w-7 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.keyword ?? ""}
        subtitle={open ? `${groupName(open.topicGroupId)} · ${open.intent}` : ""}
        width={560}
        footer={
          open && (
            <div className="flex w-full flex-wrap items-center gap-2">
              <Button
                disabled={pending || open.inPlanner}
                onClick={() => {
                  addMany([open.id]);
                  setOpen({ ...open, inPlanner: true });
                }}
              >
                {open.inPlanner ? "In planner" : "Add to content planner"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  start(async () => {
                    await trackKeyword(open.id, !open.tracked);
                    toast(open.tracked ? "Tracking stopped" : "Keyword tracked");
                    setOpen({ ...open, tracked: !open.tracked });
                  });
                }}
              >
                {open.tracked ? "Untrack" : "Track keyword"}
              </Button>
              <select
                className="field !h-9 !min-h-9 !w-auto !rounded-full text-[13px]"
                value=""
                aria-label="Add to topic group"
                onChange={(e) => e.target.value && toast(`Added to ${groupName(Number(e.target.value))}`)}
              >
                <option value="">Add to topic group…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Link href={`/articles/new?keyword=${encodeURIComponent(open.keyword)}`} className={btnClass("outline", "md")}>
                Generate brief
              </Link>
            </div>
          )
        }
      >
        {open && <KeywordDetail k={open} all={keywords} groupName={groupName(open.topicGroupId)} />}
      </Sheet>
    </>
  );
}

/* ---------- Detail sheet content ---------- */

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-[13px] font-medium text-muted">{title}</h4>
      {children}
    </section>
  );
}

function KeywordDetail({ k, all, groupName }: { k: KeywordRow; all: KeywordRow[]; groupName: string }) {
  const p = priorityScore(factorsFor(k));
  const h = hash(k.keyword);
  const serp = ["healthline.com", "byrdie.com", "kamaayurveda.com", "typology.com", "nykaa.com", "wikipedia.org"]
    .sort((a, b) => hash(a + k.keyword) - hash(b + k.keyword))
    .slice(0, 4);
  const related = all.filter((x) => x.topicGroupId === k.topicGroupId && x.id !== k.id).slice(0, 5);
  const format =
    k.intent === "commercial" ? "Comparison / buying guide" : k.intent === "transactional" ? "Product or collection page" : "Explainer or how-to guide";

  const stats: { label: string; value: ReactNode }[] = [
    { label: "Volume", value: <Estimate>{k.volume.toLocaleString()}</Estimate> },
    { label: "Difficulty", value: <Estimate>{k.difficulty}</Estimate> },
    { label: "Position", value: k.position ?? "—" },
    { label: "Priority", value: `${p.score}/100` },
  ];

  return (
    <div className="space-y-5 text-sm">
      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface px-3 py-2.5">
            <p className="text-xs font-medium text-muted">{s.label}</p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight tabular-nums text-fg">{s.value}</p>
          </div>
        ))}
      </div>

      <Block title="Search intent analysis">
        <p className="leading-6 text-fg">
          People searching “{k.keyword}” are most likely{" "}
          {k.intent === "informational"
            ? "trying to learn or understand something"
            : k.intent === "commercial"
              ? "comparing options before choosing"
              : k.intent === "transactional"
                ? "ready to buy"
                : "looking for a specific brand"}
          . Match that intent in the first screen of the page. <span className="text-muted">(AI estimate based on query wording.)</span>
        </p>
      </Block>

      <Block title={`Opportunity Priority: ${p.label} (${p.score}/100)`}>
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {p.rows.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-fg">{r.label}</span>
                <span className="block text-xs text-muted">{r.help}</span>
              </span>
              <Badge tone={r.level === "High" ? "success" : r.level === "Medium" ? "warning" : "neutral"}>{r.level}</Badge>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="SERP competitor pages (sample)">
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {serp.map((d, i) => (
            <li key={d} className="flex items-center justify-between gap-3 px-3.5 py-2">
              <span className="min-w-0 truncate">
                <span className="mr-2 tabular-nums text-faint">{i + 1}</span>
                {d}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">{900 + ((h >> i) % 1400)} words</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="People also ask">
        <ul className="list-disc space-y-1 pl-5 leading-6 text-fg marker:text-faint">
          <li>What is {k.keyword}?</li>
          <li>How do I choose {k.keyword}?</li>
          <li>Is {k.keyword} worth it?</li>
        </ul>
      </Block>

      <Block title="Your ranking pages">
        {k.targetUrl ? (
          <p className="mono break-all">
            {k.targetUrl} <span className="font-sans text-muted">· position {k.position ?? "n/a"}</span>
          </p>
        ) : (
          <p className="text-muted">None yet — a new page is needed.</p>
        )}
      </Block>

      <Block title="Content gaps">
        <p className="leading-6 text-fg">
          Top results include definitions and selection criteria. Few add first-hand expertise or original examples — a way to stand out.
        </p>
      </Block>

      <Block title="Recommended format · topic group">
        <p className="text-fg">
          {format} · <span className="font-medium">{groupName}</span>
        </p>
      </Block>

      {!!related.length && (
        <Block title="Related keywords">
          <div className="flex flex-wrap gap-1.5">
            {related.map((r) => (
              <Badge key={r.id}>{r.keyword}</Badge>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}