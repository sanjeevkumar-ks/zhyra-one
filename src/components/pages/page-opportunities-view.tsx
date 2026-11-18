"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, PageTabs } from "@/components/ui";
import { SearchInput, SelectDropdown } from "@/components/ui-form";
import {
  ALL_PAGE_TYPES,
  type OpportunityActionType,
  type PageOpportunity,
} from "@/lib/website-intelligence-types";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Link2,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface PageOpportunitiesViewProps {
  opportunities: PageOpportunity[];
  onSelectOpportunityForBuilder?: (opp: PageOpportunity) => void;
  onOpenExistingPage?: (pageId: string) => void;
}

export function PageOpportunitiesView({
  opportunities,
  onSelectOpportunityForBuilder,
  onOpenExistingPage,
}: PageOpportunitiesViewProps) {
  const [activeActionFilter, setActiveActionFilter] = useState<OpportunityActionType | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOpps = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesAction = activeActionFilter === "all" || opp.actionType === activeActionFilter;
      const matchesType = typeFilter === "all" || opp.recommendedPageType === typeFilter;
      const matchesSearch =
        opp.suggestedTitle.toLowerCase().includes(search.toLowerCase()) ||
        opp.primaryKeyword.toLowerCase().includes(search.toLowerCase()) ||
        opp.reasonForRecommendation.toLowerCase().includes(search.toLowerCase());

      return matchesAction && matchesType && matchesSearch;
    });
  }, [opportunities, activeActionFilter, typeFilter, search]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const createCount = opportunities.filter((o) => o.actionType === "CREATE").length;
  const improveCount = opportunities.filter((o) => o.actionType === "IMPROVE").length;
  const consolidateCount = opportunities.filter((o) => o.actionType === "CONSOLIDATE").length;

  return (
    <div className="space-y-6">
      {/* Intro & Methodology Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-subtle/30 p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-fg">Page Opportunity Discovery Engine</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
              Live Synthesis
            </span>
          </div>
          <p className="caption text-xs leading-relaxed max-w-2xl">
            Correlates your business products, Google Search Console query impressions, and competitor page rankings against your existing inventory to recommend high-impact pages.
          </p>
        </div>

        <Link
          href="/pages/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-fg px-4 py-2 text-xs font-medium text-bg hover:opacity-90 shrink-0 self-start sm:self-center"
        >
          <Plus size={15} strokeWidth={2} />
          Create custom page
        </Link>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <PageTabs
              value={activeActionFilter}
              onChange={(v) => setActiveActionFilter(v as OpportunityActionType | "all")}
              items={[
                { id: "all", label: "All opportunities", count: opportunities.length },
                { id: "CREATE", label: "Create Missing", count: createCount },
                { id: "IMPROVE", label: "Improve Existing", count: improveCount },
                { id: "CONSOLIDATE", label: "Consolidate", count: consolidateCount },
              ]}
              ariaLabel="Opportunity type filters"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <div className="w-56">
            <SearchInput
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              className="!h-8 !min-h-8 !rounded-full text-xs"
            />
          </div>

          <div className="w-40">
            <SelectDropdown
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="!h-8 !min-h-8 !rounded-full text-xs py-1"
              aria-label="Filter by page type"
              options={[
                { value: "all", label: "All page types" },
                ...ALL_PAGE_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
        </div>
      </div>
    </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpps.map((opp) => {
          const isExpanded = expandedId === opp.id;

          const actionBadgeColor =
            opp.actionType === "CREATE"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : opp.actionType === "IMPROVE"
              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
              : "bg-amber-500/10 text-amber-500 border-amber-500/20";

          return (
            <Card
              key={opp.id}
              className="p-5 transition-all duration-150 hover:border-line-strong space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${actionBadgeColor}`}
                    >
                      {opp.actionType}
                    </span>
                    <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-fg">
                      {opp.recommendedPageType}
                    </span>
                    <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-muted capitalize">
                      {opp.targetSearchIntent} intent
                    </span>
                    <span className="caption text-xs">
                      Effort: {opp.estimatedCreationEffort}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-fg tracking-tight leading-snug">
                    {opp.suggestedTitle}
                  </h3>

                  <p className="caption text-xs text-muted leading-relaxed line-clamp-2">
                    {opp.reasonForRecommendation}
                  </p>
                </div>

                {/* Score & Action Button */}
                <div className="flex items-center gap-4 shrink-0 self-end lg:self-center">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-base font-bold text-fg">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>{opp.opportunityScore}</span>
                      <span className="caption text-xs text-muted font-normal">/100</span>
                    </div>
                    <span className="caption text-[11px] text-muted">Opportunity score</span>
                  </div>

                  {opp.actionType === "CREATE" ? (
                    <Button
                      onClick={() => onSelectOpportunityForBuilder?.(opp)}
                      className="text-xs h-9 px-3.5"
                    >
                      Build in Page Builder
                      <ArrowRight size={14} strokeWidth={1.5} className="ml-1.5 shrink-0" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => opp.targetPageId && onOpenExistingPage?.(opp.targetPageId)}
                      className="text-xs h-9 px-3.5"
                    >
                      Review existing page
                      <ExternalLink size={14} strokeWidth={1.5} className="ml-1.5 shrink-0" />
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(opp.id)}
                    className="p-1.5 rounded-lg text-muted hover:bg-subtle hover:text-fg"
                    title={isExpanded ? "Collapse evidence" : "Expand evidence"}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Evidence Snapshot Pill Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line text-xs">
                <div className="flex items-center gap-1.5 text-muted">
                  <Search size={13} className="shrink-0" />
                  <span className="font-mono text-fg font-medium">{opp.primaryKeyword}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted">
                  <TrendingUp size={13} className="shrink-0 text-emerald-500" />
                  <span>{opp.evidence.searchDemandVolume.toLocaleString()} searches/mo</span>
                  <span className="caption text-[11px] text-emerald-500 font-medium">
                    (+{opp.evidence.monthlyTrendPct}% YoY)
                  </span>
                </div>
                {opp.evidence.competitorsRanking.length > 0 && (
                  <div className="caption text-muted truncate max-w-sm">
                    Competitors: {opp.evidence.competitorsRanking.map((c) => c.name).join(", ")}
                  </div>
                )}
              </div>

              {/* Detailed Expandable Analysis Breakdown */}
              {isExpanded && (
                <div className="pt-4 border-t border-line space-y-4 text-xs animate-in fade-in duration-150">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Explainable Opportunity Score Card */}
                    <div className="rounded-xl border border-line bg-subtle/30 p-4 space-y-2.5">
                      <span className="font-semibold text-fg block text-xs">
                        Explainable Opportunity Score Breakdown
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-muted">Search Demand & Trend</span>
                          <span className="font-mono font-medium text-fg">{opp.scoreBreakdown.demandScore} / 30</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Business & Product Relevance</span>
                          <span className="font-mono font-medium text-fg">{opp.scoreBreakdown.relevanceScore} / 30</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Competitor Content Gap</span>
                          <span className="font-mono font-medium text-fg">{opp.scoreBreakdown.competitorGapScore} / 25</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Ease of Search Capture</span>
                          <span className="font-mono font-medium text-fg">{opp.scoreBreakdown.easeOfCaptureScore} / 15</span>
                        </div>
                      </div>
                    </div>

                    {/* Overlap & Anti-Duplicate Check */}
                    <div className="rounded-xl border border-line bg-subtle/30 p-4 space-y-2.5">
                      <span className="font-semibold text-fg block text-xs">
                        Existing Website Overlap & Cannibalization Check
                      </span>
                      {opp.existingPageOverlap.length > 0 ? (
                        <div className="space-y-2">
                          {opp.existingPageOverlap.map((overlap, i) => (
                            <div key={i} className="text-xs space-y-0.5">
                              <span className="font-mono text-muted block truncate">{overlap.url}</span>
                              <p className="caption text-fg">{overlap.note}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="caption text-emerald-500 font-medium">
                          Zero overlap detected. Genuinely missing topic across all indexed pages.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer Questions & Related Terms */}
                  <div className="space-y-2">
                    <span className="font-semibold text-fg block text-xs">
                      Real Customer Questions to Answer in Page Body & FAQ Schema
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {opp.relatedCustomerQuestions.map((q, i) => (
                        <div key={i} className="rounded-lg border border-line bg-surface p-2.5 text-xs text-fg flex items-start gap-2">
                          <HelpCircle size={14} className="shrink-0 text-muted mt-0.5" />
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Internal Link Suggestions */}
                  {opp.recommendedInternalLinks.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-semibold text-fg block text-xs">
                        Recommended Internal Links to Add When Page is Published
                      </span>
                      <div className="space-y-2">
                        {opp.recommendedInternalLinks.map((rec, i) => (
                          <div key={i} className="rounded-lg border border-line bg-surface p-3 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-muted font-mono truncate">
                              <Link2 size={13} className="shrink-0" />
                              <span>{rec.sourceUrl}</span>
                            </div>
                            <div className="text-fg font-medium">
                              Anchor text: &quot;<span className="underline">{rec.recommendedAnchor}</span>&quot; ({rec.placementLocation})
                            </div>
                            <p className="caption text-muted text-[11px]">{rec.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

