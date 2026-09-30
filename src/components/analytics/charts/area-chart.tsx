"use client";

import type { TrendPoint } from "@/services/analytics/analytics-types";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  data: TrendPoint[];
  label: string;
  unit?: string;
  className?: string;
}

export function AnalyticsAreaChart({ data, label, unit, className }: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <figure className={cn("space-y-2", className)}>
        <figcaption className="text-sm font-medium">{label}</figcaption>
        <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
      </figure>
    );
  }

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const height = 140;
  const width = 500;
  const paddingX = 20;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, "");
  const firstP = points[0];
  const lastP = points[points.length - 1];
  const areaD = `${pathD} L ${lastP.x.toFixed(1)},${(paddingY + chartHeight).toFixed(1)} L ${firstP.x.toFixed(1)},${(paddingY + chartHeight).toFixed(1)} Z`;

  return (
    <figure className={cn("space-y-2 min-w-0 max-w-full", className)}>
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border/40 bg-card/40 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s+/g, "-")}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((ratio) => (
            <line
              key={ratio}
              x1={paddingX}
              y1={paddingY + chartHeight * ratio}
              x2={width - paddingX}
              y2={paddingY + chartHeight * ratio}
              stroke="currentColor"
              className="text-border/40"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}
          {/* Gradient area */}
          <path d={areaD} fill={`url(#gradient-${label.replace(/\s+/g, "-")})`} />
          {/* Stroke path */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data dots */}
          {points.map((p) => (
            <circle
              key={p.date}
              cx={p.x}
              cy={p.y}
              r="3.5"
              className="fill-background stroke-primary stroke-[2]"
            />
          ))}
        </svg>
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between px-1 text-[11px] text-muted-foreground min-w-0 max-w-full overflow-hidden">
        {data.map((p, i) => {
          const show =
            data.length <= 7 ||
            i === 0 ||
            i === data.length - 1 ||
            i === Math.floor(data.length / 2);
          if (!show) return null;
          return (
            <span key={p.date} className="truncate">
              {p.label}
            </span>
          );
        })}
      </div>

      {/* Accessible screen reader list */}
      <ul className="sr-only">
        {data.map((p) => (
          <li key={p.date}>
            {p.date} ({p.label}): {p.value} {unit ?? ""}
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function AreaChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return <AnalyticsAreaChart data={data} label={label} />;
}
