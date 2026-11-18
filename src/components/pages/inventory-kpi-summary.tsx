"use client";

import { Card } from "@/components/ui";
import type { WebsitePage } from "@/lib/website-intelligence-types";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Globe,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface InventoryKpiSummaryProps {
  pages: WebsitePage[];
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export function InventoryKpiSummary({
  pages,
  activeFilter,
  onSelectFilter,
}: InventoryKpiSummaryProps) {
  const total = pages.length;
  const indexable = pages.filter((p) => p.indexingStatus === "Indexable").length;
  const nonIndexable = pages.filter((p) => p.indexingStatus !== "Indexable").length;
  const withTraffic = pages.filter((p) => p.performance.clicks > 0).length;
  const zeroTraffic = pages.filter((p) => p.performance.clicks === 0).length;
  const needingImprovement = pages.filter(
    (p) =>
      p.issues.length > 0 ||
      (p.performance.impressions > 10000 && p.performance.ctr < 4) ||
      p.indexingStatus !== "Indexable"
  ).length;
  const highAiCitation = pages.filter((p) => p.aiVisibility.citedInQuestions > 10).length;

  const kpis = [
    {
      id: "all",
      label: "Discovered URLs",
      value: total,
      subtext: "Tracked in inventory",
      icon: Globe,
      color: "text-fg",
    },
    {
      id: "indexable",
      label: "Indexable Pages",
      value: indexable,
      subtext: `${Math.round((indexable / total) * 100)}% crawl health`,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      id: "non_indexable",
      label: "Blocked / Non-Indexable",
      value: nonIndexable,
      subtext: nonIndexable > 0 ? "Requires review" : "No blockers",
      icon: AlertTriangle,
      color: nonIndexable > 0 ? "text-amber-500" : "text-muted",
    },
    {
      id: "with_traffic",
      label: "Organic Traffic Generating",
      value: withTraffic,
      subtext: `${pages.reduce((acc, p) => acc + p.performance.clicks, 0).toLocaleString()} monthly clicks`,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      id: "needs_improvement",
      label: "Requiring Improvement",
      value: needingImprovement,
      subtext: "Low CTR or issues",
      icon: TrendingDown,
      color: needingImprovement > 0 ? "text-amber-500" : "text-muted",
    },
    {
      id: "ai_citations",
      label: "High AI Visibility",
      value: highAiCitation,
      subtext: "Cited in 10+ AI answers",
      icon: Sparkles,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.id;

        return (
          <button
            key={kpi.id}
            type="button"
            onClick={() => onSelectFilter?.(kpi.id)}
            className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
              isSelected
                ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                : "border-line bg-surface hover:border-line-strong hover:bg-subtle/50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="caption text-xs font-medium text-muted truncate">
                {kpi.label}
              </span>
              <Icon size={16} strokeWidth={1.5} className={`shrink-0 ${kpi.color}`} />
            </div>

            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-fg font-sans">
                {kpi.value}
              </span>
              <span className="caption block text-[11px] text-muted truncate mt-0.5">
                {kpi.subtext}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

