"use client";

import { useState } from "react";
import { Badge, Button, Card, Table, Td, Th, trClass } from "@/components/ui";
import { Drawer, toast } from "@/components/ui-client";
import { SelectDropdown } from "@/components/ui-form";
import {
  ALL_PAGE_TYPES,
  type PageType,
  type WebsitePage,
} from "@/lib/website-intelligence-types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Link2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

interface PageDetailDrawerProps {
  page: WebsitePage | null;
  onClose: () => void;
  onTypeChange?: (pageId: string, newType: PageType) => void;
  onOpenEditor?: (pageId: string) => void;
}

type TabKey = "overview" | "performance" | "keywords" | "technical" | "links" | "ai" | "recommendations";

export function PageDetailDrawer({
  page,
  onClose,
  onTypeChange,
  onOpenEditor,
}: PageDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  if (!page) return null;

  const handleTypeSelect = (newType: string) => {
    onTypeChange?.(page.id, newType as PageType);
    toast(`Classification updated to ${newType}`);
  };

  const handleAction = (label: string) => {
    toast(`Action triggered: ${label}`);
  };

  return (
    <Drawer
      open={true}
      onClose={onClose}
      width={680}
      title={
        <div className="space-y-1.5 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted truncate max-w-sm">
              {page.url}
            </span>
            <a
              href={page.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-muted hover:text-fg"
              title="View live website page"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
            </a>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-fg tracking-tight leading-snug line-clamp-2">
            {page.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="caption">Classification:</span>
              <div className="w-36">
                <SelectDropdown
                  value={page.userOverriddenType || page.pageType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className="!h-7 !min-h-7 text-xs !rounded-md py-0.5"
                  options={ALL_PAGE_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>
            </div>

            {page.indexingStatus === "Indexable" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <CheckCircle2 size={12} strokeWidth={2} />
                Indexable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
                <AlertTriangle size={12} strokeWidth={2} />
                {page.indexingStatus}
              </span>
            )}

            <span className="caption text-xs">
              Crawled {new Date(page.lastCrawledAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={() => window.open(page.url, "_blank")}>
            <ExternalLink size={16} strokeWidth={1.5} className="mr-1.5 shrink-0" />
            Live page
          </Button>

          <Button
            onClick={() => {
              onOpenEditor?.(page.id);
              onClose();
            }}
          >
            <Sparkles size={16} strokeWidth={1.5} className="mr-1.5 shrink-0" />
            Optimise in Page Editor
          </Button>
        </div>
      }
    >
      <div className="-mx-6 -mt-5">
        {/* Tab Navigation */}
        <div className="flex border-b border-line px-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Content" },
            { id: "performance", label: "Search Metrics" },
            { id: "keywords", label: "Keywords & Intent" },
            { id: "technical", label: "Technical & Schema" },
            { id: "links", label: "Internal Links" },
            { id: "ai", label: "AI Citations" },
            { id: "recommendations", label: "Recommendations" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={`whitespace-nowrap py-3 px-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-fg text-fg font-semibold"
                  : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & CONTENT */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-3.5">
                  <span className="caption text-xs">Word Count</span>
                  <div className="mt-1 text-xl font-bold text-fg">{page.wordCount.toLocaleString()}</div>
                  <span className="caption text-[11px] text-muted">Estimated reading: {Math.ceil(page.wordCount / 200)} min</span>
                </Card>
                <Card className="p-3.5">
                  <span className="caption text-xs">Primary Search Intent</span>
                  <div className="mt-1 text-base font-semibold capitalize text-fg">{page.searchIntent}</div>
                  <span className="caption text-[11px] text-muted">{page.primaryTopic}</span>
                </Card>
                <Card className="p-3.5">
                  <span className="caption text-xs">Discovered Via</span>
                  <div className="mt-1 text-base font-semibold capitalize text-fg">{page.discoveredVia.replace("_", " ")}</div>
                  <span className="caption text-[11px] text-muted">Verified canonical</span>
                </Card>
              </div>

              {/* Headings Hierarchy */}
              <div className="space-y-3">
                <span className="text-sm font-semibold text-fg">Heading Hierarchy Structure</span>
                <Card className="p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex items-start gap-2">
                    <span className="rounded bg-sunken px-1.5 py-0.5 font-bold text-fg">H1</span>
                    <span className="text-fg">{page.headings.h1}</span>
                  </div>
                  {page.headings.h2s.map((h2) => (
                    <div key={h2} className="flex items-start gap-2 pl-4">
                      <span className="rounded bg-subtle px-1.5 py-0.5 text-muted">H2</span>
                      <span className="text-fg">{h2}</span>
                    </div>
                  ))}
                  {page.headings.h3s.map((h3) => (
                    <div key={h3} className="flex items-start gap-2 pl-8">
                      <span className="rounded bg-subtle px-1.5 py-0.5 text-muted text-[10px]">H3</span>
                      <span className="text-muted">{h3}</span>
                    </div>
                  ))}
                </Card>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-fg">Page Content Snapshot</span>
                <div className="rounded-xl border border-line bg-subtle/40 p-4 text-xs text-muted leading-relaxed">
                  {page.contentPreview}
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-fg">Meta Description</span>
                <div className="rounded-xl border border-line bg-surface p-4 text-xs text-fg">
                  {page.metaDescription}
                  <span className="caption block text-[11px] text-muted mt-2">
                    Length: {page.metaDescription.length} characters (Recommended: 150–160)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                <Card className="p-3.5">
                  <span className="caption text-xs">Organic Clicks</span>
                  <div className="mt-1 text-2xl font-bold text-fg">{page.performance.clicks.toLocaleString()}</div>
                  <span className="caption text-[11px] text-emerald-500 font-medium">Last 28 days</span>
                </Card>
                <Card className="p-3.5">
                  <span className="caption text-xs">Impressions</span>
                  <div className="mt-1 text-2xl font-bold text-fg">{page.performance.impressions.toLocaleString()}</div>
                  <span className="caption text-[11px] text-muted">In Google SERP</span>
                </Card>
                <Card className="p-3.5">
                  <span className="caption text-xs">Average CTR</span>
                  <div className="mt-1 text-2xl font-bold text-fg">{page.performance.ctr}%</div>
                  <span className="caption text-[11px] text-muted">Click-through rate</span>
                </Card>
                <Card className="p-3.5">
                  <span className="caption text-xs">Average Position</span>
                  <div className="mt-1 text-2xl font-bold text-fg">#{page.performance.position}</div>
                  <span className="caption text-[11px] text-muted">Google UK</span>
                </Card>
              </div>

              <Card className="p-5 space-y-3">
                <span className="text-sm font-semibold text-fg">Traffic Insights & Opportunity</span>
                <p className="caption text-xs leading-relaxed">
                  This page ranks #{page.performance.position} on average. With {page.performance.impressions.toLocaleString()} monthly impressions, optimizing title tags and adding comprehensive FAQ schema could elevate CTR to ~8.5%, generating approximately {Math.round(page.performance.impressions * 0.085 - page.performance.clicks).toLocaleString()} additional monthly clicks.
                </p>
              </Card>
            </div>
          )}

          {/* TAB 3: KEYWORDS & INTENT */}
          {activeTab === "keywords" && (
            <div className="space-y-6">
              <div>
                <span className="text-sm font-semibold text-fg">Primary Target Keyword</span>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-line bg-subtle/50 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-fg">{page.primaryKeyword}</span>
                    <Badge tone="info" className="text-xs capitalize">{page.searchIntent}</Badge>
                  </div>
                  <span className="caption text-xs">Primary mapping</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold text-fg">Secondary Keyword Associations</span>
                <div className="mt-2 space-y-1.5">
                  {page.secondaryKeywords.map((kw) => (
                    <div key={kw} className="flex items-center justify-between rounded-lg border border-line p-2.5 text-xs">
                      <span className="font-mono text-fg">{kw}</span>
                      <span className="caption text-muted">Associated</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL SEO */}
          {activeTab === "technical" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-sm font-semibold text-fg">Indexing & Directives</span>
                <div className="divide-y divide-line rounded-xl border border-line bg-surface text-xs">
                  <div className="flex justify-between p-3">
                    <span className="text-muted">Canonical URL</span>
                    <span className="font-mono text-fg truncate max-w-xs">{page.canonicalUrl}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted">Canonical Match</span>
                    <span className="font-medium text-emerald-500">{page.isCanonical ? "Self-canonical (Verified)" : "Differs from URL"}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted">Robots Meta Directive</span>
                    <span className="font-mono text-fg">{page.indexingStatus === "Noindex" ? "noindex, follow" : "index, follow"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-fg">Structured Data Schemas ({page.structuredData.length})</span>
                {page.structuredData.length > 0 ? (
                  <div className="space-y-2">
                    {page.structuredData.map((sd) => (
                      <div key={sd.type} className="rounded-xl border border-line bg-subtle/30 p-3.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-fg">{sd.type}</span>
                          <span className="text-emerald-500 font-medium">Valid Schema.org</span>
                        </div>
                        <p className="caption text-xs mt-1 text-muted">{sd.propertiesSummary}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">
                    No Schema.org structured data detected on this page.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: INTERNAL LINKS */}
          {activeTab === "links" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-sm font-semibold text-fg">Incoming Internal Links ({page.incomingLinks.length})</span>
                {page.incomingLinks.length > 0 ? (
                  <div className="space-y-2">
                    {page.incomingLinks.map((link, idx) => (
                      <div key={idx} className="rounded-xl border border-line p-3 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-muted font-mono truncate">
                          <Link2 size={13} className="shrink-0" />
                          <span>{link.url}</span>
                        </div>
                        <div className="text-fg font-medium">Anchor: &quot;{link.anchorText}&quot;</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-500">
                    Orphan page warning: Zero incoming internal links detected from main navigation or sitemap pillars.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-fg">Outgoing Internal Links ({page.outgoingLinks.length})</span>
                <div className="space-y-2">
                  {page.outgoingLinks.map((link, idx) => (
                    <div key={idx} className="rounded-xl border border-line p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-muted font-mono truncate">
                        <ArrowRight size={13} className="shrink-0" />
                        <span>{link.url}</span>
                      </div>
                      <div className="text-fg font-medium">Anchor: &quot;{link.anchorText}&quot;</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI VISIBILITY */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="p-4">
                  <span className="caption text-xs">AI Citations</span>
                  <div className="mt-1 text-2xl font-bold text-fg">{page.aiVisibility.citedInQuestions}</div>
                  <span className="caption text-[11px] text-muted">Cited as source answer in AI search</span>
                </Card>
                <Card className="p-4">
                  <span className="caption text-xs">Brand Mention Rate</span>
                  <div className="mt-1 text-2xl font-bold text-fg">{page.aiVisibility.brandMentionRate}%</div>
                  <span className="caption text-[11px] text-muted">Across monitored prompts</span>
                </Card>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-fg">Active AI Engines Citing This URL</span>
                <div className="flex flex-wrap gap-2">
                  {page.aiVisibility.platforms.map((plat) => (
                    <span key={plat} className="rounded-full bg-sunken px-3 py-1 text-xs font-medium text-fg">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: RECOMMENDATIONS */}
          {activeTab === "recommendations" && (
            <div className="space-y-4">
              <span className="text-sm font-semibold text-fg">Tailored Page Improvement Plan</span>

              {page.issues.length > 0 && (
                <div className="space-y-2">
                  {page.issues.map((iss, i) => (
                    <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs space-y-1">
                      <div className="flex items-center gap-2 text-amber-500 font-semibold">
                        <AlertTriangle size={14} />
                        <span>{iss.message}</span>
                      </div>
                      <p className="text-muted mt-1">{iss.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between rounded-xl border border-line p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-fg block">Add FAQ Section with Schema</span>
                    <span className="caption text-muted">Answers conversational long-tail queries and unlocks Google SERP FAQ rich snippets.</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAction("Add FAQ section")}>
                    Add section
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-fg block">Strengthen Internal Links</span>
                    <span className="caption text-muted">Recommend 2 links from high-performing blog guides to boost page rank.</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAction("Generate internal link anchors")}>
                    Suggest links
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

