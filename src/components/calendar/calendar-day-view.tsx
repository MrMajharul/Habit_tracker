"use client";

import React, { useMemo } from "react";
import { format, isToday } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLocalDateKey } from "@/services/calendar/calendar-service";
import type { CalendarEvent } from "@/services/calendar/calendar-types";
import { CalendarEventCard } from "./calendar-event-card";

interface CalendarDayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onToggleStatus?: (event: CalendarEvent) => void;
  onAddTask?: (dateKey: string) => void;
  className?: string;
}

export function CalendarDayView({
  selectedDate,
  events,
  onEventClick,
  onToggleStatus,
  onAddTask,
  className,
}: CalendarDayViewProps) {
  const dateKey = formatLocalDateKey(selectedDate);
  const isCurrentToday = isToday(selectedDate);

  // Filter events for this specific day
  const dayEvents = useMemo(() => {
    return events.filter((e) => e.dateKey === dateKey);
  }, [events, dateKey]);

  // Separate all-day vs timed
  const allDayEvents = useMemo(() => {
    return dayEvents.filter((e) => e.isAllDay);
  }, [dayEvents]);

  const timedEvents = useMemo(() => {
    return dayEvents.filter((e) => !e.isAllDay);
  }, [dayEvents]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col p-4 sm:p-6 space-y-6",
        className,
      )}
    >
      {/* Day Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h2>
            {isCurrentToday && (
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-semibold">
                Today
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {dayEvents.length === 0
              ? "No scheduled items"
              : `${dayEvents.length} scheduled item${dayEvents.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {onAddTask && (
          <Button
            size="sm"
            onClick={() => onAddTask(dateKey)}
            className="self-start sm:self-auto gap-1.5 shadow-sm"
          >
            <Plus className="size-4" />
            <span>Add Task</span>
          </Button>
        )}
      </div>

      {/* All-Day Events Section */}
      {allDayEvents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            <span>All Day</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {allDayEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onClick={onEventClick}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timed Chronological Events Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule &amp; Timeline
        </h3>

        {timedEvents.length === 0 && allDayEvents.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
            <p className="text-sm font-medium text-foreground">No events for this day</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Plan your study or tasks around your Salah routine by adding a task.
            </p>
            {onAddTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddTask(dateKey)}
                className="mt-4 gap-1.5"
              >
                <Plus className="size-4" />
                <span>Add Task for this Day</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {timedEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onClick={onEventClick}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
