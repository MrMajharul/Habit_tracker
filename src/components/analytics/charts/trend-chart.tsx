"use client";

import type { TrendPoint } from "@/services/analytics/analytics-types";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  data: TrendPoint[];
  label: string;
  unit?: string;
  className?: string;
}

export function TrendChart({ data, label, unit, className }: TrendChartProps) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <figure className={cn("space-y-2", className)}>
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div className="flex h-36 items-end gap-1 overflow-x-auto pb-1" role="img" aria-label={label}>
        {data.map((point) => (
          <div key={point.date} className="flex min-w-8 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {point.value}
              {unit ? ` ${unit}` : ""}
            </span>
            <div className="flex h-24 w-full items-end rounded-sm bg-muted/50">
              <div
                className="w-full rounded-sm bg-primary motion-reduce:transition-none"
                style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {data.map((point) => (
          <li key={point.date}>
            {point.date}: {point.value}
            {unit ? ` ${unit}` : ""}
          </li>
        ))}
      </ul>
    </figure>
  );
}
