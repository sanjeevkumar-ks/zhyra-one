"use client";

import { Modal } from "@/components/ui-client";
import { Badge, Table, Th, Td, trClass } from "@/components/ui";
import type { WebhookLogEntry } from "@/lib/publishing-types";
import { CheckCircle2, RotateCw, ShieldCheck, XCircle } from "lucide-react";

interface WebhookLogModalProps {
  open: boolean;
  onClose: () => void;
  logs: WebhookLogEntry[];
}

export function WebhookLogModal({ open, onClose, logs }: WebhookLogModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delivery & webhook logs"
      description="All external delivery payloads include HMAC-SHA256 signatures and idempotency keys to prevent duplicate publications."
      width={720}
    >
      <div className="space-y-4">
        <Table>
          <thead>
            <tr>
              <Th>Event</Th>
              <Th>Status</Th>
              <Th>Idempotency key</Th>
              <Th>Payload summary</Th>
              <Th>Attempt</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const is200 = log.status >= 200 && log.status < 300;
              return (
                <tr key={log.id} className={trClass}>
                  <Td className="mono font-medium">{log.event}</Td>
                  <Td>
                    <Badge tone={is200 ? "success" : "danger"}>
                      {log.status} {is200 ? "OK" : "Error"}
                    </Badge>
                  </Td>
                  <Td className="mono text-xs text-muted">{log.key.slice(0, 12)}...</Td>
                  <Td className="max-w-[200px] truncate text-xs text-fg">{log.payloadSummary}</Td>
                  <Td className="tabular-nums text-xs">{log.attempt}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{log.at}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </Modal>
  );
}

