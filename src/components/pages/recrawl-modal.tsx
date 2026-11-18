"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Modal, toast } from "@/components/ui-client";
import { Check, CheckCircle2, Globe, Loader2, RotateCw, ShieldCheck, X } from "lucide-react";

interface RecrawlModalProps {
  open: boolean;
  onClose: () => void;
  websiteUrl: string;
  onCrawlComplete?: () => void;
}

const CRAWL_STAGES = [
  { id: 1, label: "Fetching XML sitemap (/sitemap.xml)", detail: "Found 12 declared URLs with valid lastmod timestamps." },
  { id: 2, label: "Checking robots.txt & crawl directives", detail: "Disallow: /collections/sale detected and flagged." },
  { id: 3, label: "Crawling internal navigation links", detail: "Discovered 4 additional unlisted landing and policy pages." },
  { id: 4, label: "Validating canonical tags & HTTP status", detail: "All core pages return 200 OK; canonical links verified." },
  { id: 5, label: "Classifying page types & semantic intent", detail: "Mapped pages across Category, Product, Comparison, FAQ, and Blog." },
  { id: 6, label: "Syncing Search Console & AI visibility signals", detail: "Correlated 480,000 monthly impressions with page inventory." },
];

export function RecrawlModal({
  open,
  onClose,
  websiteUrl,
  onCrawlComplete,
}: RecrawlModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [crawling, setCrawling] = useState(true);
  const [discoveredCount, setDiscoveredCount] = useState(4);

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setCrawling(true);
      setDiscoveredCount(4);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < CRAWL_STAGES.length) {
          setDiscoveredCount((d) => d + Math.floor(Math.random() * 3 + 2));
          return prev + 1;
        } else {
          setCrawling(false);
          clearInterval(interval);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const handleFinish = () => {
    toast("Website inventory recrawl finished successfully");
    onCrawlComplete?.();
    onClose();
  };

  const progressPct = Math.round((currentStep / CRAWL_STAGES.length) * 100);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-fg">
            {crawling ? (
              <RotateCw size={16} strokeWidth={1.5} className="animate-spin text-fg" />
            ) : (
              <CheckCircle2 size={16} strokeWidth={1.5} className="text-emerald-500" />
            )}
          </div>
          <div>
            <span className="text-base font-semibold text-fg">
              {crawling ? "Crawling website inventory..." : "Crawl completed"}
            </span>
          </div>
        </div>
      }
      description={websiteUrl}
      width={540}
      footer={
        <Button onClick={handleFinish} disabled={crawling}>
          {crawling ? "Crawling in progress..." : "View updated inventory"}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Progress Bar & Counter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-fg">{progressPct}% completed</span>
            <span className="caption font-mono">{discoveredCount} URLs discovered</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full bg-fg transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Stage List */}
        <div className="space-y-3 rounded-xl border border-line bg-subtle/30 p-4 max-h-64 overflow-y-auto">
          {CRAWL_STAGES.map((stage) => {
            const isDone = currentStep > stage.id || !crawling;
            const isCurrent = currentStep === stage.id && crawling;

            return (
              <div key={stage.id} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <Check size={11} strokeWidth={2.5} />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 size={14} className="animate-spin text-fg" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-line bg-surface" />
                  )}
                </div>

                <div className="min-w-0">
                  <span
                    className={`block font-medium ${
                      isDone ? "text-fg" : isCurrent ? "text-fg font-semibold" : "text-muted"
                    }`}
                  >
                    {stage.label}
                  </span>
                  {(isDone || isCurrent) && (
                    <span className="caption text-[11px] text-muted block mt-0.5">
                      {stage.detail}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

