"use client";

import React from "react";
import { Bell, BookOpen, CheckSquare, Flame, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CalendarFilters } from "@/services/calendar/calendar-types";

interface CalendarFiltersBarProps {
  filters: CalendarFilters;
  onChange: (newFilters: CalendarFilters) => void;
  className?: string;
}

export function CalendarFiltersBar({
  filters,
  onChange,
  className,
}: CalendarFiltersBarProps) {
  const toggle = (key: keyof CalendarFilters) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const filterConfigs: Array<{
    key: keyof CalendarFilters;
    label: string;
    icon: React.ElementType;
    activeClasses: string;
  }> = [
    {
      key: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      activeClasses:
        "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90",
    },
    {
      key: "prayer",
      label: "Prayer",
      icon: Sparkles,
      activeClasses:
        "bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-700 dark:bg-emerald-500",
    },
    {
      key: "focus",
      label: "Focus",
      icon: Flame,
      activeClasses:
        "bg-amber-500 text-white border-amber-500 shadow-sm hover:bg-amber-600",
    },
    {
      key: "study",
      label: "Study",
      icon: BookOpen,
      activeClasses:
        "bg-sky-600 text-white border-sky-600 shadow-sm hover:bg-sky-700",
    },
    {
      key: "reminders",
      label: "Reminders",
      icon: Bell,
      activeClasses:
        "bg-purple-600 text-white border-purple-600 shadow-sm hover:bg-purple-700",
    },
  ];

  return (
    <div
      role="group"
      aria-label="Filter calendar events"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-wrap",
        className,
      )}
    >
      <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">
        Filter:
      </span>
      {filterConfigs.map(({ key, label, icon: Icon, activeClasses }) => {
        const isActive = filters[key];
        return (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={isActive}
            suppressHydrationWarning
            onClick={() => toggle(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 border select-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[36px] sm:min-h-[32px]",
              isActive
                ? activeClasses
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
