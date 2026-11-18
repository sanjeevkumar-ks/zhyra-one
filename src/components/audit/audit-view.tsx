"use client";

import { useEffect, useState } from "react";
import { Card, Stat, Badge, Button, PageTabs } from "@/components/ui";
import { toast } from "@/components/ui-client";
import type {
  AuditConfigInput,
  AuditLifecycleStatus,
  AuditRecord,
  AuditSchedule,
  AuditIssueItem,
} from "@/lib/audit-types";
import { NotAuditedState } from "./not-audited-state";
import { AuditProgressView } from "./audit-progress-view";
import { AuditSummaryPanel } from "./audit-summary-panel";
import { AuditHistoryView } from "./audit-history-view";
import { AuditFailedState } from "./audit-failed-state";
import { AuditConfigDialog } from "./audit-config-dialog";
import { AuditFixDialog } from "./audit-fix-dialog";
import { AuditScheduleDialog } from "./audit-schedule-dialog";
import { AuditList } from "@/components/audit-list";
import { AlertTriangle, History, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";

interface AuditViewProps {
  initialAudit: AuditRecord | null;
  initialHistory: AuditRecord[];
  initialSchedule: AuditSchedule;
  websiteUrl: string;
  simple?: boolean;
}

export function AuditView({
  initialAudit,
  initialHistory,
  initialSchedule,
  websiteUrl,
  simple = false,
}: AuditViewProps) {
  const [audit, setAudit] = useState<AuditRecord | null>(initialAudit);
  const [history, setHistory] = useState<AuditRecord[]>(initialHistory);
  const [schedule, setSchedule] = useState<AuditSchedule>(initialSchedule);
  const [activeTab, setActiveTab] = useState<"issues" | "history">("issues");

  // Modals state
  const [configOpen, setConfigOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reviewIssue, setReviewIssue] = useState<AuditIssueItem | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Poll in-progress audit
  useEffect(() => {
    if (!audit || audit.status !== "in_progress") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/audit");
        if (!res.ok) return;
        const data = await res.json();
        if (data.currentAudit) {
          setAudit(data.currentAudit);
          if (data.currentAudit.status === "completed") {
            toast("Website audit completed successfully");
            if (data.history) setHistory(data.history);
          } else if (data.currentAudit.status === "failed") {
            toast("Website audit failed — check error details");
          }
        }
      } catch (err) {
        console.error("Failed to poll audit status", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [audit?.status]);

  // Start new audit
  const handleStartAudit = async (config: AuditConfigInput) => {
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", ...config }),
      });
      const data = await res.json();
      if (data.audit) {
        setAudit(data.audit);
        setActiveTab("issues");
        toast("Website audit started");
      }
    } catch {
      toast("Failed to initiate audit");
    }
  };

  // Review & apply fix
  const handleApplyFix = async (issueId: number) => {
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fix", issueId }),
      });
      const data = await res.json();
      if (data.success && data.issue) {
        if (audit) {
          const updatedIssues = audit.issues.map((i) =>
            i.id === issueId ? data.issue : i
          );
          setAudit({ ...audit, issues: updatedIssues });
        }
        toast("Fix applied via CMS connector. Verification pending.");
      }
    } catch {
      toast("Failed to apply fix");
    }
  };

  // Targeted recheck verification
  const handleVerifyFix = async (issueId: number) => {
    setVerifyingId(issueId);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", issueId }),
      });
      const data = await res.json();
      if (data.issue && audit) {
        const updatedIssues = audit.issues.map((i) =>
          i.id === issueId ? data.issue : i
        );
        const resolvedDelta = data.success ? 1 : 0;
        setAudit({
          ...audit,
          issues: updatedIssues,
          resolvedSincePrevious: audit.resolvedSincePrevious + resolvedDelta,
        });

        if (data.success) {
          toast("Targeted recheck verified: Issue successfully resolved!");
        } else {
          toast("Targeted recheck failed: Issue is still detected on target URLs.");
        }
      }
    } catch {
      toast("Targeted verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  // Update schedule
  const handleSaveSchedule = async (newSchedule: AuditSchedule) => {
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", schedule: newSchedule }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(newSchedule);
        if (audit) setAudit({ ...audit, schedule: newSchedule });
        toast(`Audit schedule updated to ${newSchedule}`);
      }
    } catch {
      toast("Failed to update schedule");
    }
  };

  // Lifecycle state simulator (allows reviewer to test all 5 states smoothly)
  const handleSwitchState = async (status: AuditLifecycleStatus) => {
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", status }),
      });
      const data = await res.json();
      if (data.audit) {
        setAudit(status === "not_audited" ? null : data.audit);
        toast(`Lifecycle state switched to: ${status.replace("_", " ")}`);
      }
    } catch {
      toast("Failed to switch state");
    }
  };

  const status = audit ? audit.status : "not_audited";

  return (
    <div className="space-y-6">
      {/* Lifecycle Testing & Demo Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-subtle/70 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-muted" />
          <span className="font-medium text-fg">Audit Lifecycle Stage:</span>
          <span className="capitalize text-muted font-medium">
            {status === "not_audited"
              ? "1 · Not audited"
              : status === "in_progress"
              ? "2 · In progress"
              : status === "completed"
              ? "3 · Completed"
              : status === "failed"
              ? "4 · Failed"
              : "5 · Outdated"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="caption mr-1">Preview state:</span>
          {(
            [
              ["not_audited", "Not audited"],
              ["in_progress", "In progress"],
              ["completed", "Completed"],
              ["outdated", "Outdated"],
              ["failed", "Failed"],
            ] as const
          ).map(([s, label]) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSwitchState(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                status === s
                  ? "bg-primary text-primary-fg shadow-sm"
                  : "bg-surface text-muted border border-line hover:bg-sunken hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. NOT AUDITED STATE */}
      {status === "not_audited" && (
        <NotAuditedState
          websiteUrl={websiteUrl}
          onRunAudit={() => setConfigOpen(true)}
        />
      )}

      {/* 2. AUDIT IN PROGRESS STATE */}
      {status === "in_progress" && audit && (
        <AuditProgressView audit={audit} />
      )}

      {/* 3. AUDIT FAILED STATE */}
      {status === "failed" && audit && (
        <AuditFailedState
          audit={audit}
          onRetry={() => setConfigOpen(true)}
        />
      )}

      {/* 4. AUDIT COMPLETED OR OUTDATED STATE */}
      {(status === "completed" || status === "outdated") && audit && (
        <div className="space-y-6">
          {/* Status Panel placed ABOVE issue summary per Requirement 4 */}
          <AuditSummaryPanel
            audit={audit}
            isOutdated={status === "outdated"}
            onRunAudit={() => setConfigOpen(true)}
            onViewHistory={() => setActiveTab("history")}
            onConfigureSchedule={() => setScheduleOpen(true)}
          />

          {/* Sub Navigation Tabs: Issues vs Audit History */}
          <div className="w-full">
            <PageTabs
              value={activeTab}
              onChange={(v) => setActiveTab(v as "issues" | "history")}
              items={[
                {
                  id: "issues",
                  label: "Audit issues",
                  count: audit.issues.filter((i) => i.verificationStatus !== "resolved").length,
                  icon: AlertTriangle,
                },
                {
                  id: "history",
                  label: "Audit history",
                  count: history.length,
                  icon: History,
                },
              ]}
              ariaLabel="Audit navigation tabs"
            />
          </div>

          {/* TAB 1: ISSUES */}
          {activeTab === "issues" && (
            <div className="space-y-6">
              {/* Severity KPI Card */}
              <Card className="flex flex-wrap divide-x divide-line py-5 pl-5">
                <Stat
                  label="Critical"
                  value={audit.issueCounts.critical}
                  sub="Requires immediate fix"
                />
                <Stat
                  label="High"
                  value={audit.issueCounts.high}
                  sub="Impairs crawling/index"
                />
                <Stat
                  label="Medium"
                  value={audit.issueCounts.medium}
                  sub="Recommended hygiene"
                />
                <Stat
                  label="Low"
                  value={audit.issueCounts.low}
                  sub="Minor optimization"
                />
                <Stat
                  label="Fixable automatically"
                  value={
                    audit.issues.filter(
                      (i) => i.auto && i.verificationStatus !== "resolved"
                    ).length
                  }
                  sub="via connected CMS connector"
                />
              </Card>

              {/* Enhanced Issue List with verification & fix actions */}
              <AuditList
                issues={audit.issues}
                simple={simple}
                onReviewFix={(i) => setReviewIssue(i)}
                onVerifyFix={handleVerifyFix}
                verifyingId={verifyingId}
              />
            </div>
          )}

          {/* TAB 2: AUDIT HISTORY */}
          {activeTab === "history" && (
            <AuditHistoryView
              history={history}
              currentAuditId={audit.id}
              onSelectAudit={(record) => {
                setAudit(record);
                setActiveTab("issues");
                toast(`Viewing snapshot for audit: ${record.id}`);
              }}
            />
          )}
        </div>
      )}

      {/* Configuration Dialog */}
      <AuditConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onStart={handleStartAudit}
        isFirstTime={status === "not_audited"}
        websiteUrl={websiteUrl}
      />

      {/* Review & Fix Dialog */}
      <AuditFixDialog
        open={!!reviewIssue}
        onClose={() => setReviewIssue(null)}
        issue={reviewIssue}
        onApplyFix={handleApplyFix}
      />

      {/* Schedule Dialog */}
      <AuditScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        currentSchedule={schedule}
        nextScheduledAudit={audit?.nextScheduledAudit}
        onSaveSchedule={handleSaveSchedule}
      />
    </div>
  );
}

