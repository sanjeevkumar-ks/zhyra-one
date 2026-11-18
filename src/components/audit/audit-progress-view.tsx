"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { ProgressBar } from "@/components/charts";
import type { AuditRecord } from "@/lib/audit-types";
import { CheckCircle2, Clock, Globe, Loader2, Sparkles } from "lucide-react";

interface AuditProgressViewProps {
  audit: AuditRecord;
}

export function AuditProgressView({ audit }: AuditProgressViewProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(audit.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [audit.startedAt]);

  const currentStageName =
    audit.stages[audit.currentStage]?.stageName || "Discovering website pages";
  const overallPct = Math.round(
    (audit.stages.reduce((acc, s) => acc + (s.status === "completed" ? 100 : s.progressPct), 0) /
      (audit.stages.length * 100)) *
      100
  );

  const completedStages = audit.stages.filter((s) => s.status === "completed");
  const remainingStages = audit.stages.filter((s) => s.status !== "completed");

  return (
    <div className="space-y-6">
      {/* Live progress header card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-info animate-pulse" />
              <Badge tone="info">Audit in progress</Badge>
              <span className="caption flex items-center gap-1">
                <Globe size={13} /> {audit.websiteUrl}
              </span>
            </div>
            <h2 className="display mt-2 !text-2xl md:!text-3xl font-medium">
              Stage {audit.currentStage + 1} of 8: {currentStageName}
            </h2>
            <p className="caption mt-1">
              Started {new Date(audit.startedAt).toLocaleTimeString()} · Elapsed: {elapsed}s · Scope: {audit.scope === "full" ? "Full website crawl" : audit.scope === "changed" ? "Changed pages" : "Custom URLs"}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="caption block">Pages discovered</span>
              <span className="text-xl font-normal text-fg tabular-nums">{audit.discoveredPages}</span>
            </div>
            <div className="h-8 w-px bg-line" />
            <div className="text-right">
              <span className="caption block">Pages crawled</span>
              <span className="text-xl font-normal text-fg tabular-nums">{audit.crawledPages}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-fg">Overall diagnostic progress</span>
            <span className="font-medium text-muted tabular-nums">{overallPct}%</span>
          </div>
          <ProgressBar pct={overallPct} />
        </div>
      </Card>

      {/* 8-Stage Execution Pipeline */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="h3">Diagnostic stages</h3>
          <span className="caption">
            {completedStages.length} completed · {remainingStages.length} remaining
          </span>
        </div>

        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {audit.stages.map((stage, idx) => {
            const isCompleted = stage.status === "completed";
            const isRunning = stage.status === "running";
            const isPending = stage.status === "pending";

            return (
              <div
                key={stage.stageName}
                className={`flex items-center justify-between p-4 transition-colors ${
                  isRunning ? "bg-subtle" : ""
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : isRunning ? (
                      <Loader2 size={18} className="text-info animate-spin" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-line-strong text-[10px] text-muted">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-fg"
                          : isRunning
                          ? "text-fg font-semibold"
                          : "text-muted"
                      }`}
                    >
                      {idx + 1}. {stage.stageName}
                    </p>
                    {stage.details && (
                      <p className="caption mt-0.5">{stage.details}</p>
                    )}
                  </div>
                </div>

                <div>
                  {isCompleted && <Badge tone="success">Verified</Badge>}
                  {isRunning && <Badge tone="info">Analysing...</Badge>}
                  {isPending && <Badge tone="outline">Queued</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
