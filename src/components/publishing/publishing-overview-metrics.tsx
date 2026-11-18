"use client";

import { Card } from "@/components/ui";
import type { PublishingMetrics } from "@/lib/publishing-types";
import { AlertCircle, Calendar, CheckCircle2, Globe, Layers } from "lucide-react";

interface PublishingOverviewMetricsProps {
  metrics: PublishingMetrics;
  onFilterFailed?: () => void;
  onFilterScheduled?: () => void;
}

export function PublishingOverviewMetrics({
  metrics,
  onFilterFailed,
  onFilterScheduled,
}: PublishingOverviewMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Connected Channels */}
      <Card className="p-5 transition-colors">
        <div className="flex items-center justify-between text-muted">
          <span className="text-sm font-medium">Connected channels</span>
          <Layers size={18} strokeWidth={1.5} className="text-muted" />
        </div>
        <p className="mt-2 text-[32px] font-normal leading-tight text-fg tabular-nums">
          {metrics.totalConnectedChannels}
        </p>
        <p className="caption mt-1 text-muted">
          Websites & social destinations
        </p>
      </Card>

      {/* 2. Scheduled Publications */}
      <Card
        onClick={onFilterScheduled}
        className={`p-5 transition-colors ${
          onFilterScheduled ? "cursor-pointer hover:bg-subtle/60" : ""
        }`}
      >
        <div className="flex items-center justify-between text-muted">
          <span className="text-sm font-medium">Scheduled publications</span>
          <Calendar size={18} strokeWidth={1.5} className="text-info" />
        </div>
        <p className="mt-2 text-[32px] font-normal leading-tight text-fg tabular-nums">
          {metrics.scheduledCount}
        </p>
        <p className="caption mt-1 text-muted">
          Upcoming across next 14 days
        </p>
      </Card>

      {/* 3. Published This Month */}
      <Card className="p-5 transition-colors">
        <div className="flex items-center justify-between text-muted">
          <span className="text-sm font-medium">Published this month</span>
          <CheckCircle2 size={18} strokeWidth={1.5} className="text-success" />
        </div>
        <p className="mt-2 text-[32px] font-normal leading-tight text-fg tabular-nums">
          {metrics.publishedThisMonth}
        </p>
        <p className="caption mt-1 text-muted">
          Confirmed live across all channels
        </p>
      </Card>

      {/* 4. Failed / Requiring Attention */}
      <Card
        onClick={onFilterFailed}
        className={`p-5 transition-colors ${
          metrics.failedCount > 0
            ? "border-danger/30 bg-danger-bg/20 cursor-pointer hover:bg-danger-bg/40"
            : ""
        }`}
      >
        <div className="flex items-center justify-between text-muted">
          <span className="text-sm font-medium">Failed / Needs attention</span>
          <AlertCircle
            size={18}
            strokeWidth={1.5}
            className={metrics.failedCount > 0 ? "text-danger" : "text-muted"}
          />
        </div>
        <p
          className={`mt-2 text-[32px] font-normal leading-tight tabular-nums ${
            metrics.failedCount > 0 ? "text-danger font-medium" : "text-fg"
          }`}
        >
          {metrics.failedCount}
        </p>
        <p className="caption mt-1 text-muted">
          {metrics.failedCount > 0
            ? "Requires review & retry"
            : "All channels delivering normally"}
        </p>
      </Card>
    </div>
  );
}

