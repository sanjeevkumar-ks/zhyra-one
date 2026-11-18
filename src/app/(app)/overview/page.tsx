import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import {
  Badge,
  btnClass,
  ButtonLink,
  Dot,
  effortTone,
  levelTone,
  Page,
  SampleChip,
  Table,
  Td,
  Th,
  trClass,
  Unavailable,
  Why,
  Term,
} from "@/components/ui";
import { MiniLine, SearchChart, Spark } from "@/components/charts";
import { getContent, getWorkspace } from "@/lib/queries";
import { aiSummary, aiTopics, aiTrend, AI_PLATFORMS, searchSeries, spark } from "@/lib/mock-data";

type SparkData = ComponentProps<typeof Spark>["data"];
type HintTone = "positive" | "warning" | "neutral";

/* ---------- Compact design primitives ---------- */

// Standalone surface
const PANEL = "rounded-2xl border border-line bg-surface";
// Joined stat grid: 1px gaps reveal the border colour, so dividers work at any column count
const STAT_GRID = "grid gap-px overflow-hidden rounded-2xl border border-line bg-line";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 sm:mb-7">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function PanelTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function SoftTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusChip({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted">
      <span className={cx("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
      {children}
    </span>
  );
}

function DeltaPill({ delta, label }: { delta: number; label: string }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const tone = delta > 0 ? "text-emerald-600" : delta < 0 ? "text-danger" : "text-muted";
  return (
    <span className={cx("inline-flex items-center gap-0.5 rounded-full bg-sunken px-1.5 py-0.5 text-[11px] font-medium", tone)}>
      <Icon size={11} strokeWidth={2} />
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  delta,
  deltaLabel,
  source,
  sub,
  data,
  unavailable,
}: {
  label: string;
  value?: string | number;
  delta?: number;
  deltaLabel?: string;
  source?: string;
  sub?: string;
  data?: SparkData;
  unavailable?: string;
}) {
  return (
    <div className="min-w-0 bg-surface p-3.5 sm:p-4">
      <p className="truncate text-[13px] font-medium text-muted">{label}</p>

      {unavailable ? (
        <div className="mt-2">
          <Unavailable source={unavailable} compact />
        </div>
      ) : (
        <>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-fg">{value}</p>
            {data && (
              <div className="hidden w-16 shrink-0 md:block">
                <Spark data={data} />
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {delta !== undefined && deltaLabel && <DeltaPill delta={delta} label={deltaLabel} />}
            {sub && <span className="text-xs text-muted">{sub}</span>}
          </div>

          {source && <p className="mt-1.5 truncate text-[11px] text-faint">{source}</p>}
        </>
      )}
    </div>
  );
}

function LinkStat({
  href,
  label,
  value,
  hint,
  hintTone = "neutral",
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: HintTone;
}) {
  const tone =
    hintTone === "positive" ? "text-emerald-600" : hintTone === "warning" ? "text-amber-600" : "text-muted";

  return (
    <Link
      href={href}
      className={cx("group block min-w-0 bg-surface p-3.5 transition-colors hover:bg-subtle sm:p-4", FOCUS)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-muted">{label}</p>
        <ArrowUpRight size={14} strokeWidth={1.5} className="shrink-0 text-faint transition-colors group-hover:text-fg" />
      </div>
      <p className="mt-1.5 text-2xl font-semibold leading-none tracking-tight tabular-nums text-fg">{value}</p>
      {hint && <p className={cx("mt-2 truncate text-xs font-medium", tone)}>{hint}</p>}
    </Link>
  );
}

/* ---------- Data ---------- */

const attention = [
  { tone: "warning" as const, text: "12 keywords are ranking between positions 11–20", count: 12, label: "Review keywords", href: "/opportunities" },
  { tone: "danger" as const, text: "5 pages have declining organic clicks", count: 5, label: "Improve article", href: "/past-content" },
  { tone: "warning" as const, text: "3 content pillars have unaddressed high-demand search gaps", count: 3, label: "Explore pillars", href: "/topic-groups" },
  { tone: "warning" as const, text: "4 published articles have missing meta descriptions", count: 4, label: "Inspect page", href: "/seo/audit" },
  { tone: "danger" as const, text: "2 pages are not indexed", count: 2, label: "Inspect page", href: "/seo/pages" },
  { tone: "info" as const, text: "Competitors appear for 18 relevant queries you don't target", count: 18, label: "Review keywords", href: "/opportunities?tab=gaps" },
];

const next = [
  { title: "Create comparison page for “Bakuchiol vs Retinol”", impact: "High", effort: "Medium", confidence: "High", goal: "High", reason: "22,400 monthly searches with zero dedicated commercial page on your site.", href: "/pages/new?opportunityId=opp_1" },
  { title: "Improve “Organic Face Moisturisers” category page to fix 3.4% CTR", impact: "High", effort: "Low", confidence: "High", goal: "High", reason: "64,000 monthly impressions; adding FAQ schema and comparison table will lift clicks.", href: "/pages" },
  { title: "Create a buying guide for “best organic face moisturiser”", impact: "High", effort: "Medium", confidence: "Medium", goal: "High", reason: "Commercial intent, high demand estimate, and you have no content for it yet.", href: "/articles/new" },
  { title: "Rewrite titles for 3 pages with high impressions, low CTR", impact: "Medium", effort: "Low", confidence: "High", goal: "High", reason: "Pages already rank; a clearer title is a low-effort way to earn more clicks.", href: "/seo/pages" },
  { title: "Add a direct-answer section to “Is organic skincare better?”", impact: "Medium", effort: "Low", confidence: "Medium", goal: "Medium", reason: "AI answers on this question cite competitors; clearer answers improve readiness.", href: "/aeo" },
  { title: "Link supporting articles to the Skin Type Handbook pillar", impact: "Medium", effort: "Low", confidence: "High", goal: "Medium", reason: "Strengthens topical coverage with internal links you control.", href: "/topic-groups/2" },
  { title: "Connect Google Analytics 4", impact: "Medium", effort: "Low", confidence: "High", goal: "High", reason: "Unlocks organic sessions and conversion reporting alongside Search Console.", href: "/integrations" },
];

/* ---------- Page ---------- */

export default async function OverviewPage() {
  const [w, content] = await Promise.all([getWorkspace(), getContent()]);
  const gsc = w.integrations.gsc;
  const wp = w.integrations.wordpress;
  const series = searchSeries(28);
  const clicks = series.reduce((n, p) => n + p.clicks, 0);
  const prev = series.reduce((n, p) => n + p.prevClicks, 0);
  const deltaPct = prev ? Math.round(((clicks - prev) / prev) * 1000) / 10 : 0;
  const count = (...s: string[]) => content.filter((c) => s.includes(c.status)).length;
  const published = count("published", "monitoring");
  const live = content.filter((c) => c.status === "published").length;
  const scheduled = count("scheduled");
  const pipeline = [
    { label: "Planned", n: count("idea", "planned", "brief") },
    { label: "Writing", n: count("drafting", "editing") },
    { label: "Review", n: count("review") },
    { label: "Scheduled", n: scheduled },
    { label: "Published", n: published },
  ];

  return (
    <Page>
      <div className="mx-auto w-full max-w-[1280px] pb-8">
        {/* Hero */}
        <header className="mb-5 flex flex-col gap-3 sm:mb-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-[28px]">
                {greeting()}, Sanjeev
              </h1>
              {/* <SampleChip /> */}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Here's how visible Verdant Botanics is across search and AI answers, what changed, and what to do next.
            </p>
          </div>

          {/* <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip ok={!!gsc}>{gsc ? "Search Console connected" : "Search Console not connected"}</StatusChip>
            <StatusChip ok={!!wp}>{wp ? "WordPress connected" : "WordPress not connected"}</StatusChip>
          </div> */}
        </header>

        {!w.onboardingCompleted && (
          <div className={cx(PANEL, "mb-5 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between")}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-fg">
                <Sparkles size={16} strokeWidth={1.5} />
              </span>
              <p className="text-sm font-medium text-fg">Finish setup so recommendations reflect your business.</p>
            </div>
            <ButtonLink href="/onboarding" size="sm">Continue setup</ButtonLink>
          </div>
        )}

        {/* A. KPIs */}
        <Section title="Performance" description="Last 28 days across connected sources.">
          <div className={cx(STAT_GRID, "grid-cols-2 lg:grid-cols-4")}>
            {gsc ? (
              <Metric
                label="Organic clicks"
                value={clicks.toLocaleString()}
                delta={deltaPct}
                deltaLabel={`${deltaPct > 0 ? "+" : ""}${deltaPct}%`}
                source="Google Search Console"
                sub="vs previous 28 days"
                data={spark("clicks")}
              />
            ) : (
              <Metric label="Organic clicks" unavailable="Google Search Console" />
            )}
            {gsc ? (
              <Metric
                label="Keywords improving"
                value="186"
                delta={32}
                deltaLabel="+32"
                source="Tracked keyword positions"
                sub="this month"
                data={spark("improving")}
              />
            ) : (
              <Metric label="Keywords improving" unavailable="Google Search Console" />
            )}
            {gsc ? (
              <Metric
                label="Top 10 rankings"
                value="142"
                delta={14}
                deltaLabel="+14"
                source="Tracked search keywords"
                sub="keywords"
                data={spark("top10")}
              />
            ) : (
              <Metric label="Top 10 rankings" unavailable="Google Search Console" />
            )}
            {wp ? (
              <Metric
                label="Articles published"
                value={published}
                source="WordPress connected"
                sub={`${live} live · ${scheduled} scheduled`}
                data={spark("pub")}
              />
            ) : (
              <Metric label="Articles published" unavailable="a publishing channel" />
            )}
          </div>
        </Section>

        {/* B + C */}
        <section className="mb-6 grid gap-3 sm:mb-7 xl:grid-cols-5">
          <div className={cx(PANEL, "p-4 xl:col-span-3")}>
            <PanelTitle
              title="Search performance"
              description="Google Search Console · clicks are never combined with GA4 sessions"
              action={<SampleChip />}
            />
            <div className="mt-3">
              {gsc ? <SearchChart data={series} /> : <Unavailable source="Google Search Console" />}
            </div>
          </div>

          <div className={cx(PANEL, "p-4 xl:col-span-2")}>
            <PanelTitle
              title="AI visibility"
              description="Controlled sample of monitored questions"
              action={<SoftTag>Beta</SoftTag>}
            />

            <div className={cx(STAT_GRID, "mt-3 grid-cols-3 rounded-xl")}>
              {[
                { label: "Mentions", value: aiSummary.mentions },
                { label: "Citations", value: aiSummary.citations },
                { label: "Cited pages", value: aiSummary.citedPages },
              ].map((s) => (
                <div key={s.label} className="bg-surface px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-muted">{s.label}</p>
                  <p className="mt-1 text-xl font-semibold leading-none tracking-tight tabular-nums text-fg">{s.value}</p>
                </div>
              ))}
            </div>

            <p className="caption mt-2 leading-5">
              A <Term t="Mention">mention</Term> names your brand; a <Term t="Citation">citation</Term> links to your site.
            </p>

            <div className="mt-2">
              <MiniLine
                data={aiTrend}
                x="week"
                height={96}
                lines={[
                  { key: "mentions", name: "Mentions" },
                  { key: "citations", name: "Citations", dashed: true, color: "var(--faint)" },
                ]}
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {AI_PLATFORMS.map((p) => (
                <SoftTag key={p}>{p}</SoftTag>
              ))}
            </div>

            <ul className="mt-3 divide-y divide-line border-t border-line text-[13px]">
              {aiTopics.map((t) => (
                <li key={t.topic} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate font-medium text-fg">{t.topic}</span>
                  <span className="shrink-0 tabular-nums text-muted">{t.mention}% mention rate</span>
                </li>
              ))}
            </ul>

            <Link
              href="/ai-visibility"
              className={cx("mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-fg hover:underline", FOCUS)}
            >
              Open AI visibility <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
        </section>

        {/* Website Intelligence & Page Growth */}
        <Section
          title="Website Intelligence & Page Growth"
          description="Discovered pages across XML sitemaps and Search Console, missing commercial pages, and optimization progress."
          action={
            <Link href="/pages" className={cx(btnClass("outline", "sm"), FOCUS)}>
              Open inventory
            </Link>
          }
        >
          <div className={cx(STAT_GRID, "grid-cols-2 lg:grid-cols-4")}>
            <LinkStat href="/pages" label="Discovered Website URLs" value="12" hint="11 indexed · 1 blocked" hintTone="positive" />
            <LinkStat href="/pages?tab=opportunities" label="Page Opportunities Discovered" value="6" hint="4 missing · 2 improvements" hintTone="warning" />
            <LinkStat href="/pages?tab=published" label="Pages Created & Improved" value="4" hint="2 published · 2 staged" />
            <LinkStat href="/pages" label="Monthly Page Impressions" value="480k" hint="+18% vs last month" hintTone="positive" />
          </div>
        </Section>

        {/* D. Pipeline */}
        <Section
          title="Content pipeline"
          action={
            <Link href="/planner" className={cx(btnClass("outline", "sm"), FOCUS)}>
              Open planner
            </Link>
          }
        >
          <div className={cx(STAT_GRID, "grid-cols-2 sm:grid-cols-5")}>
            {pipeline.map((p, i) => (
              <div key={p.label} className={cx("bg-surface", i === pipeline.length - 1 && "col-span-2 sm:col-span-1")}>
                <LinkStat href="/planner" label={p.label} value={p.n} />
              </div>
            ))}
          </div>
        </Section>

        {/* E. Attention */}
        <Section title="What needs your attention?" description="Every insight has a direct action.">
          <ul className={cx(PANEL, "divide-y divide-line overflow-hidden")}>
            {attention.map((a) => (
              <li key={a.text} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5 sm:flex-nowrap">
                <Dot tone={a.tone} />
                <p className="min-w-0 flex-1 basis-[calc(100%-1.5rem)] text-sm leading-5 text-fg sm:basis-auto">
                  {a.text}
                </p>
                <SoftTag className="ml-5 sm:ml-0">{a.count} affected</SoftTag>
                <Link
                  href={a.href}
                  className={cx(
                    "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-fg transition-colors hover:bg-subtle sm:ml-0",
                    FOCUS,
                  )}
                >
                  {a.label}
                  <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* F. Next actions */}
        <Section
          title="Recommended next actions"
          description="Prioritised by estimated impact, effort, confidence and relevance to your goal: increase organic traffic."
        >
          {/* Desktop table */}
          <div className={cx(PANEL, "hidden overflow-hidden lg:block")}>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Action</Th>
                    <Th>Impact</Th>
                    <Th>Effort</Th>
                    <Th>Confidence</Th>
                    <Th>Rationale</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {next.map((n) => (
                    <tr key={n.title} className={trClass}>
                      <Td className="max-w-md font-medium">{n.title}</Td>
                      <Td><Badge tone={levelTone(n.impact)}>{n.impact}</Badge></Td>
                      <Td><Badge tone={effortTone(n.effort)}>{n.effort}</Badge></Td>
                      <Td><Badge tone={levelTone(n.confidence)}>{n.confidence}</Badge></Td>
                      <Td><Why {...n} /></Td>
                      <Td>
                        <Link href={n.href} className={cx(btnClass("primary", "sm"), FOCUS)}>
                          Start
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Mobile / tablet list */}
          <ul className={cx(PANEL, "divide-y divide-line overflow-hidden lg:hidden")}>
            {next.map((n) => (
              <li key={n.title} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium leading-5 text-fg">{n.title}</h3>
                  <Link
                    href={n.href}
                    aria-label={`Start: ${n.title}`}
                    className={cx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90",
                      FOCUS,
                    )}
                  >
                    <ArrowRight size={14} strokeWidth={1.75} />
                  </Link>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone={levelTone(n.impact)}>Impact · {n.impact}</Badge>
                  <Badge tone={effortTone(n.effort)}>Effort · {n.effort}</Badge>
                  <Badge tone={levelTone(n.confidence)}>Confidence · {n.confidence}</Badge>
                </div>

                <div className="mt-2 text-[13px] leading-5 text-muted">
                  <Why {...n} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Page>
  );
}