"use client";

import React from "react";
import {
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/services/calendar/calendar-types";

interface CalendarEventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  showDate?: boolean;
  onClick?: (event: CalendarEvent) => void;
  onToggleStatus?: (event: CalendarEvent) => void;
  className?: string;
}

export function CalendarEventCard({
  event,
  compact = false,
  showDate = false,
  onClick,
  onToggleStatus,
  className,
}: CalendarEventCardProps) {
  const isTask = event.type === "TASK";
  const isPrayer = event.type === "PRAYER";
  const isFocus = event.type === "FOCUS";
  const isStudy = event.type === "STUDY";
  const isReminder = event.type === "REMINDER";
  const isCompleted = event.status === "COMPLETED";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(event);
    }
  };

  // Duration display helper
  const formatDuration = (mins?: number) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  // Compact Pill for Month Grid Cells
  if (compact) {
    let bgStyle = "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
    let dotColor = "bg-primary";

    if (isPrayer) {
      bgStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      dotColor = "bg-emerald-500";
    } else if (isFocus) {
      bgStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      dotColor = "bg-amber-500";
    } else if (isReminder) {
      bgStyle = "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      dotColor = "bg-purple-500";
    } else if (isTask) {
      if (event.priority === "URGENT") {
        bgStyle = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
        dotColor = "bg-rose-500";
      } else if (event.priority === "HIGH") {
        bgStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
        dotColor = "bg-amber-500";
      } else {
        bgStyle = "bg-primary/10 text-primary border-primary/20";
        dotColor = "bg-primary";
      }
    }

    return (
      <button
        type="button"
        tabIndex={0}
        onClick={() => onClick?.(event)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full text-left rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-all duration-150 truncate border flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-ring",
          bgStyle,
          isCompleted && "opacity-60 line-through",
          className,
        )}
        title={`${event.title}${event.startTime ? ` (${event.startTime})` : ""}`}
      >
        <span className={cn("size-1.5 rounded-full shrink-0", dotColor)} />
        {event.startTime && (
          <span className="opacity-75 font-mono text-[10px] shrink-0">
            {event.startTime}
          </span>
        )}
        <span className="truncate">{event.title}</span>
      </button>
    );
  }

  // Full Card for Day View, Week View, or Selected Day Panel
  return (
    <div
      role={isTask ? "button" : "article"}
      tabIndex={isTask ? 0 : undefined}
      onClick={() => isTask && onClick?.(event)}
      onKeyDown={isTask ? handleKeyDown : undefined}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border p-3.5 transition-all duration-200 select-none text-left",
        isTask
          ? "cursor-pointer bg-card hover:bg-accent/40 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          : "bg-card/70 border-border/60",
        isPrayer && "border-emerald-500/30 bg-emerald-500/5",
        isFocus && "border-amber-500/30 bg-amber-500/5",
        isReminder && "border-purple-500/30 bg-purple-500/5",
        isCompleted && "opacity-65 bg-muted/20 border-border/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Status icon or type badge */}
          {isTask ? (
            <button
              type="button"
              aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(event);
              }}
              className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-ring rounded-full"
            >
              {isCompleted ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-4 hover:stroke-primary" />
              )}
            </button>
          ) : isPrayer ? (
            <div className="mt-0.5 size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="size-2.5" />
            </div>
          ) : isFocus ? (
            <div className="mt-0.5 size-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="size-2.5" />
            </div>
          ) : isStudy ? (
            <div className="mt-0.5 size-4 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <BookOpen className="size-2.5" />
            </div>
          ) : (
            <div className="mt-0.5 size-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bell className="size-2.5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
                className={cn(
                  "font-medium text-sm text-foreground tracking-tight leading-snug break-words",
                  isCompleted && "line-through text-muted-foreground",
                )}
              >
                {event.title}
              </h4>

              {/* Event Type Badge for non-tasks */}
              {!isTask && (
                <span
                  className={cn(
                    "text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full border",
                    isPrayer && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                    isFocus && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    isReminder && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                    isStudy && "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                  )}
                >
                  {event.type}
                </span>
              )}

              {/* Priority badge for Tasks */}
              {isTask && event.priority && event.priority !== "MEDIUM" && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    event.priority === "URGENT" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                    event.priority === "HIGH" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    event.priority === "LOW" && "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
                  )}
                >
                  {event.priority}
                </span>
              )}
            </div>

            {/* Description if present */}
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Reminder icon */}
        {event.hasReminder && (
          <span title="Active reminder configured" className="text-purple-500 shrink-0">
            <Bell className="size-3.5 fill-purple-500/20" />
          </span>
        )}
      </div>

      {/* Metadata footer */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground pt-0.5 border-t border-border/30">
        {/* Time or All-day */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <Clock className="size-3 text-muted-foreground/70" />
          {event.isAllDay ? (
            <span className="font-sans font-medium text-muted-foreground">All day</span>
          ) : event.startTime ? (
            <span>
              {event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ""}
            </span>
          ) : (
            <span>Scheduled</span>
          )}
        </div>

        {/* Duration */}
        {event.durationMinutes && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
            {formatDuration(event.durationMinutes)}
          </span>
        )}

        {/* Subject pill */}
        {event.subjectName && (
          <div className="flex items-center gap-1 text-[11px]">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: event.color || "#10b981" }}
            />
            <span className="truncate max-w-[120px]">{event.subjectName}</span>
          </div>
        )}

        {/* Contextual Prayer Relation (e.g. "After Asr", "Before Maghrib") */}
        {event.prayerContext && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Sparkles className="size-2.5" />
            {event.prayerContext}
          </span>
        )}

        {/* Date if showDate is requested */}
        {showDate && (
          <div className="flex items-center gap-1 ml-auto text-[11px]">
            <CalendarIcon className="size-3" />
            <span>{event.dateKey}</span>
          </div>
        )}
      </div>
    </div>
  );
}
