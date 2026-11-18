"use client";

import { Table, Th, Td, trClass, Badge, Button } from "@/components/ui";
import type { AuditRecord } from "@/lib/audit-types";
import { ArrowUpRight, CheckCircle2, History, XCircle } from "lucide-react";

interface AuditHistoryViewProps {
  history: AuditRecord[];
  onSelectAudit: (audit: AuditRecord) => void;
  currentAuditId?: string;
}

export function AuditHistoryView({
  history,
  onSelectAudit,
  currentAuditId,
}: AuditHistoryViewProps) {
  if (!history.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-12 text-center">
        <History size={36} strokeWidth={1.5} className="mx-auto text-muted" />
        <h3 className="h3 mt-3">No previous audits recorded</h3>
        <p className="caption mt-1">Audit history will appear here once crawls are completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="h3">Audit run history</h3>
          <p className="caption mt-0.5">
            Compare past crawl results and track issue resolution velocity over time.
          </p>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Audit date</Th>
            <Th>Scope</Th>
            <Th>Pages crawled</Th>
            <Th>Severity breakdown</Th>
            <Th>New issues</Th>
            <Th>Resolved</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => {
            const isSelected = record.id === currentAuditId;
            const formattedDate = new Date(record.startedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <tr key={record.id} className={`${trClass} ${isSelected ? "bg-sunken/40" : ""}`}>
                <Td className="font-medium text-fg">
                  <div className="flex items-center gap-2">
                    <span>{formattedDate}</span>
                    {isSelected && <Badge tone="info">Active view</Badge>}
                    {record.isDemo && <Badge tone="outline" className="border-dashed">Demo</Badge>}
                  </div>
                </Td>
                <Td className="capitalize text-muted">{record.scope} audit</Td>
                <Td className="tabular-nums">{record.crawledPages}</Td>
                <Td>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-danger">{record.issueCounts.critical} C</span>
                    <span className="text-faint">·</span>
                    <span className="font-medium text-warning">{record.issueCounts.high} H</span>
                    <span className="text-faint">·</span>
                    <span className="text-muted">{record.issueCounts.medium} M</span>
                    <span className="text-faint">·</span>
                    <span className="text-muted">{record.issueCounts.low} L</span>
                  </div>
                </Td>
                <Td>
                  {record.newIssuesCount > 0 ? (
                    <span className="text-sm font-medium text-danger">+{record.newIssuesCount}</span>
                  ) : (
                    <span className="text-sm text-muted">0</span>
                  )}
                </Td>
                <Td>
                  {record.resolvedSincePrevious > 0 ? (
                    <span className="text-sm font-medium text-success">+{record.resolvedSincePrevious}</span>
                  ) : (
                    <span className="text-sm text-muted">0</span>
                  )}
                </Td>
                <Td>
                  <Badge tone={record.status === "completed" ? "success" : record.status === "failed" ? "danger" : "warning"}>
                    {record.status === "completed" ? "Completed" : record.status === "failed" ? "Failed" : record.status}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button
                    size="sm"
                    variant={isSelected ? "outline" : "ghost"}
                    onClick={() => onSelectAudit(record)}
                  >
                    {isSelected ? "Viewing" : "View report"}
                  </Button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

