"use client";

import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { cn } from "@/lib/utils";
import { formatLocalDateKey } from "@/services/calendar/calendar-service";
import type { CalendarEvent } from "@/services/calendar/calendar-types";
import { CalendarEventCard } from "./calendar-event-card";

interface CalendarMonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onToggleStatus?: (event: CalendarEvent) => void;
  className?: string;
}

export function CalendarMonthView({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
  onToggleStatus,
  className,
}: CalendarMonthViewProps) {
  // Compute the grid days including leading/trailing days of adjacent months
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Group events by dateKey for O(1) lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const existing = map.get(event.dateKey);
      if (existing) {
        existing.push(event);
      } else {
        map.set(event.dateKey, [event]);
      }
    }
    return map;
  }, [events]);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col",
        className,
      )}
    >
      {/* Day of Week Header */}
      <div
        className="border-b border-border/70 bg-muted/30 text-center text-xs font-semibold text-muted-foreground"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}
      >
        {weekDayLabels.map((day) => (
          <div key={day} className="py-2.5 tracking-wider uppercase text-[11px]">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        className="flex-1 divide-x divide-y divide-border/40"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}
      >
        {calendarDays.map((day) => {
          const dateKey = formatLocalDateKey(day);
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentToday = isToday(day);

          // Categorize day events for mobile dot indicators
          const hasTask = dayEvents.some((e) => e.type === "TASK");
          const hasPrayer = dayEvents.some((e) => e.type === "PRAYER");
          const hasFocus = dayEvents.some((e) => e.type === "FOCUS");
          const hasOther = dayEvents.some((e) => e.type === "REMINDER" || e.type === "STUDY");

          return (
            <div
              key={dateKey}
              role="button"
              tabIndex={0}
              aria-label={`${format(day, "MMMM d, yyyy")}, ${dayEvents.length} events`}
              aria-pressed={isSelected}
              onClick={() => onSelectDate(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(day);
                }
              }}
              className={cn(
                "group relative min-h-[72px] sm:min-h-[105px] lg:min-h-[120px] p-1 sm:p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40 cursor-pointer flex flex-col",
                !isCurrentMonth && "bg-muted/15 text-muted-foreground/60",
                isCurrentMonth && "bg-card text-foreground",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/40",
                "hover:bg-muted/30",
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex size-6 sm:size-7 items-center justify-center rounded-full text-xs font-medium transition-transform",
                    isCurrentToday && "bg-primary text-primary-foreground font-bold shadow-sm",
                    !isCurrentToday && isSelected && "bg-foreground/10 text-foreground font-semibold",
                    !isCurrentToday && !isSelected && "text-foreground group-hover:scale-105",
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Event count badge on tablet/desktop */}
                {dayEvents.length > 0 && (
                  <span className="hidden sm:inline-flex text-[10px] font-medium text-muted-foreground px-1 py-0.5 rounded bg-muted/60">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Mobile Indicator Dots (Compact Mode for screens < 640px) */}
              <div className="flex sm:hidden items-center justify-center gap-1 mt-auto pb-1">
                {hasTask && <span className="size-1.5 rounded-full bg-primary" />}
                {hasPrayer && <span className="size-1.5 rounded-full bg-emerald-500" />}
                {hasFocus && <span className="size-1.5 rounded-full bg-amber-500" />}
                {hasOther && <span className="size-1.5 rounded-full bg-purple-500" />}
              </div>

              {/* Tablet & Desktop Event Pills (screen >= 640px) */}
              <div className="hidden sm:flex flex-col gap-1 mt-1 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={(ev) => {
                      onSelectDate(day);
                      onEventClick?.(ev);
                    }}
                    onToggleStatus={onToggleStatus}
                  />
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] font-medium text-muted-foreground/80 pl-1 hover:text-foreground">
                    +{dayEvents.length - 3} more
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
