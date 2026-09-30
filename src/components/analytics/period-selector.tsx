"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AnalyticsPeriodPreset } from "@/services/analytics/analytics-types";

const PRESETS: Array<{ id: AnalyticsPeriodPreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "last_week", label: "Last Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_30_days", label: "Last 30 Days" },
  { id: "custom", label: "Custom" },
];

interface PeriodSelectorProps {
  preset: AnalyticsPeriodPreset;
  customStart: string;
  customEnd: string;
  onPresetChange: (preset: AnalyticsPeriodPreset) => void;
  onCustomChange: (start: string, end: string) => void;
}

export function PeriodSelector({
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
}: PeriodSelectorProps) {
  return (
    <div className="space-y-3 min-w-0 max-w-full">
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar min-w-0 max-w-full" role="tablist" aria-label="Date range">
        {PRESETS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={preset === item.id ? "default" : "outline"}
            aria-pressed={preset === item.id}
            onClick={() => onPresetChange(item.id)}
            className="shrink-0 h-8 px-2.5 text-xs whitespace-nowrap"
          >
            {item.label}
          </Button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="analytics-start">Start</Label>
            <Input
              id="analytics-start"
              type="date"
              value={customStart}
              onChange={(event) => onCustomChange(event.target.value, customEnd)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="analytics-end">End</Label>
            <Input
              id="analytics-end"
              type="date"
              value={customEnd}
              onChange={(event) => onCustomChange(customStart, event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
