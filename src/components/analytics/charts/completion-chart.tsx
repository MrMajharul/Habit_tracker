"use client";

import type { TrendPoint } from "@/services/analytics/analytics-types";
import { TrendChart } from "./trend-chart";

export function CompletionChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return <TrendChart data={data} label={label} unit="%" />;
}
