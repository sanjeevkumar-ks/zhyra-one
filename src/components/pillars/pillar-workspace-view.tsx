"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, PageTabs, Table, Td, Th, trClass } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { ProgressBar } from "@/components/charts";
import { SearchInput, SelectDropdown } from "@/components/ui-form";
import {
  PILLAR_CONTENT_MAP,
  PILLAR_LINKS_MAP,
  PILLAR_OPPORTUNITIES_MAP,
} from "@/lib/content-pillars-data";
import type {
  ContentPillar,
  PillarContentItem,
  PillarInternalLink,
  PillarOpportunityItem,
} from "@/lib/content-pillars-types";
import { AddExistingContentDialog } from "./add-existing-content-dialog";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";

interface PillarWorkspaceViewProps {
  pillar: ContentPillar;
}

type TabType = "overview" | "content" | "opportunities" | "performance";

export function PillarWorkspaceView({ pillar }: PillarWorkspaceViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [contentList, setContentList] = useState<PillarContentItem[]>(
    PILLAR_CONTENT_MAP[pillar.id] || []
  );
  const [opportunities, setOpportunities] = useState<PillarOpportunityItem[]>(
    PILLAR_OPPORTUNITIES_MAP[pillar.id] || []
  );
  const [internalLinks, setInternalLinks] = useState<PillarInternalLink[]>(
    PILLAR_LINKS_MAP[pillar.id] || []
  );
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);

  // Content Table Filters
  const [contentSearch, setContentSearch] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");

  const filteredContent = contentList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
      item.primaryKeyword.toLowerCase().includes(contentSearch.toLowerCase());
    const matchesType = contentTypeFilter === "all" || item.type === contentTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleAttachExisting = (item: PillarContentItem) => {
    setContentList([...contentList, item]);
  };

  const handleDetachContent = (id: string | number) => {
    setContentList(contentList.filter((c) => c.id !== id));
    toast("Item detached from this content pillar");
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/topic-groups"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg font-medium transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to all Content Pillars
        </Link>

        <span className="caption text-xs text-muted font-mono">
          Pillar ID: #{pillar.id}
        </span>
      </div>

      {/* Pillar Workspace Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="caption text-xs uppercase tracking-wider font-semibold text-muted">
              Content Pillar Workspace
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
              {pillar.coveragePercentage}% Covered
            </span>
          </div>

          <h1 className="h1">{pillar.name}</h1>
          <p className="caption text-xs text-muted max-w-3xl leading-relaxed">
            {pillar.description}
          </p>
        </div>

        {/* Quick Content Creation Triggers */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddExistingOpen(true)}
          >
            Attach existing
          </Button>

          <Link
            href={`/articles/new?pillarId=${pillar.id}&pillarName=${encodeURIComponent(pillar.name)}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-fg px-3.5 py-2 text-xs font-medium text-bg hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2} />
            Create content
          </Link>
        </div>
      </div>

      {/* 4 Workspace Navigation Tabs */}
      <PageTabs
        value={activeTab}
        onChange={(v) => setActiveTab(v as TabType)}
        items={[
          { id: "overview", label: "Overview & Structure", icon: Layers },
          { id: "content", label: "Associated Content", count: contentList.length, icon: FileText },
          { id: "opportunities", label: "Strategic Opportunities", count: opportunities.length, icon: Sparkles },
          { id: "performance", label: "Search & AI Performance", icon: TrendingUp },
        ]}
        ariaLabel="Pillar workspace tabs"
      />

      {/* ============================================================= */}
      {/* TAB 1: OVERVIEW & STRUCTURE                                  */}
      {/* ============================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Strategic Attributes Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5 space-y-3">
              <span className="caption text-xs font-semibold uppercase tracking-wider text-muted block">
                Strategic Business Objective
              </span>
              <p className="text-sm font-medium text-fg leading-relaxed">
                {pillar.strategicObjective}
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <span className="caption text-xs font-semibold uppercase tracking-wider text-muted block">
                Target Audience Persona
              </span>
              <p className="text-sm font-medium text-fg leading-relaxed">
                {pillar.targetAudience}
              </p>
            </Card>
          </div>

          {/* Primary Pillar Page & Visual Cluster Map */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Visual Topology Cluster */}
            <Card className="p-6 lg:col-span-2 space-y-4">
              <div>
                <span className="text-base font-semibold text-fg block">
                  Topical Cluster Architecture Map
                </span>
                <p className="caption text-xs mt-0.5">
                  Parent pillar page anchoring connected supporting articles, category pages, and missing gaps.
                </p>
              </div>

              <div className="flex flex-col items-center pt-2">
                {/* Central Pillar Page Node */}
                <div className="w-full max-w-md rounded-2xl border-2 border-fg bg-surface p-4 text-center shadow-xs space-y-1 relative">
                  <span className="caption text-[10px] uppercase font-bold tracking-wider text-fg flex items-center justify-center gap-1.5">
                    <BookOpen size={12} strokeWidth={2} />
                    Primary Pillar Page
                  </span>
                  <span className="text-sm font-semibold text-fg block">
                    {pillar.pillarPage.title}
                  </span>
                  <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                    <Badge tone="success" className="text-[10px]">
                      Live & Published
                    </Badge>
                    <span className="font-mono text-muted text-[11px]">
                      {pillar.pillarPage.primaryKeyword}
                    </span>
                  </div>
                </div>

                {/* Connecting Graph Trunk */}
                <div className="h-6 w-px bg-line-strong" />
                <div className="h-px w-[85%] bg-line-strong" />

                {/* Supporting Child Nodes Grid */}
                <div className="grid w-full grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                  {contentList.slice(1, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-line bg-surface p-3 text-xs space-y-1 hover:border-line-strong transition-colors"
                    >
                      <span className="rounded bg-sunken px-1.5 py-0.5 text-[9px] font-medium text-muted uppercase">
                        {item.type}
                      </span>
                      <span className="font-medium text-fg block truncate">{item.title}</span>
                      <span className="caption text-[10px] text-muted block truncate font-mono">
                        {item.primaryKeyword}
                      </span>
                    </div>
                  ))}

                  {/* Missing Gap Nodes */}
                  {opportunities.slice(0, 3).map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-xl border border-dashed border-line-strong bg-subtle/20 p-3 text-xs space-y-1"
                    >
                      <span className="rounded bg-sunken px-1.5 py-0.5 text-[9px] font-medium text-amber-500 uppercase">
                        Missing Gap
                      </span>
                      <span className="font-medium text-muted block truncate">{opp.title}</span>
                      <span className="caption text-[10px] text-muted block truncate font-mono">
                        ~{opp.searchVolume.toLocaleString()} /mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Coverage Breakdown Meter */}
            <div className="space-y-5">
              <Card className="p-5 space-y-4">
                <div>
                  <span className="caption text-xs font-semibold uppercase tracking-wider text-muted block">
                    Topical Coverage Progress
                  </span>
                  <div className="mt-2 text-3xl font-bold text-fg font-sans">
                    {pillar.coveredOpportunities}{" "}
                    <span className="text-base font-normal text-muted">of {pillar.totalOpportunities}</span>
                  </div>
                  <span className="caption text-xs text-muted">strategic search opportunities addressed</span>
                </div>

                <ProgressBar pct={pillar.coveragePercentage} />

                <div className="space-y-2 text-xs pt-2 border-t border-line">
                  <div className="flex justify-between">
                    <span className="text-muted">Covered & Published</span>
                    <span className="font-mono font-medium text-emerald-500">{pillar.coveredOpportunities} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">In Production / Planned</span>
                    <span className="font-mono font-medium text-blue-500">{pillar.inProductionOpportunities + pillar.plannedOpportunities} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Unaddressed Gaps</span>
                    <span className="font-mono font-medium text-amber-500">{pillar.totalOpportunities - pillar.coveredOpportunities} items</span>
                  </div>
                </div>
              </Card>

              {/* Organic Performance Card */}
              <Card className="p-5 space-y-2">
                <span className="caption text-xs font-semibold uppercase tracking-wider text-muted block">
                  Cluster Organic Search Impact
                </span>
                <div className="text-3xl font-bold text-fg font-sans">
                  {pillar.performance.clicks28d.toLocaleString()}
                </div>
                <span className="caption text-xs text-emerald-500 font-medium block">
                  +{pillar.performance.clicksChangePct}% organic clicks vs previous 28d
                </span>
              </Card>
            </div>
          </div>

          {/* Recommended Next Strategic Actions */}
          <div className="space-y-3">
            <div>
              <span className="text-base font-semibold text-fg block">
                Recommended Actions for Authority Expansion
              </span>
              <p className="caption text-xs mt-0.5">
                Prioritized by potential topical authority increase, ease of capture, and relevance.
              </p>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <thead>
                  <tr>
                    <Th>Recommended Action</Th>
                    <Th>Impact</Th>
                    <Th>Effort</Th>
                    <Th>Rationale</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {pillar.recommendedActions.map((rec) => (
                    <tr key={rec.id} className={trClass}>
                      <Td className="font-medium text-fg max-w-sm">{rec.action}</Td>
                      <Td><Badge tone={rec.impact === "High" ? "success" : "info"}>{rec.impact}</Badge></Td>
                      <Td><Badge tone="neutral">{rec.effort}</Badge></Td>
                      <Td className="caption text-muted max-w-md">{rec.rationale}</Td>
                      <Td className="text-right">
                        <Link
                          href={rec.href}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:underline"
                        >
                          Start action
                          <ArrowRight size={13} strokeWidth={2} />
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: ASSOCIATED CONTENT                                    */}
      {/* ============================================================= */}
      {activeTab === "content" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-64">
                <SearchInput
                  placeholder="Filter content by title or keyword..."
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  onClear={() => setContentSearch("")}
                  className="!h-8 !min-h-8 !rounded-full text-xs"
                />
              </div>

              <div className="w-36">
                <SelectDropdown
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value)}
                  className="!h-8 !min-h-8 !rounded-full text-xs py-1"
                  options={[
                    { value: "all", label: "All types" },
                    { value: "article", label: "Articles only" },
                    { value: "page", label: "Pages only" },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddExistingOpen(true)}
              >
                + Attach existing content
              </Button>

              <Link
                href={`/articles/new?pillarId=${pillar.id}`}
                className="inline-flex items-center gap-1 rounded-xl bg-fg px-3 py-1.5 text-xs font-medium text-bg hover:opacity-90"
              >
                <Plus size={13} strokeWidth={2} />
                New supporting article
              </Link>
            </div>
          </div>

          {/* Associated Content Table */}
          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Content Item</Th>
                  <Th>Type</Th>
                  <Th>Role</Th>
                  <Th>Target Keyword</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Organic Clicks</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => (
                  <tr key={item.id} className={trClass}>
                    <Td className="max-w-xs md:max-w-sm">
                      <div className="min-w-0">
                        <span className="font-semibold text-fg block truncate text-sm">
                          {item.title}
                        </span>
                        {item.url && (
                          <span className="caption font-mono text-[11px] text-muted block truncate mt-0.5">
                            {item.url.replace("https://verdantbotanics.com", "")}
                          </span>
                        )}
                      </div>
                    </Td>

                    <Td>
                      <span className="rounded bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted uppercase">
                        {item.pageType || item.type}
                      </span>
                    </Td>

                    <Td>
                      {item.isPillarPage ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-fg px-2.5 py-0.5 text-[10px] font-semibold text-bg">
                          <BookOpen size={10} />
                          Pillar Page
                        </span>
                      ) : (
                        <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-medium text-muted">
                          Supporting Content
                        </span>
                      )}
                    </Td>

                    <Td className="font-mono text-xs text-fg">
                      {item.primaryKeyword}
                    </Td>

                    <Td>
                      <Badge
                        tone={
                          item.status === "published"
                            ? "success"
                            : item.status === "review"
                            ? "warning"
                            : "info"
                        }
                        className="capitalize"
                      >
                        {item.status}
                      </Badge>
                    </Td>

                    <Td className="text-right font-mono text-xs font-semibold text-fg">
                      {item.clicks28d ? item.clicks28d.toLocaleString() : "—"}
                    </Td>

                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.type === "article" ? (
                          <Link
                            href={`/articles/${item.id}`}
                            className="text-xs font-medium text-muted hover:text-fg hover:underline"
                          >
                            Edit
                          </Link>
                        ) : (
                          <Link
                            href={`/pages/${item.id}`}
                            className="text-xs font-medium text-muted hover:text-fg hover:underline"
                          >
                            Edit
                          </Link>
                        )}

                        {!item.isPillarPage && (
                          <button
                            type="button"
                            onClick={() => handleDetachContent(item.id)}
                            className="text-xs font-medium text-muted hover:text-danger hover:underline"
                          >
                            Detach
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: STRATEGIC OPPORTUNITIES                               */}
      {/* ============================================================= */}
      {activeTab === "opportunities" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <span className="text-base font-semibold text-fg block">
              Keyword Gaps & Unaddressed Customer Search Intent
            </span>
            <p className="caption text-xs mt-0.5">
              Identified search demand within this pillar that has not yet been satisfied by an existing URL.
            </p>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Opportunity Title</Th>
                  <Th>Target Keyword</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Search Volume</Th>
                  <Th className="text-center">Priority</Th>
                  <Th>Coverage Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} className={trClass}>
                    <Td className="max-w-xs md:max-w-sm">
                      <span className="font-semibold text-fg block text-sm">{opp.title}</span>
                      {opp.customerQuestion && (
                        <p className="caption text-xs text-muted mt-0.5">
                          Q: &quot;{opp.customerQuestion}&quot;
                        </p>
                      )}
                    </Td>

                    <Td className="font-mono text-xs text-fg">{opp.targetKeyword}</Td>

                    <Td>
                      <span className="rounded bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted capitalize">
                        {opp.suggestedPageType || opp.contentType}
                      </span>
                    </Td>

                    <Td className="text-right font-mono text-xs text-fg font-semibold">
                      {opp.searchVolume.toLocaleString()} /mo
                    </Td>

                    <Td className="text-center">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                        {opp.priorityScore}/100
                      </span>
                    </Td>

                    <Td>
                      <Badge
                        tone={
                          opp.status === "covered" || opp.status === "published"
                            ? "success"
                            : opp.status === "planned"
                            ? "info"
                            : "warning"
                        }
                        className="capitalize"
                      >
                        {opp.status.replace("_", " ")}
                      </Badge>
                    </Td>

                    <Td className="text-right">
                      {opp.status === "covered" ? (
                        <a
                          href={opp.coveredByUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg hover:underline"
                        >
                          View page <ExternalLink size={12} />
                        </a>
                      ) : opp.contentType === "page" ? (
                        <Link
                          href={`/pages/new?keyword=${encodeURIComponent(opp.targetKeyword)}`}
                          className="text-xs font-semibold text-fg hover:underline"
                        >
                          Build page
                        </Link>
                      ) : (
                        <Link
                          href={`/articles/new?keyword=${encodeURIComponent(opp.targetKeyword)}&pillarId=${pillar.id}`}
                          className="text-xs font-semibold text-fg hover:underline"
                        >
                          Create article
                        </Link>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Internal Link Suggestions */}
          <div className="space-y-3 pt-2">
            <div>
              <span className="text-base font-semibold text-fg block">
                Topical Internal Link Blueprint
              </span>
              <p className="caption text-xs mt-0.5">
                Strategic links that connect supporting child content back to the primary pillar page.
              </p>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <thead>
                  <tr>
                    <Th>Source Page</Th>
                    <Th>Destination Target</Th>
                    <Th>Recommended Anchor Text</Th>
                    <Th>Strategic Rationale</Th>
                    <Th className="text-center">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {internalLinks.map((link, idx) => (
                    <tr key={idx} className={trClass}>
                      <Td className="font-medium text-fg text-xs">{link.sourceTitle}</Td>
                      <Td className="font-semibold text-fg text-xs">{link.targetTitle}</Td>
                      <Td>
                        <span className="rounded bg-sunken px-2 py-0.5 font-mono text-xs font-semibold text-fg">
                          &quot;{link.recommendedAnchor}&quot;
                        </span>
                      </Td>
                      <Td className="caption text-muted text-xs max-w-sm">{link.rationale}</Td>
                      <Td className="text-center">
                        {link.status === "implemented" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                            <CheckCircle2 size={11} strokeWidth={2.5} />
                            Implemented
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                            Recommended
                          </span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: SEARCH & AI PERFORMANCE                               */}
      {/* ============================================================= */}
      {activeTab === "performance" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Performance KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <span className="caption text-xs">Organic Clicks</span>
              <div className="mt-1 text-2xl font-bold text-fg font-sans">
                {pillar.performance.clicks28d.toLocaleString()}
              </div>
              <span className="caption text-[11px] text-emerald-500 font-medium">
                +{pillar.performance.clicksChangePct}% vs previous 28d
              </span>
            </Card>

            <Card className="p-4">
              <span className="caption text-xs">SERP Impressions</span>
              <div className="mt-1 text-2xl font-bold text-fg font-sans">
                {pillar.performance.impressions28d.toLocaleString()}
              </div>
              <span className="caption text-[11px] text-emerald-500 font-medium">
                +{pillar.performance.impressionsChangePct}% vs previous 28d
              </span>
            </Card>

            <Card className="p-4">
              <span className="caption text-xs">Average Position</span>
              <div className="mt-1 text-2xl font-bold text-fg font-sans">
                #{pillar.performance.avgPosition}
              </div>
              <span className="caption text-[11px] text-muted">Across cluster keywords</span>
            </Card>

            <Card className="p-4">
              <span className="caption text-xs">Keywords in Top 10</span>
              <div className="mt-1 text-2xl font-bold text-fg font-sans">
                {pillar.performance.top10KeywordsCount}
              </div>
              <span className="caption text-[11px] text-muted">
                {pillar.performance.rankingKeywordsCount} total ranked
              </span>
            </Card>
          </div>

          {/* AI Citations Callout */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-sm font-semibold text-fg">Conversational AI Engine Visibility</span>
              </div>
              <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold text-fg">
                {pillar.performance.aiVisibility.mentionRate}% Brand Mention Rate
              </span>
            </div>

            <p className="caption text-xs leading-relaxed text-muted">
              In synthesized answer tests across ChatGPT, Claude, and Perplexity, this content pillar is cited in{" "}
              <span className="font-semibold text-fg">{pillar.performance.aiVisibility.citationsCount}</span> distinct queries out of{" "}
              {pillar.performance.aiVisibility.monitoredQuestionsCount} monitored topic prompts.
            </p>
          </Card>
        </div>
      )}

      {/* Attach Existing Content Modal */}
      <AddExistingContentDialog
        open={isAddExistingOpen}
        onClose={() => setIsAddExistingOpen(false)}
        pillarName={pillar.name}
        onContentAttached={handleAttachExisting}
      />
    </div>
  );
}

