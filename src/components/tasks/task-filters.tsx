"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TaskFilterOptions } from "@/services/study/task-service";
import type { Subject, TaskPriority, TaskStatus } from "@/services/study/types";

interface TaskFiltersProps {
  filters: TaskFilterOptions;
  subjects: Subject[];
  onFilterChange: (filters: TaskFilterOptions) => void;
  overdueCount?: number;
  todayCount?: number;
}

const TIMEFRAMES: Array<{
  id: TaskFilterOptions["timeframe"];
  label: string;
}> = [
  { id: "ALL", label: "All" },
  { id: "TODAY", label: "Today" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "OVERDUE", label: "Overdue" },
  { id: "COMPLETED", label: "Completed" },
];

export function TaskFilters({
  filters,
  subjects,
  onFilterChange,
  overdueCount = 0,
  todayCount = 0,
}: TaskFiltersProps) {
  const activeTimeframe = filters.timeframe || "ALL";

  return (
    <div className="space-y-3">
      {/* Timeframe pill selector */}
      <div className="flex overflow-x-auto rounded-xl bg-muted/60 p-1 no-scrollbar">
        {TIMEFRAMES.map((tf) => {
          const isActive = activeTimeframe === tf.id;
          return (
            <button
              key={tf.id}
              type="button"
              onClick={() => onFilterChange({ ...filters, timeframe: tf.id })}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                isActive
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tf.label}</span>
              {tf.id === "OVERDUE" && overdueCount > 0 && (
                <span className="flex size-4.5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                  {overdueCount}
                </span>
              )}
              {tf.id === "TODAY" && todayCount > 0 && (
                <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {todayCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={filters.search ?? ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks or subjects…"
            className="h-9.5 pl-9 pr-8 text-sm"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Subject Filter */}
          <select
            value={filters.subjectId ?? "ALL"}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                subjectId: e.target.value as string,
              })
            }
            className="h-9.5 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Filter by subject"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority ?? "ALL"}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                priority: e.target.value as TaskPriority | "ALL",
              })
            }
            className="h-9.5 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status ?? "ALL"}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as TaskStatus | "ALL",
              })
            }
            className="h-9.5 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Filter by status"
          >
            <option value="ALL">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
