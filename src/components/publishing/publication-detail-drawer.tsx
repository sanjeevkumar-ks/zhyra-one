"use client";

import { Modal } from "@/components/ui-client";
import { Badge, Button } from "@/components/ui";
import type { DestinationPublication, ParentContentPublication } from "@/lib/publishing-types";
import { getChannelIcon } from "./connected-channels-bar";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  History,
  RotateCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui-client";

interface PublicationDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  destination: DestinationPublication | null;
  parent: ParentContentPublication | null;
  onRetry?: (pubId: string) => void;
  onCancelSchedule?: (pubId: string) => void;
  onRepublish?: (pubId: string) => void;
  loading?: boolean;
}

export function PublicationDetailDrawer({
  open,
  onClose,
  destination,
  parent,
  onRetry,
  onCancelSchedule,
  onRepublish,
  loading = false,
}: PublicationDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!destination || !parent) return null;

  const copyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(destination.idempotencyKey);
      setCopied(true);
      toast("Idempotency key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFailed = destination.status === "failed";
  const isScheduled = destination.status === "scheduled";
  const isPublished = destination.status === "published";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publication details"
      description={`Channel: ${destination.destinationName} · Parent: ${parent.title}`}
      width={680}
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          {isFailed && onRetry && (
            <Button
              size="sm"
              onClick={() => {
                onRetry(destination.id);
                onClose();
              }}
              disabled={loading}
              className="gap-1.5"
            >
              <RotateCw size={13} />
              Retry publishing
            </Button>
          )}

          {isScheduled && onCancelSchedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onCancelSchedule(destination.id);
                onClose();
              }}
              disabled={loading}
            >
              Cancel schedule
            </Button>
          )}

          {isPublished && onRepublish && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onRepublish(destination.id);
                onClose();
              }}
              disabled={loading}
              className="gap-1.5"
            >
              <RotateCw size={13} />
              Edit & republish (v{destination.version + 1})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header with destination badge & status */}
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-subtle p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface">
              {getChannelIcon(destination.destination)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-fg">{destination.destinationName}</span>
                <Badge
                  tone={
                    isPublished
                      ? "success"
                      : isScheduled
                      ? "info"
                      : isFailed
                      ? "danger"
                      : "neutral"
                  }
                >
                  {destination.status}
                </Badge>
                <Badge tone="outline">v{destination.version}</Badge>
              </div>
              <p className="caption mt-0.5">
                Parent content: <span className="font-medium text-fg">{parent.title}</span> ({parent.contentType})
              </p>
            </div>
          </div>

          {destination.externalUrl && (
            <a
              href={destination.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-sunken"
            >
              <span>View live</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Error alert if failed */}
        {isFailed && destination.error && (
          <div className="rounded-xl border border-danger/30 bg-danger-bg p-4 text-xs text-danger-fg">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
              <div>
                <p className="font-semibold">Delivery failure diagnostics:</p>
                <p className="mono mt-1 leading-relaxed">{destination.error}</p>
                <p className="mt-2 text-muted">
                  Attempts: {destination.retryCount} · Exponential backoff safety active. Retrying uses the same idempotency key to prevent duplicate creation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Adapted Content Preview */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Adapted destination payload
            </label>
            <span className="caption">
              {destination.category === "social" ? "Tailored social copy" : "CMS formatted article"}
            </span>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 text-sm space-y-2">
            <p className="font-medium text-fg">{destination.adaptedTitle}</p>
            <p className="text-muted text-xs leading-relaxed">{destination.adaptedSnippet}</p>
            {destination.adaptedContentHtml && (
              <div className="mt-3 border-t border-line pt-3 text-xs text-muted">
                <span className="caption block mb-1 font-semibold">Rendered body sample:</span>
                <div
                  className="prose-article max-h-32 overflow-y-auto rounded-lg bg-subtle p-2.5"
                  dangerouslySetInnerHTML={{ __html: destination.adaptedContentHtml }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Technical Information Grid */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            Technical delivery & sync metadata
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-xl border border-line bg-subtle p-4 text-xs">
            <div>
              <span className="caption block">CMS / External ID</span>
              <span className="mono font-medium text-fg mt-0.5 block truncate">
                {destination.externalId || "—"}
              </span>
            </div>

            <div>
              <span className="caption block">Publication version</span>
              <span className="font-medium text-fg mt-0.5 block">Version {destination.version}</span>
            </div>

            <div>
              <span className="caption block">Remote sync status</span>
              <span className="inline-flex items-center gap-1 font-medium text-success mt-0.5">
                <CheckCircle2 size={12} /> In sync
              </span>
            </div>

            <div>
              <span className="caption block">
                {isScheduled ? "Scheduled execution" : "Publication timestamp"}
              </span>
              <span className="text-fg mt-0.5 block font-medium">
                {destination.scheduledFor
                  ? new Date(destination.scheduledFor).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : destination.publishedAt
                  ? new Date(destination.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="caption block">Idempotency protection key</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="mono truncate text-muted">{destination.idempotencyKey}</span>
                <button
                  type="button"
                  onClick={copyKey}
                  className="text-muted hover:text-fg"
                  title="Copy idempotency key"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reliability Guarantee Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3 text-xs text-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-fg" />
          <p>
            <span className="font-medium text-fg">Idempotency & duplication protection:</span> Re-publishing an unchanged version produces an identical signature, preventing duplicate entries on remote channels. Edits automatically generate a new version identifier.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            {destination.externalUrl && (
              <a
                href={destination.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-fg hover:bg-sunken"
              >
                <span>Live URL</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>

        </div>
      </div>
    </Modal>
  );
}

