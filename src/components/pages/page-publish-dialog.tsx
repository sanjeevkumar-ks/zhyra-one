"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { Modal, toast } from "@/components/ui-client";
import { SelectDropdown } from "@/components/ui-form";
import {
  CMS_PLATFORM_REGISTRY,
  validateAndPublishPage,
  type PublishResult,
} from "@/lib/services/cms-page-adapter";
import type { CmsPlatformId, PageDocument } from "@/lib/website-intelligence-types";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Send,
  X,
} from "lucide-react";

interface PagePublishDialogProps {
  open: boolean;
  onClose: () => void;
  page: PageDocument;
  onSuccess?: (result: PublishResult) => void;
}

export function PagePublishDialog({
  open,
  onClose,
  page,
  onSuccess,
}: PagePublishDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<CmsPlatformId>("wordpress");
  const [publishMode, setPublishMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduleDate, setScheduleDate] = useState("2026-12-01");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  if (!open) return null;

  const connector = CMS_PLATFORM_REGISTRY[selectedPlatform];
  const capabilities = connector.capabilities;

  const handlePublish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const res = validateAndPublishPage(
        selectedPlatform,
        page,
        publishMode,
        scheduleDate
      );
      setResult(res);
      setIsSubmitting(false);

      if (res.ok) {
        toast(`Page successfully published to ${connector.name}!`);
        onSuccess?.(res);
      }
    }, 800);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish Page to Connected CMS"
      description={page.title}
      width={600}
      footer={
        !result ? (
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Dispatching to {connector.name}...
                </>
              ) : (
                <>
                  <Send size={14} strokeWidth={1.5} className="mr-1.5 shrink-0" />
                  {publishMode === "immediate" ? "Publish to Live CMS" : "Schedule Publication"}
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button onClick={onClose}>Done</Button>
        )
      }
    >

        {!result ? (
          <div className="space-y-5">
            {/* Platform Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-fg block">Select Destination Platform</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(CMS_PLATFORM_REGISTRY) as CmsPlatformId[]).map((pid) => {
                  const p = CMS_PLATFORM_REGISTRY[pid];
                  const isSelected = selectedPlatform === pid;

                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedPlatform(pid)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                          : "border-line bg-subtle/40 hover:bg-subtle hover:border-line-strong"
                      }`}
                    >
                      <span className="font-semibold text-xs text-fg">{p.name}</span>
                      <span className="caption text-[10px] text-muted mt-1">
                        {p.connected ? "Connected" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Capability Inspector Matrix */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fg">{connector.name} Capabilities</span>
                  {connector.connected ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                      Live Connector
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                      Requires Setup
                    </span>
                  )}
                </div>
                {connector.accountName && (
                  <span className="caption font-mono text-[11px] text-muted truncate max-w-xs">
                    {connector.accountName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {capabilities.createPage ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-danger shrink-0" />
                  )}
                  <span className={capabilities.createPage ? "text-fg" : "text-muted"}>Create Page</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {capabilities.updatePage ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-danger shrink-0" />
                  )}
                  <span className={capabilities.updatePage ? "text-fg" : "text-muted"}>Update Page</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {capabilities.schedulePublish ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  )}
                  <span className={capabilities.schedulePublish ? "text-fg" : "text-muted"}>
                    {capabilities.schedulePublish ? "Scheduled Publishing" : "Immediate Only"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {capabilities.seoMetaTitleDescription ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-danger shrink-0" />
                  )}
                  <span className={capabilities.seoMetaTitleDescription ? "text-fg" : "text-muted"}>SEO Metadata</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {capabilities.structuredDataJsonLd ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  )}
                  <span className={capabilities.structuredDataJsonLd ? "text-fg" : "text-muted"}>Schema JSON-LD</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {capabilities.customSlug ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-danger shrink-0" />
                  )}
                  <span className={capabilities.customSlug ? "text-fg" : "text-muted"}>Custom URL Slug</span>
                </div>
              </div>

              {connector.capabilities.limitationsNotes && (
                <p className="caption text-[11px] text-muted pt-2 border-t border-line">
                  Note: {connector.capabilities.limitationsNotes}
                </p>
              )}
            </Card>

            {/* Publishing Schedule Controls */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-fg block">Publication Timing</span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="publish_timing"
                    checked={publishMode === "immediate"}
                    onChange={() => setPublishMode("immediate")}
                    className="accent-fg"
                  />
                  <span className="font-medium text-fg">Publish immediately to live URL</span>
                </label>

                {capabilities.schedulePublish && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="publish_timing"
                      checked={publishMode === "scheduled"}
                      onChange={() => setPublishMode("scheduled")}
                      className="accent-fg"
                    />
                    <span className="font-medium text-fg">Schedule for queue</span>
                  </label>
                )}
              </div>

              {publishMode === "scheduled" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="field !h-9 text-xs !w-auto"
                  />
                  <span className="caption text-xs">Queue dispatch time</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-500">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-sm block">Page Dispatched Successfully</span>
                <p className="text-muted">
                  The page payload has been confirmed by the {connector.name} REST endpoint and assigned external identifier: <span className="font-mono text-fg">{result.cmsPageId}</span>.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Public Canonical URL</span>
                <a
                  href={result.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-fg hover:underline inline-flex items-center gap-1"
                >
                  {result.externalUrl}
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Target Platform</span>
                <span className="font-medium text-fg">{connector.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="font-semibold text-emerald-500">Live & Synced</span>
              </div>
            </div>

            {result.unsupportedOperationsTriggered.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-500 space-y-1">
                <span className="font-semibold block">Platform Limitations Handled:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-muted">
                  {result.unsupportedOperationsTriggered.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

        </div>
      )}
    </Modal>
  );
}

