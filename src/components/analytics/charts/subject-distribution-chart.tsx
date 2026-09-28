"use client";

import type { SubjectAnalytics } from "@/services/analytics/analytics-types";
import { formatMinutes } from "@/services/analytics/analytics-period";

export function SubjectDistributionChart({ data }: { data: SubjectAnalytics[] }) {
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0);

  if (data.length === 0 || totalMinutes === 0) {
    return (
      <figure className="space-y-2">
        <figcaption className="text-sm font-medium">Focus by subject</figcaption>
        <p className="py-6 text-sm text-muted-foreground">No completed focus sessions in this range.</p>
      </figure>
    );
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const segments = data.map((item, index) => {
    const percent = item.minutes / totalMinutes;
    const priorPercent = data
      .slice(0, index)
      .reduce((sum, prev) => sum + prev.minutes / totalMinutes, 0);
    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray: `${percent * circumference} ${circumference}`,
      strokeDashoffset: -priorPercent * circumference,
    };
  });

  return (
    <figure className="space-y-4">
      <figcaption className="text-sm font-medium">Focus by subject</figcaption>
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="18"
              className="text-muted/30"
            />
            {/* Colored Segments */}
            {segments.map((seg) => (
              <circle
                key={seg.subjectId}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold tracking-tight">{formatMinutes(totalMinutes)}</span>
            <span className="text-[11px] text-muted-foreground">Total focus</span>
          </div>
        </div>

        {/* Legend */}
        <ul className="space-y-2.5 text-sm">
          {segments.map((item) => (
            <li key={item.subjectId} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 truncate">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium">{item.name}</span>
              </span>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="tabular-nums font-semibold">{formatMinutes(item.minutes)}</span>
                <span className="w-9 text-right text-muted-foreground">{item.percent}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Accessible data list */}
      <ul className="sr-only">
        {segments.map((item) => (
          <li key={item.subjectId}>
            {item.name}: {formatMinutes(item.minutes)} ({item.percent}%)
          </li>
        ))}
      </ul>
    </figure>
  );
}
