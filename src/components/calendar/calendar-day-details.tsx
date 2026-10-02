"use client";

import React, { useMemo } from "react";
import { format, isToday } from "date-fns";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLocalDateKey } from "@/services/calendar/calendar-service";
import type { CalendarEvent } from "@/services/calendar/calendar-types";
import { CalendarEventCard } from "./calendar-event-card";

interface CalendarDayDetailsProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onToggleStatus?: (event: CalendarEvent) => void;
  onAddTask?: (dateKey: string) => void;
  className?: string;
}

export function CalendarDayDetails({
  selectedDate,
  events,
  onEventClick,
  onToggleStatus,
  onAddTask,
  className,
}: CalendarDayDetailsProps) {
  const dateKey = formatLocalDateKey(selectedDate);
  const isCurrentToday = isToday(selectedDate);

  const dayEvents = useMemo(() => {
    return events.filter((e) => e.dateKey === dateKey);
  }, [events, dateKey]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm flex flex-col space-y-4",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {format(selectedDate, "EEE, MMM d")}
            </h3>
            {isCurrentToday && (
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[11px] font-semibold">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayEvents.length === 0
              ? "No events on this day"
              : `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {onAddTask && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddTask(dateKey)}
            className="gap-1.5 h-8 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            <span>Add Task</span>
          </Button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 px-3 rounded-xl border border-dashed border-border/60 bg-muted/10">
            <p className="text-xs font-medium text-foreground">No events scheduled</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Select another day or add a task for this date.
            </p>
          </div>
        ) : (
          dayEvents.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              onClick={onEventClick}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
