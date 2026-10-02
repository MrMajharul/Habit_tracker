"use client";

import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";

import { cn } from "@/lib/utils";
import { formatLocalDateKey } from "@/services/calendar/calendar-service";
import type { CalendarEvent } from "@/services/calendar/calendar-types";
import { CalendarEventCard } from "./calendar-event-card";

interface CalendarWeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onToggleStatus?: (event: CalendarEvent) => void;
  className?: string;
}

export function CalendarWeekView({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
  onToggleStatus,
  className,
}: CalendarWeekViewProps) {
  // Days in current week (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Group events by dateKey
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

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col",
        className,
      )}
    >
      {/* Week Grid Header */}
      <div
        className="border-b border-border/70 bg-muted/20"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}
      >
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentToday = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "py-3 px-1 text-center transition-colors border-r last:border-r-0 border-border/30 focus:outline-none focus:bg-muted/40",
                isSelected && "bg-primary/5",
              )}
            >
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold mt-1",
                  isCurrentToday && "bg-primary text-primary-foreground shadow-sm",
                  !isCurrentToday && isSelected && "bg-foreground/10 text-foreground",
                  !isCurrentToday && !isSelected && "text-foreground",
                )}
              >
                {format(day, "d")}
              </div>
            </button>
          );
        })}
      </div>

      {/* All-Day Events Row */}
      <div
        className="border-b border-border/60 bg-muted/10 min-h-[50px]"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}
      >
        {weekDays.map((day) => {
          const dateKey = formatLocalDateKey(day);
          const dayEvents = eventsByDate.get(dateKey) || [];
          const allDayEvents = dayEvents.filter((e) => e.isAllDay);

          return (
            <div
              key={`all-day-${dateKey}`}
              className="p-1.5 border-r last:border-r-0 border-border/30 flex flex-col gap-1 min-h-[44px]"
            >
              <div className="text-[10px] text-muted-foreground/70 uppercase font-medium hidden sm:block">
                All Day
              </div>
              {allDayEvents.map((event) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  compact
                  onClick={onEventClick}
                  onToggleStatus={onToggleStatus}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Timed Events Columns */}
      <div
        className="flex-1 min-h-[420px] divide-x divide-border/30 overflow-y-auto"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}
      >
        {weekDays.map((day) => {
          const dateKey = formatLocalDateKey(day);
          const dayEvents = eventsByDate.get(dateKey) || [];
          const timedEvents = dayEvents.filter((e) => !e.isAllDay);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={`timed-${dateKey}`}
              onClick={() => onSelectDate(day)}
              className={cn(
                "p-1.5 sm:p-2 flex flex-col gap-1.5 transition-colors cursor-pointer",
                isSelected && "bg-primary/[0.02]",
                "hover:bg-muted/20",
              )}
            >
              {timedEvents.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-muted-foreground/40 italic">
                  No events
                </div>
              ) : (
                timedEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={onEventClick}
                    onToggleStatus={onToggleStatus}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
