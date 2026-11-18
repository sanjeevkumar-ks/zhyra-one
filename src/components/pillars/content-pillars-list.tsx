"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, PageTabs } from "@/components/ui";
import { ProgressBar } from "@/components/charts";
import {
  INITIAL_CONTENT_PILLARS,
} from "@/lib/content-pillars-data";
import type { ContentPillar } from "@/lib/content-pillars-types";
import { CreatePillarDialog } from "./create-pillar-dialog";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Globe,
  Layers,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export function ContentPillarsList() {
  const [pillars, setPillars] = useState<ContentPillar[]>(INITIAL_CONTENT_PILLARS);
  const [filter, setFilter] = useState<"all" | "high" | "needs">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Compact Overview Metrics
  const activePillars = pillars.length;
  const publishedContent = pillars.reduce((acc, p) => acc + p.publishedCount, 0);
  const plannedOpportunities = pillars.reduce((acc, p) => acc + p.plannedOpportunities, 0);
  const totalClicks = pillars.reduce((acc, p) => acc + p.performance.clicks28d, 0);

  const handlePillarCreated = (newPillar: ContentPillar) => {
    setPillars([newPillar, ...pillars]);
  };

  return (
    <div className="space-y-8">
      {/* Top Action & Overview Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="caption text-xs uppercase tracking-wider font-semibold text-muted block">
            Topical Authority Governance
          </span>
          <p className="caption text-xs text-muted mt-0.5">
            Organise all articles, landing pages, and search keyword clusters into strategic subject pillars.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0 self-start sm:self-center">
          <Plus size={16} strokeWidth={2} className="mr-1.5 shrink-0" />
          Create pillar
        </Button>
      </div>

      {/* 4 Compact Overview Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="caption text-xs">Active Pillars</span>
            <Layers size={16} strokeWidth={1.5} className="text-muted shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold text-fg font-sans">{activePillars}</div>
          <span className="caption text-[11px] text-muted">Strategic subjects</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="caption text-xs">Published Content</span>
            <FileCheck size={16} strokeWidth={1.5} className="text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold text-fg font-sans">{publishedContent}</div>
          <span className="caption text-[11px] text-muted">Live articles & pages</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="caption text-xs">Planned Opportunities</span>
            <Sparkles size={16} strokeWidth={1.5} className="text-amber-500 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold text-fg font-sans">{plannedOpportunities}</div>
          <span className="caption text-[11px] text-muted">In pipeline / queue</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="caption text-xs">Organic Clicks (28d)</span>
            <TrendingUp size={16} strokeWidth={1.5} className="text-blue-500 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold text-fg font-sans">{totalClicks.toLocaleString()}</div>
          <span className="caption text-[11px] text-emerald-500 font-medium">Search Console verified</span>
        </Card>
      </div>

      {/* Filter Tabs */}
      <PageTabs
        value={filter}
        onChange={setFilter}
        items={[
          { id: "all", label: "All pillars", count: pillars.length },
          {
            id: "high",
            label: "High coverage",
            count: pillars.filter((p) => p.coveragePercentage >= 60).length,
          },
          {
            id: "needs",
            label: "Needs coverage",
            count: pillars.filter((p) => p.coveragePercentage < 60).length,
          },
        ]}
        ariaLabel="Pillars authority filter"
      />

      {/* Pillars Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {pillars
          .filter((p) => {
            if (filter === "high") return p.coveragePercentage >= 60;
            if (filter === "needs") return p.coveragePercentage < 60;
            return true;
          })
          .map((pillar) => {
          return (
            <Card
              key={pillar.id}
              className="flex flex-col justify-between p-6 transition-all duration-150 hover:border-line-strong hover:shadow-xs space-y-5"
            >
              <div className="space-y-4">
                {/* Header: Title & Total Opportunities */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-lg font-semibold text-fg tracking-tight block truncate">
                      {pillar.name}
                    </span>
                    <p className="caption text-xs text-muted line-clamp-2 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold text-fg shrink-0">
                    {pillar.coveragePercentage}% covered
                  </span>
                </div>

                {/* Strategic Objective Quote Callout */}
                <div className="rounded-xl border border-line bg-subtle/30 p-3 text-xs text-muted">
                  <span className="font-semibold text-fg block text-[11px] uppercase tracking-wider mb-0.5">
                    Strategic Objective:
                  </span>
                  <p className="caption text-fg line-clamp-2 leading-relaxed">
                    {pillar.strategicObjective}
                  </p>
                </div>

                {/* Designated Pillar Page Card */}
                <div className="rounded-xl border border-line bg-surface p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="caption text-[10px] uppercase font-semibold tracking-wider text-muted flex items-center gap-1.5">
                      <BookOpen size={12} strokeWidth={1.5} />
                      Primary Pillar Page
                    </span>
                    {pillar.pillarPage.status === "published" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        Live & Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                        In Production
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-semibold text-fg block truncate">
                    {pillar.pillarPage.title}
                  </span>

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span className="font-mono text-[11px]">
                      Target: {pillar.pillarPage.primaryKeyword}
                    </span>
                    {pillar.pillarPage.wordCount && (
                      <span className="caption text-[11px]">
                        {pillar.pillarPage.wordCount.toLocaleString()} words
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Coverage Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-fg">Topical Coverage Progress</span>
                    <span className="caption font-mono text-muted">
                      {pillar.coveredOpportunities} of {pillar.totalOpportunities} opportunities
                    </span>
                  </div>
                  <ProgressBar pct={pillar.coveragePercentage} />
                  <div className="flex justify-between text-[11px] text-muted pt-0.5">
                    <span>{pillar.publishedCount} published</span>
                    <span>{pillar.inProductionOpportunities} in production</span>
                    <span>{pillar.totalOpportunities - pillar.coveredOpportunities} remaining</span>
                  </div>
                </div>
              </div>

              {/* Bottom Performance Snapshot & Workspace Action */}
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-fg font-mono block">
                      {pillar.performance.clicks28d.toLocaleString()}
                    </span>
                    <span className="caption text-[10px] text-muted">Monthly clicks</span>
                  </div>
                  <div className="h-4 w-px bg-line" />
                  <div>
                    <span className="font-semibold text-fg font-mono block">
                      {pillar.performance.top10KeywordsCount}
                    </span>
                    <span className="caption text-[10px] text-muted">Top 10 ranks</span>
                  </div>
                </div>

                <Link
                  href={`/topic-groups/${pillar.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-fg hover:border-line-strong hover:bg-subtle transition-all"
                >
                  Open workspace
                  <ArrowRight size={14} strokeWidth={1.5} className="shrink-0" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Pillar Modal */}
      <CreatePillarDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPillarCreated={handlePillarCreated}
      />
    </div>
  );
}

