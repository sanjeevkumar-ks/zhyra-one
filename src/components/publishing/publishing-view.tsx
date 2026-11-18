"use client";

import { useState } from "react";
import { Button, Card, PageTabs, btnClass } from "@/components/ui";
import { toast } from "@/components/ui-client";
import type {
  ConnectedChannel,
  DestinationPublication,
  ParentContentPublication,
  PublishingChannelId,
  PublishingMetrics,
  WebhookLogEntry,
} from "@/lib/publishing-types";
import { PublishingOverviewMetrics } from "./publishing-overview-metrics";
import { ConnectedChannelsBar } from "./connected-channels-bar";
import { PublishingQueueTable } from "./publishing-queue-table";
import { PublishingCalendarView } from "./publishing-calendar-view";
import { PublicationDetailDrawer } from "./publication-detail-drawer";
import { WebhookLogModal } from "./webhook-log-modal";
import { EmptyPublishingState } from "./empty-publishing-state";
import { Calendar, History, List, Radio, Sparkles } from "lucide-react";

interface PublishingViewProps {
  initialChannels: ConnectedChannel[];
  initialParentItems: ParentContentPublication[];
  initialMetrics: PublishingMetrics;
  initialLogs: WebhookLogEntry[];
}

export function PublishingView({
  initialChannels,
  initialParentItems,
  initialMetrics,
  initialLogs,
}: PublishingViewProps) {
  const [channels, setChannels] = useState<ConnectedChannel[]>(initialChannels);
  const [parentItems, setParentItems] = useState<ParentContentPublication[]>(initialParentItems);
  const [metrics, setMetrics] = useState<PublishingMetrics>(initialMetrics);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogEntry[]>(initialLogs);

  const [selectedChannel, setSelectedChannel] = useState<PublishingChannelId | "all">("all");
  const [viewMode, setViewMode] = useState<"queue" | "calendar">("queue");

  // Inspect drawer
  const [activeDestination, setActiveDestination] = useState<DestinationPublication | null>(null);
  const [activeParent, setActiveParent] = useState<ParentContentPublication | null>(null);

  // Delivery log modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasAnyConnectedChannels = channels.some((c) => c.connected);

  // Action: Retry failed publication
  const handleRetry = async (pubId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", pubId }),
      });
      const data = await res.json();
      if (data.success && data.destination) {
        // Optimistic state update
        setParentItems((prev) =>
          prev.map((parent) => ({
            ...parent,
            destinations: parent.destinations.map((d) =>
              d.id === pubId ? data.destination : d
            ),
          }))
        );
        // Decrement failed count
        setMetrics((m) => ({
          ...m,
          failedCount: Math.max(0, m.failedCount - 1),
          publishedThisMonth: m.publishedThisMonth + 1,
        }));
        toast("Publication retried and successfully delivered");
      }
    } catch {
      toast("Failed to retry publication");
    } finally {
      setLoading(false);
    }
  };

  // Action: Cancel schedule
  const handleCancelSchedule = async (pubId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_schedule", pubId }),
      });
      const data = await res.json();
      if (data.success && data.destination) {
        setParentItems((prev) =>
          prev.map((parent) => ({
            ...parent,
            destinations: parent.destinations.map((d) =>
              d.id === pubId ? data.destination : d
            ),
          }))
        );
        setMetrics((m) => ({
          ...m,
          scheduledCount: Math.max(0, m.scheduledCount - 1),
        }));
        toast("Scheduled publication cancelled and reverted to draft");
      }
    } catch {
      toast("Failed to cancel schedule");
    } finally {
      setLoading(false);
    }
  };

  // Action: Edit and republish (creates v+1 with updated idempotency key)
  const handleRepublish = async (pubId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "republish", pubId }),
      });
      const data = await res.json();
      if (data.success && data.destination) {
        setParentItems((prev) =>
          prev.map((parent) => ({
            ...parent,
            destinations: parent.destinations.map((d) =>
              d.id === pubId ? data.destination : d
            ),
          }))
        );
        toast(`Republished to ${data.destination.destinationName} as v${data.destination.version}`);
      }
    } catch {
      toast("Failed to republish");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (
    dest: DestinationPublication,
    parent: ParentContentPublication
  ) => {
    setActiveDestination(dest);
    setActiveParent(parent);
  };

  return (
    <div className="space-y-8">
      {/* 1. Empty State if no channels connected */}
      {!hasAnyConnectedChannels ? (
        <EmptyPublishingState type="no_channels" />
      ) : (
        <>
          {/* 2. Publishing Overview Metrics */}
          <PublishingOverviewMetrics
            metrics={metrics}
            onFilterScheduled={() => {
              setSelectedChannel("all");
              setViewMode("queue");
            }}
            onFilterFailed={() => {
              setSelectedChannel("all");
              setViewMode("queue");
            }}
          />

          {/* 3. Connected Channels Bar (Multi-Channel Support & Selectable Filter) */}
          <ConnectedChannelsBar
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
          />

          {/* 4. Publishing Queue & Calendar View Switcher Header */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <PageTabs
                  value={viewMode}
                  onChange={(v) => setViewMode(v as "queue" | "calendar")}
                  items={[
                    {
                      id: "queue",
                      label: "Publishing queue",
                      count: parentItems.length,
                      icon: List,
                    },
                    {
                      id: "calendar",
                      label: "Publishing calendar",
                      icon: Calendar,
                    },
                  ]}
                  ariaLabel="Publishing view mode"
                />
              </div>

              <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <History size={14} />
                  Delivery & webhook logs
                </Button>
              </div>
            </div>

            {/* View Mode: Unified Table Queue vs Calendar */}
            {viewMode === "queue" ? (
              <PublishingQueueTable
                parentItems={parentItems}
                selectedChannelFilter={selectedChannel}
                onOpenDetails={handleOpenDetails}
                onRetry={handleRetry}
                onCancelSchedule={handleCancelSchedule}
                onRepublish={handleRepublish}
              />
            ) : (
              <PublishingCalendarView
                parentItems={parentItems}
                onOpenDetails={handleOpenDetails}
              />
            )}
          </div>
        </>
      )}

      {/* Publication Details Drawer / Modal */}
      <PublicationDetailDrawer
        open={!!activeDestination}
        onClose={() => {
          setActiveDestination(null);
          setActiveParent(null);
        }}
        destination={activeDestination}
        parent={activeParent}
        onRetry={handleRetry}
        onCancelSchedule={handleCancelSchedule}
        onRepublish={handleRepublish}
        loading={loading}
      />

      {/* Delivery & Webhook Logs Modal */}
      <WebhookLogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        logs={webhookLogs}
      />
    </div>
  );
}

