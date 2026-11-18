"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, PageTabs, Table, Th, Td, trClass } from "@/components/ui";
import { SearchInput, SelectDropdown } from "@/components/ui-form";
import type {
  DestinationPublication,
  ParentContentPublication,
  PublishingChannelId,
  PublicationStatus,
} from "@/lib/publishing-types";
import { getChannelIcon } from "./connected-channels-bar";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  RotateCw,
  Search,
  Sparkles,
} from "lucide-react";

interface PublishingQueueTableProps {
  parentItems: ParentContentPublication[];
  selectedChannelFilter: PublishingChannelId | "all";
  onOpenDetails: (destination: DestinationPublication, parent: ParentContentPublication) => void;
  onRetry: (pubId: string) => void;
  onCancelSchedule: (pubId: string) => void;
  onRepublish: (pubId: string) => void;
}

export function PublishingQueueTable({
  parentItems,
  selectedChannelFilter,
  onOpenDetails,
  onRetry,
  onCancelSchedule,
  onRepublish,
}: PublishingQueueTableProps) {
  const [expandedParents, setExpandedParents] = useState<number[]>([1, 2, 4, 6]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "website" | "social">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const toggleExpand = (contentId: number) => {
    if (expandedParents.includes(contentId)) {
      setExpandedParents(expandedParents.filter((id) => id !== contentId));
    } else {
      setExpandedParents([...expandedParents, contentId]);
    }
  };

  const expandAll = () => setExpandedParents(parentItems.map((p) => p.contentId));
  const collapseAll = () => setExpandedParents([]);

  // Filter items
  const filteredParents = parentItems.filter((parent) => {
    // 1. Channel filter from connected channels bar
    if (selectedChannelFilter !== "all") {
      const hasChannel = parent.destinations.some(
        (d) => d.destination === selectedChannelFilter
      );
      if (!hasChannel) return false;
    }

    // 2. Category filter
    if (categoryFilter !== "all") {
      const hasCategory = parent.destinations.some(
        (d) => d.category === categoryFilter
      );
      if (!hasCategory) return false;
    }

    // 3. Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "needs_attention") {
        const hasFailed = parent.destinations.some((d) => d.status === "failed");
        if (!hasFailed) return false;
      } else {
        const hasStatus = parent.destinations.some(
          (d) => d.status === statusFilter
        );
        if (!hasStatus) return false;
      }
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = parent.title.toLowerCase().includes(q);
      const matchKeyword = parent.primaryKeyword.toLowerCase().includes(q);
      const matchDest = parent.destinations.some((d) =>
        d.destinationName.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchKeyword && !matchDest) return false;
    }

    return true;
  });

  const getStatusBadgeTone = (status: PublicationStatus) => {
    switch (status) {
      case "published":
        return "success";
      case "scheduled":
        return "info";
      case "failed":
        return "danger";
      case "processing":
      case "queued":
        return "warning";
      case "draft":
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtering and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 sm:px-4">
        {/* Category Tabs */}
        <div className="min-w-0">
          <PageTabs
            size="sm"
            border={false}
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v as any)}
            items={[
              { id: "all", label: "All channels" },
              { id: "website", label: "Websites" },
              { id: "social", label: "Social" },
            ]}
            ariaLabel="Channel categories"
          />
        </div>

        {/* Status Dropdown, Search & Expand Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-56">
            <SearchInput
              placeholder="Search content or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              className="!h-8 !min-h-8 text-xs !rounded-lg"
            />
          </div>

          <div className="w-44">
            <SelectDropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="!h-8 !min-h-8 text-xs !rounded-lg py-1"
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "published", label: "Published" },
                { value: "scheduled", label: "Scheduled" },
                { value: "draft", label: "Drafts" },
                { value: "failed", label: "Failed / Attention" },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={expandedParents.length > 0 ? collapseAll : expandAll}
            className="caption font-medium text-muted hover:text-fg"
          >
            {expandedParents.length > 0 ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      {/* Main Publishing Queue Table */}
      {filteredParents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <Layers size={36} strokeWidth={1.5} className="mx-auto text-muted" />
          <h3 className="h3 mt-3">No publications match current filters</h3>
          <p className="caption mt-1">Try clearing the channel or status filters to view queued content.</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setCategoryFilter("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th className="w-8" />
              <Th>Content & Title</Th>
              <Th>Destinations</Th>
              <Th>Content type</Th>
              <Th>Status</Th>
              <Th>Published / Scheduled date</Th>
              <Th>Live URL</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => {
              const isExpanded = expandedParents.includes(parent.contentId);
              const hasFailed = parent.destinations.some((d) => d.status === "failed");
              const primaryDest = parent.destinations[0];

              return (
                <tr key={parent.contentId} className="group">
                  <td colSpan={8} className="p-0 border-b border-line last:border-b-0">
                    {/* Parent Row */}
                    <div
                      onClick={() => toggleExpand(parent.contentId)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-subtle ${
                        isExpanded ? "bg-subtle/50" : ""
                      }`}
                    >
                      {/* Accordion expand chevron */}
                      <button
                        type="button"
                        aria-label={isExpanded ? "Collapse destinations" : "Expand destinations"}
                        className="rounded p-1 text-muted transition-transform"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} strokeWidth={2} />
                        ) : (
                          <ChevronRight size={16} strokeWidth={2} />
                        )}
                      </button>

                      {/* Title & keyword */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-fg">
                            {parent.title}
                          </span>
                          <span className="rounded bg-sunken px-1.5 py-0.5 text-[11px] font-medium text-muted">
                            {parent.destinations.length} channel{parent.destinations.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="caption mt-0.5 truncate text-muted">
                          Keyword: {parent.primaryKeyword}
                        </p>
                      </div>

                      {/* Multi-destination icon badges */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {parent.destinations.map((d) => (
                          <span
                            key={d.id}
                            title={`${d.destinationName} (${d.status})`}
                            className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
                              d.status === "failed"
                                ? "border-danger bg-danger-bg text-danger-fg"
                                : d.status === "scheduled"
                                ? "border-info bg-info-bg text-info-fg"
                                : "border-line bg-surface"
                            }`}
                          >
                            {getChannelIcon(d.destination)}
                          </span>
                        ))}
                      </div>

                      {/* Content Type */}
                      <div className="w-20 capitalize text-xs text-muted">
                        {parent.contentType}
                      </div>

                      {/* Overall Status */}
                      <div className="w-28">
                        <Badge tone={hasFailed ? "danger" : getStatusBadgeTone(parent.overallStatus)}>
                          {hasFailed ? "Failed" : parent.overallStatus}
                        </Badge>
                      </div>

                      {/* External URL shortcut if available */}
                      <div className="hidden lg:block w-36 truncate text-xs">
                        {primaryDest?.externalUrl ? (
                          <a
                            href={primaryDest.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-muted hover:text-fg hover:underline"
                          >
                            <span className="truncate">View article</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (primaryDest) onOpenDetails(primaryDest, parent);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Child Destination Rows */}
                    {isExpanded && (
                      <div className="border-t border-line/60 bg-subtle/30 pl-10 pr-4 py-2 space-y-1.5">
                        {parent.destinations.map((dest) => {
                          const dateText = dest.scheduledFor
                            ? `Scheduled: ${new Date(dest.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : dest.publishedAt
                            ? `Published: ${new Date(dest.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : "Draft";

                          return (
                            <div
                              key={dest.id}
                              className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs transition-colors hover:bg-subtle/60"
                            >
                              {/* Left: Platform icon & destination name */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sunken">
                                  {getChannelIcon(dest.destination)}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-fg">{dest.destinationName}</span>
                                    <span className="caption text-muted">v{dest.version}</span>
                                    {dest.error && (
                                      <span className="text-[11px] text-danger font-medium">
                                        · {dest.error.slice(0, 48)}...
                                      </span>
                                    )}
                                  </div>
                                  <p className="caption truncate text-muted mt-0.5">
                                    {dest.adaptedSnippet}
                                  </p>
                                </div>
                              </div>

                              {/* Status & Date */}
                              <div className="flex items-center gap-6 px-4">
                                <span className="text-muted tabular-nums whitespace-nowrap">
                                  {dateText}
                                </span>
                                <Badge tone={getStatusBadgeTone(dest.status)}>
                                  {dest.status}
                                </Badge>
                              </div>

                              {/* Right: Individual Destination Actions */}
                              <div className="flex items-center gap-2">
                                {dest.externalUrl && (
                                  <a
                                    href={dest.externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 text-muted hover:text-fg"
                                    title="Open live link"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}

                                {dest.status === "failed" && (
                                  <Button
                                    size="sm"
                                    onClick={() => onRetry(dest.id)}
                                    className="gap-1 h-7 text-xs"
                                  >
                                    <RotateCw size={12} />
                                    Retry
                                  </Button>
                                )}

                                {dest.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onCancelSchedule(dest.id)}
                                    className="h-7 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onOpenDetails(dest, parent)}
                                  className="h-7 text-xs"
                                >
                                  Inspect
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

