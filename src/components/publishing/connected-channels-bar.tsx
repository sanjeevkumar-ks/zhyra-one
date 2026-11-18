"use client";

import Link from "next/link";
import { Badge, btnClass } from "@/components/ui";
import type { ConnectedChannel, PublishingChannelId } from "@/lib/publishing-types";
import {
  AlertTriangle,
  Globe,
  Layers,
  MessageCircle,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Webhook,
  PlugZap,
  Check,
} from "lucide-react";

interface ConnectedChannelsBarProps {
  channels: ConnectedChannel[];
  selectedChannel: PublishingChannelId | "all";
  onSelectChannel: (channel: PublishingChannelId | "all") => void;
}

export function getChannelIcon(channelId: PublishingChannelId) {
  switch (channelId) {
    case "wordpress":
      return <Globe size={16} className="text-fg" />;
    case "shopify":
      return <ShoppingBag size={16} className="text-success-fg" />;
    case "webflow":
      return <Layers size={16} className="text-info-fg" />;
    case "webhook":
      return <Webhook size={16} className="text-fg" />;
    case "linkedin":
      return <Share2 size={16} className="text-info-fg" />;
    case "reddit":
      return <MessageCircle size={16} className="text-warning-fg" />;
    default:
      return <PlugZap size={16} className="text-muted" />;
  }
}

export function ConnectedChannelsBar({
  channels,
  selectedChannel,
  onSelectChannel,
}: ConnectedChannelsBarProps) {
  const connectedChannels = channels.filter((c) => c.connected);
  const expiringChannels = channels.filter((c) => c.tokenExpiresAt);

  return (
    <div className="space-y-3">
      {/* Expiry Warning Banner if any channel is close to token expiration */}
      {expiringChannels.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning-bg p-3.5 text-xs text-warning-fg">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-warning" />
            <span>
              <span className="font-semibold">Authentication notice:</span>{" "}
              {expiringChannels.map((c) => (
                <span key={c.id}>
                  {c.name} OAuth access token expires in 4 days. Reconnect in Integrations to maintain scheduled delivery.
                </span>
              ))}
            </span>
          </div>
          <Link
            href="/integrations"
            className="text-xs font-semibold text-warning-fg underline underline-offset-4 hover:opacity-80"
          >
            Reconnect now
          </Link>
        </div>
      )}

      {/* Header with Manage Connectors Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="h3">Connected channels</h3>
          <p className="caption mt-0.5">
            Select a channel to isolate its distribution queue and scheduled items.
          </p>
        </div>
        <Link href="/integrations" className={btnClass("outline", "sm", "gap-1.5")}>
          <SlidersHorizontal size={14} />
          Manage connectors
        </Link>
      </div>

      {/* Channel Pills / Filter Cards */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* All Channels Option */}
        <button
          type="button"
          onClick={() => onSelectChannel("all")}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
            selectedChannel === "all"
              ? "border-fg bg-fg text-surface shadow-sm"
              : "border-line bg-surface text-fg hover:bg-subtle"
          }`}
        >
          <Layers size={14} />
          <span>All channels</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[11px] tabular-nums ${
              selectedChannel === "all" ? "bg-surface/20 text-surface" : "bg-sunken text-muted"
            }`}
          >
            {connectedChannels.length}
          </span>
        </button>

        {/* Individual Connected Channels */}
        {connectedChannels.map((channel) => {
          const isSelected = selectedChannel === channel.id;
          const hasWarning = !!channel.tokenExpiresAt;

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelectChannel(channel.id)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? "border-fg bg-fg text-surface shadow-sm"
                  : hasWarning
                  ? "border-warning/50 bg-surface text-fg hover:bg-warning-bg/30"
                  : "border-line bg-surface text-fg hover:bg-subtle"
              }`}
            >
              <span className={isSelected ? "text-surface" : ""}>
                {getChannelIcon(channel.id)}
              </span>
              <span>{channel.name}</span>

              {/* Status pill / counts */}
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] tabular-nums ${
                  isSelected
                    ? "bg-surface/20 text-surface"
                    : "bg-sunken text-muted"
                }`}
              >
                {channel.publishedCount} live
                {channel.scheduledCount > 0 && ` · ${channel.scheduledCount} sched`}
              </span>

              {hasWarning && (
                <span
                  title="Token expiring soon"
                  className="flex h-2 w-2 rounded-full bg-warning animate-pulse"
                />
              )}
            </button>
          );
        })}

        {/* Suggestion to connect more if less than 4 connected */}
        {connectedChannels.length < 4 && (
          <Link
            href="/integrations"
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2 text-xs text-muted hover:border-line-strong hover:text-fg"
          >
            <span>+ Add destination</span>
          </Link>
        )}
      </div>
    </div>
  );
}

