"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Badge, Button, Dot, Tone } from "@/components/ui";
import { SelectDropdown } from "@/components/ui-form";
import type { AuditIssueItem, IssueSeverity } from "@/lib/audit-types";

const TONE: Record<IssueSeverity, "danger" | "warning" | "info" | "neutral"> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

const BADGE: Record<IssueSeverity, Tone> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

interface AuditListProps {
  issues: AuditIssueItem[];
  simple?: boolean;
  onReviewFix?: (issue: AuditIssueItem) => void;
  onVerifyFix?: (issueId: number) => void;
  verifyingId?: number | null;
}

export function AuditList({
  issues,
  simple = false,
  onReviewFix,
  onVerifyFix,
  verifyingId = null,
}: AuditListProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(!simple);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const order: IssueSeverity[] = ["Critical", "High", "Medium", "Low"];
  const visibleSeverities = showAll ? order : order.slice(0, 2);

  // Apply filters
  const filteredIssues = issues.filter((i) => {
    if (filterSeverity !== "all" && i.severity !== filterSeverity) return false;
    if (filterStatus === "resolved" && i.verificationStatus !== "resolved") return false;
    if (filterStatus === "unresolved" && i.verificationStatus === "resolved") return false;
    if (filterStatus === "pending" && i.verificationStatus !== "pending_verification") return false;
    if (filterStatus === "auto" && !i.auto) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="caption font-medium text-fg">Filter:</span>
          <div className="w-36">
            <SelectDropdown
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="!h-8 !min-h-8 text-xs !rounded-lg py-1"
              aria-label="Filter by severity"
              options={[
                { value: "all", label: "All severities" },
                { value: "Critical", label: "Critical" },
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
              ]}
            />
          </div>

          <div className="w-48">
            <SelectDropdown
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="!h-8 !min-h-8 text-xs !rounded-lg py-1"
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "unresolved", label: "Open issues" },
                { value: "pending", label: "Verification pending" },
                { value: "resolved", label: "Resolved" },
                { value: "auto", label: "Auto-fixable" },
              ]}
            />
          </div>
        </div>

        <span className="caption">
          Showing {filteredIssues.length} of {issues.length} issues
        </span>
      </div>

      {/* Severity Groups */}
      {visibleSeverities.map((sev) => {
        const list = filteredIssues.filter((i) => i.severity === sev);
        if (!list.length && filterSeverity !== "all") return null;

        return (
          <section key={sev} className="space-y-3">
            <div className="flex items-center gap-2">
              <Dot tone={TONE[sev]} />
              <h2 className="h3">{sev} issues</h2>
              <Badge tone={BADGE[sev]}>{list.length}</Badge>
            </div>

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-subtle p-6 text-center">
                <p className="text-sm text-muted">No {sev.toLowerCase()} issues match current filters.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {list.map((i) => {
                  const isResolved = i.verificationStatus === "resolved";
                  const isPending = i.verificationStatus === "pending_verification";
                  const isStillDetected = i.verificationStatus === "still_detected";
                  const isVerifying = verifyingId === i.id;

                  return (
                    <li key={i.id} className={isResolved ? "bg-sunken/20" : ""}>
                      <button
                        type="button"
                        aria-expanded={open === i.id}
                        onClick={() => setOpen(open === i.id ? null : i.id)}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-subtle"
                      >
                        <span className={`flex-1 text-[15px] font-medium leading-snug ${isResolved ? "line-through text-muted" : "text-fg"}`}>
                          {i.title}
                        </span>

                        {/* Verification & auto status badges */}
                        {isResolved ? (
                          <Badge tone="success" className="gap-1">
                            <CheckCircle2 size={12} strokeWidth={2.5} />
                            Resolved
                          </Badge>
                        ) : isPending ? (
                          <Badge tone="info" className="gap-1 animate-pulse">
                            <RefreshCw size={11} className="animate-spin" />
                            Verification pending
                          </Badge>
                        ) : isStillDetected ? (
                          <Badge tone="warning" className="gap-1">
                            <AlertCircle size={12} strokeWidth={2} />
                            Still detected
                          </Badge>
                        ) : i.auto ? (
                          <Badge tone="success">Can be fixed automatically</Badge>
                        ) : (
                          <Badge tone="outline">Needs developer intervention</Badge>
                        )}

                        <Badge tone={BADGE[sev]}>
                          {i.urls.length} URL{i.urls.length === 1 ? "" : "s"}
                        </Badge>

                        <ChevronDown
                          size={16}
                          strokeWidth={1.5}
                          className={`text-muted transition-transform ${open === i.id ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Expandable Issue Detail Panel */}
                      {open === i.id && (
                        <div className="enter border-t border-line bg-subtle px-5 py-5 text-sm leading-relaxed space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">What is wrong?</p>
                              <p className="text-fg">{i.what}</p>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Why does it matter?</p>
                              <p className="text-fg">{i.why}</p>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Recommended solution</p>
                              <p className="text-fg">{i.fix}</p>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                                Affected URLs ({i.urls.length})
                              </p>
                              <ul className="mono max-h-28 overflow-y-auto space-y-1 text-xs text-muted">
                                {i.urls.map((u) => (
                                  <li key={u} className="truncate">• {u}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Verification Notes / Diagnostic Results */}
                          {i.verificationNotes && (
                            <div className={`rounded-xl border p-3.5 text-xs ${
                              isResolved
                                ? "border-success/30 bg-success-bg text-success-fg"
                                : isStillDetected
                                ? "border-warning/30 bg-warning-bg text-warning-fg"
                                : "border-info/30 bg-info-bg text-info-fg"
                            }`}>
                              <span className="font-semibold block mb-0.5">Verification status:</span>
                              {i.verificationNotes}
                            </div>
                          )}

                          {/* Action footer */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
                            <div className="caption">
                              {i.auto ? (
                                <span className="flex items-center gap-1.5 text-fg">
                                  <Sparkles size={14} className="text-muted" />
                                  Supported via connected CMS connector. User approval required before modification.
                                </span>
                              ) : (
                                <span className="text-muted">
                                  Requires server, Nginx, or theme configuration updates by an engineering team.
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* If fix is already applied or pending: allow targeted recheck */}
                              {isPending && onVerifyFix && (
                                <Button
                                  size="sm"
                                  onClick={() => onVerifyFix(i.id)}
                                  disabled={isVerifying}
                                  className="gap-1.5"
                                >
                                  <RefreshCw size={13} className={isVerifying ? "animate-spin" : ""} />
                                  {isVerifying ? "Rechecking URLs..." : "Targeted recheck"}
                                </Button>
                              )}

                              {/* If still detected: allow review & retry or re-verify */}
                              {isStillDetected && (
                                <>
                                  {onVerifyFix && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onVerifyFix(i.id)}
                                      disabled={isVerifying}
                                    >
                                      Re-verify
                                    </Button>
                                  )}
                                  {i.auto && onReviewFix && (
                                    <Button
                                      size="sm"
                                      onClick={() => onReviewFix(i)}
                                    >
                                      Review and re-attempt fix
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* If open and auto: Review and fix button */}
                              {!isResolved && !isPending && !isStillDetected && i.auto && onReviewFix && (
                                <Button
                                  size="sm"
                                  onClick={() => onReviewFix(i)}
                                >
                                  Review and fix
                                </Button>
                              )}

                              {/* If resolved */}
                              {isResolved && (
                                <span className="caption flex items-center gap-1 text-success font-medium">
                                  <CheckCircle2 size={14} />
                                  Verified resolved in audit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {!showAll && (
        <Button variant="outline" onClick={() => setShowAll(true)} className="w-full">
          Show Medium and Low issues (Advanced)
        </Button>
      )}
    </div>
  );
}
