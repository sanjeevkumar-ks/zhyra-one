"use client";

import { Card, Button, Badge } from "@/components/ui";
import type { AuditRecord } from "@/lib/audit-types";
import { AlertTriangle, Globe, RefreshCw, ScanSearch } from "lucide-react";

interface AuditFailedStateProps {
  audit: AuditRecord;
  onRetry: () => void;
}

export function AuditFailedState({ audit, onRetry }: AuditFailedStateProps) {
  return (
    <Card className="border-danger/30 bg-surface p-8 md:p-10">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2">
          <Badge tone="danger">Audit failed</Badge>
          <span className="caption flex items-center gap-1">
            <Globe size={13} /> {audit.websiteUrl}
          </span>
        </div>

        <h2 className="display mt-3 !text-2xl md:!text-3xl font-medium text-fg">
          Audit was unable to complete
        </h2>

        <p className="lead mt-2">
          The automated crawler encountered an unexpected connectivity or server issue while inspecting your website.
        </p>

        <div className="mt-5 rounded-xl border border-danger/20 bg-danger-bg/50 p-4 text-sm text-danger-fg">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <span className="font-medium block">Error diagnostics:</span>
              <p className="mt-0.5 font-mono text-xs leading-relaxed">
                {audit.error || "Crawl interrupted: Origin server reset HTTP connection after timeout limit."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw size={15} />
            Retry audit
          </Button>
          <span className="caption">
            Check that {audit.websiteUrl} is publicly accessible and not blocking bot user-agents.
          </span>
        </div>
      </div>
    </Card>
  );
}

