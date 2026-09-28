"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { HeatmapCell, HeatmapFilter } from "@/services/analytics/analytics-types";
import { isoWeekdayMondayFirst } from "@/services/analytics/analytics-period";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: HeatmapFilter; label: string }> = [
  { id: "all", label: "All Activity" },
  { id: "quran", label: "Qur'an" },
  { id: "habits", label: "Habits" },
  { id: "focus", label: "Focus" },
  { id: "reflections", label: "Reflections" },
];

function level(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio > 0.75) return 3;
  if (ratio > 0.4) return 2;
  return 1;
}

export function ActivityHeatmap({ data }: { data: Record<HeatmapFilter, HeatmapCell[]> }) {
  const [filter, setFilter] = useState<HeatmapFilter>("all");
  const cells = data[filter];
  const max = Math.max(1, ...cells.map((cell) => cell.value));
  const padded = useMemo(() => {
    if (cells.length === 0) return [];
    const offset = isoWeekdayMondayFirst(cells[0].date) - 1;
    return [...Array.from({ length: offset }, () => null), ...cells];
  }, [cells]);

  return (
    <section className="space-y-3" aria-label="Activity heatmap">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="xs"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="grid w-max grid-rows-7 grid-flow-col gap-1">
          {padded.map((cell, index) => (
            <div
              key={cell?.date ?? `pad-${index}`}
              title={cell ? `${cell.date}: ${cell.value}` : undefined}
              className={cn(
                "size-3 rounded-sm",
                !cell && "bg-transparent",
                cell && level(cell.value, max) === 0 && "bg-muted/50",
                cell && level(cell.value, max) === 1 && "bg-primary/25",
                cell && level(cell.value, max) === 2 && "bg-primary/55",
                cell && level(cell.value, max) === 3 && "bg-primary",
              )}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Last 12 months of {FILTERS.find((item) => item.id === filter)?.label.toLowerCase()}. This is activity volume, not a worship score.
      </p>
    </section>
  );
}
