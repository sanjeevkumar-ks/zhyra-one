"use client";

import { useState } from "react";
import { Modal } from "@/components/ui-client";
import { Button, Badge } from "@/components/ui";
import { DEFAULT_CHECKS } from "@/lib/services/audit-service";
import type { AuditConfigInput, AuditScope } from "@/lib/audit-types";
import { Check, ShieldAlert, Sparkles } from "lucide-react";

interface AuditConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (config: AuditConfigInput) => void;
  isFirstTime?: boolean;
  websiteUrl: string;
}

export function AuditConfigDialog({
  open,
  onClose,
  onStart,
  isFirstTime = false,
  websiteUrl,
}: AuditConfigDialogProps) {
  const [scope, setScope] = useState<AuditScope>("full");
  const [customUrls, setCustomUrls] = useState<string>("");
  const [selectedChecks, setSelectedChecks] = useState<string[]>(
    DEFAULT_CHECKS.map((c) => c.id)
  );

  const toggleCheck = (id: string) => {
    if (selectedChecks.includes(id)) {
      if (selectedChecks.length === 1) return; // Keep at least 1 check
      setSelectedChecks(selectedChecks.filter((c) => c !== id));
    } else {
      setSelectedChecks([...selectedChecks, id]);
    }
  };

  const handleStart = () => {
    const urls =
      scope === "custom"
        ? customUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean)
        : undefined;

    onStart({
      scope,
      customUrls: urls,
      selectedChecks,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configure website audit"
      description={`Auditing ${websiteUrl}. Configure crawl scope and select specific health checks.`}
      width={640}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart}>
            Start website audit
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Crawl Scope Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-fg">Crawl scope</label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setScope("full")}
              className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                scope === "full"
                  ? "border-fg bg-surface shadow-sm ring-1 ring-fg"
                  : "border-line bg-subtle hover:bg-surface hover:border-line-strong"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">Full website</span>
                {isFirstTime && <Badge tone="info">Recommended</Badge>}
              </div>
              <p className="caption mt-1">Crawls all discovered pages from sitemap and links.</p>
            </button>

            <button
              type="button"
              onClick={() => setScope("changed")}
              className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                scope === "changed"
                  ? "border-fg bg-surface shadow-sm ring-1 ring-fg"
                  : "border-line bg-subtle hover:bg-surface hover:border-line-strong"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">Changed pages</span>
              </div>
              <p className="caption mt-1">Fast audit targeting recently published or edited URLs.</p>
            </button>

            <button
              type="button"
              onClick={() => setScope("custom")}
              className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                scope === "custom"
                  ? "border-fg bg-surface shadow-sm ring-1 ring-fg"
                  : "border-line bg-subtle hover:bg-surface hover:border-line-strong"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">Specific URLs</span>
              </div>
              <p className="caption mt-1">Audit a tailored list of paths or landing pages.</p>
            </button>
          </div>
        </div>

        {/* Custom URLs input if specific scope selected */}
        {scope === "custom" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              Target URLs <span className="text-xs font-normal text-muted">(one per line)</span>
            </label>
            <textarea
              className="field font-mono text-sm"
              rows={4}
              placeholder="https://verdantbotanics.com/blog/organic-skincare&#10;https://verdantbotanics.com/shop"
              value={customUrls}
              onChange={(e) => setCustomUrls(e.target.value)}
            />
          </div>
        )}

        {/* Audit checks selection */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-fg">Audit checks to run</label>
            <button
              type="button"
              onClick={() => setSelectedChecks(DEFAULT_CHECKS.map((c) => c.id))}
              className="text-xs font-medium text-muted hover:text-fg hover:underline"
            >
              Select all
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {DEFAULT_CHECKS.map((check) => {
              const checked = selectedChecks.includes(check.id);
              return (
                <div
                  key={check.id}
                  onClick={() => toggleCheck(check.id)}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                    checked
                      ? "border-line bg-surface"
                      : "border-line/60 bg-subtle/50 opacity-60"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      checked
                        ? "border-fg bg-fg text-surface"
                        : "border-line-strong bg-surface"
                    }`}
                  >
                    {checked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{check.label}</p>
                    <p className="caption mt-0.5 leading-snug">{check.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crawl limit & duration notice */}
        <div className="rounded-xl border border-line bg-subtle p-3.5 text-sm text-muted">
          <div className="flex items-start gap-2.5">
            <Sparkles size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-fg" />
            <div>
              <p className="font-medium text-fg">Crawl parameters & estimate</p>
              <p className="caption mt-0.5">
                Crawl limit: up to 500 pages per audit. Estimated duration:{" "}
                <span className="font-medium text-fg">15–30 seconds</span> in accelerated scan mode. Background processing prevents duplicate runs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

