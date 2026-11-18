"use client";

import { Button, Card } from "@/components/ui";
import { DEFAULT_CHECKS } from "@/lib/services/audit-service";
import { ScanSearch, Globe, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface NotAuditedStateProps {
  websiteUrl: string;
  onRunAudit: () => void;
}

export function NotAuditedState({ websiteUrl, onRunAudit }: NotAuditedStateProps) {
  return (
    <div className="space-y-8">
      {/* Primary Hero Section */}
      <Card className="relative overflow-hidden border border-line p-8 md:p-10">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-subtle px-3 py-1 text-xs font-medium text-muted">
            <Globe size={13} className="text-fg" />
            <span>Target: {websiteUrl}</span>
          </div>

          <h2 className="display !text-3xl md:!text-4xl">
            Your website hasn&apos;t been audited yet
          </h2>

          <p className="lead mt-3">
            Run your first website audit to discover technical SEO, crawlability, indexing and on-page issues affecting your website.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onRunAudit} className="gap-2">
              <ScanSearch size={18} strokeWidth={2} />
              Run website audit
            </Button>
            <span className="caption">Estimated duration: ~20 seconds</span>
          </div>
        </div>
      </Card>

      {/* Explanation of what will be checked */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="h3">What will be checked</h3>
            <p className="caption mt-0.5">
              Comprehensive diagnostics covering technical, architectural and content health.
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_CHECKS.map((check, idx) => (
            <Card key={check.id} className="p-4 transition-colors hover:bg-subtle/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sunken text-[11px] font-medium text-fg">
                  0{idx + 1}
                </span>
                <span>Category</span>
              </div>
              <h4 className="mt-2 text-sm font-medium text-fg">{check.label}</h4>
              <p className="caption mt-1 leading-snug">{check.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Data integrity assurance notice */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-4 text-xs text-muted">
        <ShieldCheck size={18} strokeWidth={1.5} className="shrink-0 text-fg" />
        <p>
          <span className="font-medium text-fg">Zero fabricated findings:</span> We never fabricate sample scores or placeholder numbers. Real issue metrics, URL counts and severity breakdowns appear only once an audit has actually completed.
        </p>
      </div>
    </div>
  );
}

