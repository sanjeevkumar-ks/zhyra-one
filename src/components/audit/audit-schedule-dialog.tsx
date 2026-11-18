"use client";

import { useState } from "react";
import { Modal } from "@/components/ui-client";
import { Button, Badge } from "@/components/ui";
import type { AuditSchedule } from "@/lib/audit-types";
import { Calendar, Clock, Sparkles } from "lucide-react";

interface AuditScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  currentSchedule: AuditSchedule;
  nextScheduledAudit?: string;
  onSaveSchedule: (schedule: AuditSchedule) => void;
}

export function AuditScheduleDialog({
  open,
  onClose,
  currentSchedule,
  nextScheduledAudit,
  onSaveSchedule,
}: AuditScheduleDialogProps) {
  const [schedule, setSchedule] = useState<AuditSchedule>(currentSchedule);

  const handleSave = () => {
    onSaveSchedule(schedule);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configure audit schedule"
      description="Automated background audits catch technical regressions and indexing issues."
      width={520}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save schedule
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setSchedule("weekly")}
            className={`flex w-full items-start justify-between rounded-xl border p-4 text-left transition-all ${
              schedule === "weekly"
                ? "border-fg bg-surface shadow-sm ring-1 ring-fg"
                : "border-line bg-subtle hover:bg-surface hover:border-line-strong"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-fg">Weekly audit</span>
                <Badge tone="info">Recommended</Badge>
              </div>
              <p className="caption mt-1">Runs every Monday at 02:00 UTC. Ideal for active sites publishing weekly.</p>
            </div>
            <Calendar size={18} strokeWidth={1.5} className="text-muted" />
          </button>

          <button
            type="button"
            onClick={() => setSchedule("monthly")}
            className={`flex w-full items-start justify-between rounded-xl border p-4 text-left transition-all ${
              schedule === "monthly"
                ? "border-fg bg-surface shadow-sm ring-1 ring-fg"
                : "border-line bg-subtle hover:bg-surface hover:border-line-strong"
            }`}
          >
            <div>
              <span className="text-sm font-medium text-fg">Monthly audit</span>
              <p className="caption mt-1">Runs on the 1st of each month. Good for slower-updating static content.</p>
            </div>
            <Clock size={18} strokeWidth={1.5} className="text-muted" />
          </button>

          <button
            type="button"
            onClick={() => setSchedule("manual")}
            className={`flex w-full items-start justify-between rounded-xl border p-4 text-left transition-all ${
              schedule === "manual"
                ? "border-fg bg-surface shadow-sm ring-1 ring-fg"
                : "border-line bg-subtle hover:bg-surface hover:border-line-strong"
            }`}
          >
            <div>
              <span className="text-sm font-medium text-fg">Manual only</span>
              <p className="caption mt-1">Audits will only run when you explicitly click &quot;Run new audit&quot;.</p>
            </div>
            <Sparkles size={18} strokeWidth={1.5} className="text-muted" />
          </button>
        </div>

        {schedule !== "manual" && (
          <div className="rounded-xl border border-line bg-subtle p-3 text-xs text-muted">
            <span className="font-medium text-fg">Next scheduled run: </span>
            {nextScheduledAudit ? new Date(nextScheduledAudit).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Scheduled upon save"}
          </div>
        )}
      </div>
    </Modal>
  );
}

