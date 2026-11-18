"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import type {
  DestinationPublication,
  ParentContentPublication,
  PublishingChannelId,
} from "@/lib/publishing-types";
import { getChannelIcon } from "./connected-channels-bar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { addDays, format, startOfWeek } from "date-fns";

interface PublishingCalendarViewProps {
  parentItems: ParentContentPublication[];
  onOpenDetails: (destination: DestinationPublication, parent: ParentContentPublication) => void;
}

export function PublishingCalendarView({
  parentItems,
  onOpenDetails,
}: PublishingCalendarViewProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  // Generate 7 days for the current week view
  const baseDate = addDays(new Date(), currentWeekOffset * 7);
  const startDay = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDay, i));

  // Extract all scheduled and published destinations across all parents
  const allEvents: {
    dest: DestinationPublication;
    parent: ParentContentPublication;
    date: Date;
  }[] = [];

  parentItems.forEach((parent) => {
    parent.destinations.forEach((dest) => {
      const targetDateStr = dest.scheduledFor || dest.publishedAt;
      if (targetDateStr) {
        if (filterPlatform !== "all" && dest.destination !== filterPlatform) return;
        allEvents.push({
          dest,
          parent,
          date: new Date(targetDateStr),
        });
      }
    });
  });

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 sm:px-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-muted" />
          <h3 className="text-sm font-medium text-fg">
            {format(weekDays[0], "MMMM yyyy")}
          </h3>
          <span className="caption">
            Week of {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-fg"
            aria-label="Filter calendar by platform"
          >
            <option value="all">All platforms</option>
            <option value="wordpress">WordPress</option>
            <option value="linkedin">LinkedIn</option>
            <option value="shopify">Shopify</option>
            <option value="webhook">Custom webhook</option>
            <option value="reddit">Reddit</option>
          </select>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentWeekOffset((o) => o - 1)}
              className="h-8 w-8 p-0"
              aria-label="Previous week"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentWeekOffset(0)}
              className="h-8 text-xs"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentWeekOffset((o) => o + 1)}
              className="h-8 w-8 p-0"
              aria-label="Next week"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {weekDays.map((day) => {
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          const dayEvents = allEvents.filter(
            (ev) => format(ev.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
          );

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[220px] rounded-2xl border p-3 flex flex-col ${
                isToday
                  ? "border-fg bg-surface shadow-xs"
                  : "border-line bg-surface"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
                <span className="caption font-medium text-muted uppercase">
                  {format(day, "EEE")}
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums h-6 w-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-fg text-surface" : "text-fg"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Day Events */}
              <div className="space-y-1.5 flex-1">
                {dayEvents.map(({ dest, parent }) => {
                  const isScheduled = dest.status === "scheduled";
                  const isPublished = dest.status === "published";

                  return (
                    <div
                      key={dest.id}
                      onClick={() => onOpenDetails(dest, parent)}
                      className={`cursor-pointer rounded-xl border p-2 text-xs transition-colors hover:shadow-xs ${
                        isScheduled
                          ? "border-info/40 bg-info-bg/40 text-info-fg"
                          : isPublished
                          ? "border-line bg-subtle text-fg"
                          : "border-danger/40 bg-danger-bg text-danger-fg"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="shrink-0">{getChannelIcon(dest.destination)}</span>
                        <span className="font-medium truncate">{dest.destinationName}</span>
                      </div>
                      <p className="truncate font-medium text-[11px] leading-tight text-fg">
                        {parent.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="caption text-[10px]">
                          {dest.scheduledFor
                            ? format(new Date(dest.scheduledFor), "HH:mm")
                            : "Live"}
                        </span>
                        <Badge
                          tone={isScheduled ? "info" : isPublished ? "success" : "danger"}
                          className="!text-[10px] !px-1.5 !py-0"
                        >
                          {dest.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {dayEvents.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center">
                    <span className="caption text-faint">No content</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

