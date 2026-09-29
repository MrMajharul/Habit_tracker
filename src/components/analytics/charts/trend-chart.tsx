"use client";

import { useState } from "react";
import type { TrendPoint } from "@/services/analytics/analytics-types";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  data: TrendPoint[];
  label: string;
  unit?: string;
  className?: string;
  description?: string;
}

export function TrendChart({ data, label, unit, className, description }: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Empty state
  if (!data || data.length === 0) {
    return (
      <figure className={cn("space-y-2", className)}>
        <figcaption className="text-sm font-medium">{label}</figcaption>
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">No activity recorded yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Data will appear as you use the app.
            </p>
          </div>
        </div>
      </figure>
    );
  }

  const max = Math.max(1, ...data.map((point) => point.value));
  const hasMultipleDays = data.length > 1;
  const totalValue = data.reduce((sum, p) => sum + p.value, 0);
  const avgValue = totalValue / data.length;

  // For single-day data, show a centered card instead of stretching one bar
  if (!hasMultipleDays) {
    const point = data[0];
    return (
      <figure className={cn("space-y-2", className)}>
        <figcaption className="text-sm font-medium">{label}</figcaption>
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/40 bg-muted/10">
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums text-primary">
              {point.value}
              {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{point.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              Only 1 day of data — more days will show a trend chart
            </p>
          </div>
        </div>
      </figure>
    );
  }

  return (
    <figure className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <figcaption className="text-sm font-medium">{label}</figcaption>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{totalValue}{unit ? ` ${unit}` : ""}</strong>
          </span>
          <span>
            Avg: <strong className="text-foreground">{avgValue.toFixed(1)}{unit ? ` ${unit}` : ""}</strong>
          </span>
        </div>
      </div>

      {description && (
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{description}</p>
      )}

      <div className="relative">
        {/* Average line */}
        {avgValue > 0 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-primary/20 pointer-events-none z-10"
            style={{ bottom: `${Math.max(4, (avgValue / max) * 100)}%` }}
          >
            <span className="absolute -top-3 right-0 text-[9px] text-primary/50 font-medium">
              avg
            </span>
          </div>
        )}

        <div
          className="flex items-end gap-1 overflow-x-auto pb-1"
          style={{ height: data.length > 14 ? "10rem" : "9rem" }}
          role="img"
          aria-label={label}
        >
          {data.map((point, i) => {
            const heightPercent = Math.max(4, (point.value / max) * 100);
            const isHovered = hoveredIndex === i;
            const isZero = point.value === 0;

            return (
              <div
                key={point.date}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-150",
                  data.length <= 7 ? "min-w-10 flex-1" : data.length <= 14 ? "min-w-7 flex-1" : "min-w-5 flex-1",
                )}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(i)}
                onTouchEnd={() => setHoveredIndex(null)}
              >
                {/* Value tooltip */}
                <span
                  className={cn(
                    "text-[10px] tabular-nums font-medium transition-opacity",
                    isHovered || data.length <= 7 ? "opacity-100" : "opacity-0",
                    isZero ? "text-muted-foreground/50" : "text-foreground",
                  )}
                >
                  {point.value}
                  {unit && data.length <= 7 ? ` ${unit}` : ""}
                </span>

                {/* Bar container */}
                <div
                  className={cn(
                    "flex w-full items-end rounded-t-md bg-muted/30 transition-all",
                    data.length <= 7 ? "h-24" : data.length <= 14 ? "h-20" : "h-16",
                  )}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300",
                      isZero
                        ? "bg-muted/50"
                        : isHovered
                          ? "bg-primary shadow-sm"
                          : "bg-primary/70",
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    "text-[10px] text-muted-foreground truncate max-w-full",
                    isHovered && "text-foreground font-medium",
                  )}
                >
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessible data table */}
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
