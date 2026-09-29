"use client";

import type { TrendPoint } from "@/services/analytics/analytics-types";
import { TrendChart } from "./trend-chart";

export function ActivityChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return (
    <TrendChart
      data={data}
      label={label}
      description="Combined activity across prayers, habits, Qur'an, Dhikr, focus, and tasks."
    />
  );
}
