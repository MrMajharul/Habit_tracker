"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckSquare, Clock, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { analyticsService } from "@/services/analytics/analytics-service";
import { formatMinutes } from "@/services/analytics/analytics-period";
import { cn } from "@/lib/utils";

export function YourProgressCard() {
  const [data, setData] = useState<{
    quranMinutes: number;
    focusMinutes: number;
    tasksCompleted: number;
    habitRate: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const tz =
          typeof window !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
            : "UTC";
        const { summary } = await analyticsService.loadAnalyticsSummary({
          timezone: tz,
          preset: "this_week",
        });
        if (isMounted) {
          setData({
            quranMinutes: summary.quran.minutesRead,
            focusMinutes: summary.focus.totalMinutes,
            tasksCompleted: summary.tasks.completed,
            habitRate: summary.habits.completionRate,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard progress summary:", err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Your Progress</CardTitle>
          <p className="text-xs text-muted-foreground">This Week</p>
        </div>
        <Link
          href="/analytics"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs text-primary hover:text-primary")}
        >
          <span>View Analytics</span>
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/50 p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <BookOpen className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Qur&apos;an</p>
              <p className="text-sm font-bold tracking-tight">
                {data ? formatMinutes(data.quranMinutes) : "..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/50 p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Focus</p>
              <p className="text-sm font-bold tracking-tight">
                {data ? formatMinutes(data.focusMinutes) : "..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/50 p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
              <Target className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Tasks</p>
              <p className="text-sm font-bold tracking-tight">
                {data ? `${data.tasksCompleted} completed` : "..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/50 p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckSquare className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Habits</p>
              <p className="text-sm font-bold tracking-tight">
                {data ? `${data.habitRate}%` : "..."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
