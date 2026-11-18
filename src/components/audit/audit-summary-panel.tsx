"use client";

import { Button, Badge } from "@/components/ui";
import type { AuditRecord } from "@/lib/audit-types";
import { Calendar, CheckCircle2, History, RotateCcw, ScanSearch, Settings, Sparkles } from "lucide-react";

interface AuditSummaryPanelProps {
  audit: AuditRecord;
  onRunAudit: () => void;
  onViewHistory: () => void;
  onConfigureSchedule: () => void;
  isOutdated?: boolean;
}

export function AuditSummaryPanel({
  audit,
  onRunAudit,
  onViewHistory,
  onConfigureSchedule,
  isOutdated = false,
}: AuditSummaryPanelProps) {
  const completedDate = audit.completedAt
    ? new Date(audit.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  const nextScheduledText = audit.nextScheduledAudit
    ? new Date(audit.nextScheduledAudit).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : audit.schedule === "manual"
    ? "Manual only"
    : "Weekly";

  return (
    <div className="space-y-4">
      {/* Outdated Notice Banner if applicable */}
      {isOutdated && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning-bg p-4 text-sm text-warning-fg">
          <div>
            <span className="font-medium">Previous audit is outdated:</span> This crawl data was collected over 30 days ago. Your site structure or content may have changed.
          </div>
          <Button size="sm" onClick={onRunAudit} className="shrink-0">
            Run fresh audit
          </Button>
        </div>
      )}

      {/* Main Status Panel */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-bg text-success-fg">
              <CheckCircle2 size={18} strokeWidth={2} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-fg">{audit.websiteUrl}</span>
                <Badge tone={isOutdated ? "warning" : "success"}>
                  {isOutdated ? "Outdated" : "Audit completed"}
                </Badge>
                {audit.isDemo && (
                  <Badge tone="outline" className="border-dashed">
                    Demo baseline
                  </Badge>
                )}
              </div>
              <p className="caption mt-0.5">
                Last completed: <span className="font-medium text-fg">{completedDate}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button size="sm" variant="outline" onClick={onViewHistory} className="gap-1.5">
              <History size={15} strokeWidth={1.5} />
              View audit history
            </Button>
            <Button size="sm" onClick={onRunAudit} className="gap-1.5">
              <ScanSearch size={15} strokeWidth={2} />
              Run new audit
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
          <div>
            <span className="caption block">Pages crawled</span>
            <span className="text-xl font-normal text-fg tabular-nums">{audit.crawledPages}</span>
            <span className="caption block mt-0.5 text-muted">from {audit.discoveredPages} discovered</span>
          </div>

          <div>
            <span className="caption block">Issues discovered</span>
            <span className="text-xl font-normal text-fg tabular-nums">{audit.issueCounts.total}</span>
            <span className="caption block mt-0.5 text-muted">
              {audit.issueCounts.critical} critical · {audit.issueCounts.high} high
            </span>
          </div>

          <div>
            <span className="caption block">Resolved since previous</span>
            <span className="text-xl font-normal text-success tabular-nums">
              +{audit.resolvedSincePrevious}
            </span>
            <span className="caption block mt-0.5 text-muted">verified via recheck</span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="caption block">Next scheduled audit</span>
              <button
                type="button"
                onClick={onConfigureSchedule}
                className="caption text-muted hover:text-fg hover:underline"
                title="Change schedule"
              >
                Change
              </button>
            </div>
            <span className="text-sm font-medium text-fg block mt-1">{nextScheduledText}</span>
            <span className="caption block text-muted capitalize">{audit.schedule} cadence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

