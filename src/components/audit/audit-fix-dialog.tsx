"use client";

import { Modal } from "@/components/ui-client";
import { Button, Badge } from "@/components/ui";
import type { AuditIssueItem } from "@/lib/audit-types";
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

interface AuditFixDialogProps {
  open: boolean;
  onClose: () => void;
  issue: AuditIssueItem | null;
  onApplyFix: (issueId: number) => void;
  loading?: boolean;
}

export function AuditFixDialog({
  open,
  onClose,
  issue,
  onApplyFix,
  loading = false,
}: AuditFixDialogProps) {
  if (!issue) return null;

  const fixDetails = issue.fixDetails || {
    targetType: "Connected CMS Connector",
    previewBefore: "Current configuration without fix",
    previewAfter: "Updated settings applying: " + issue.fix,
    explanation: issue.fix,
    safeToApply: true,
  };

  const handleApply = () => {
    onApplyFix(issue.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review and approve fix"
      description={`Issue #${issue.id}: ${issue.title}`}
      width={640}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            {loading ? "Applying..." : "Approve and apply fix"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header summary */}
        <div className="rounded-xl border border-line bg-subtle p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="info">{issue.severity}</Badge>
                <span className="text-xs font-medium text-muted">Issue #{issue.id}</span>
              </div>
              <h3 className="mt-1 text-base font-medium text-fg">{issue.title}</h3>
            </div>
            <Badge tone="success">CMS Automated Fix</Badge>
          </div>
          <p className="caption mt-2">{issue.what}</p>
        </div>

        {/* Affected targets */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Target integration & affected URLs ({issue.urls.length})
          </label>
          <div className="rounded-xl border border-line bg-surface p-3 text-sm">
            <p className="font-medium text-fg">{fixDetails.targetType}</p>
            <ul className="mono mt-1 max-h-24 overflow-y-auto space-y-0.5 text-xs text-muted">
              {issue.urls.map((u) => (
                <li key={u} className="truncate">• {u}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Diff preview */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Proposed change preview
          </label>
          <div className="space-y-2">
            <div>
              <span className="caption block mb-1 font-medium text-danger">Current state (Before)</span>
              <pre className="mono max-h-28 overflow-x-auto rounded-xl border border-danger/20 bg-danger-bg/40 p-3 text-xs leading-relaxed text-danger-fg">
                {fixDetails.previewBefore}
              </pre>
            </div>
            <div>
              <span className="caption block mb-1 font-medium text-success">Proposed fix (After)</span>
              <pre className="mono max-h-28 overflow-x-auto rounded-xl border border-success/20 bg-success-bg/40 p-3 text-xs leading-relaxed text-success-fg">
                {fixDetails.previewAfter}
              </pre>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Technical explanation
          </label>
          <p className="text-sm leading-relaxed text-fg">{fixDetails.explanation}</p>
        </div>

        {/* Non-silent explicit approval guarantee */}
        <div className="flex items-start gap-3 rounded-xl border border-line-strong bg-sunken p-3.5 text-xs text-muted">
          <ShieldCheck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-fg" />
          <p>
            <span className="font-medium text-fg">Explicit approval policy:</span> Content and technical settings are never modified silently. Once approved, the platform will update your connected CMS and immediately queue a targeted verification recheck.
          </p>
        </div>
      </div>
    </Modal>
  );
}

