"use client";

import type { TrendPoint } from "@/services/analytics/analytics-types";
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  label: string;
  className?: string;
}

export function AnalyticsBarChart({ data, label, className }: BarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <figure className={cn("space-y-3", className)}>
      <figcaption className="text-sm font-medium">{label}</figcaption>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity in this range.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="tabular-nums text-muted-foreground">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary motion-reduce:transition-none"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

export function AreaChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return <AnalyticsBarChart label={label} data={data.map((p) => ({ name: p.label, value: p.value }))} />;
}

export function ActivityChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return <AnalyticsBarChart label={label} data={data.map((p) => ({ name: p.label, value: p.value }))} />;
}

export function CompletionChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return <AnalyticsBarChart label={label} data={data.map((p) => ({ name: p.label, value: p.value }))} />;
}
