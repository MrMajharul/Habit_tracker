"use client";

import { Check, Clock, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePrayerCountdown } from "@/hooks/use-prayer-countdown";
import { formatPrayerTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { PrayerDaySummary, PrayerName } from "@/services/prayer";
import {
  fetchPrayerLogs,
  togglePrayerCompletion,
} from "@/services/prayer/prayer-log-service";

interface PrayerTimesCardProps {
  summary: PrayerDaySummary;
}

export function PrayerTimesCard({ summary }: PrayerTimesCardProps) {
  const countdown = usePrayerCountdown(summary.nextPrayer?.time ?? null);
  const [completedMap, setCompletedMap] = useState<Record<PrayerName, boolean>>(() => {
    const init: Record<PrayerName, boolean> = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    summary.prayers.forEach((p) => {
      init[p.name] = p.completed;
    });
    return init;
  });

  // Sync with persistent logs on client mount
  useEffect(() => {
    let mounted = true;
    fetchPrayerLogs().then((logs) => {
      if (mounted) {
        setCompletedMap((prev) => ({ ...prev, ...logs }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const progressValue = (completedCount / summary.prayers.length) * 100;

  const handleTogglePrayer = async (prayer: PrayerName, label: string) => {
    const nextState = !completedMap[prayer];
    setCompletedMap((prev) => ({ ...prev, [prayer]: nextState }));

    if (nextState) {
      toast.success(`${label} completed 🤲`, {
        description: "Salah recorded for today.",
      });
    } else {
      toast.message(`${label} unmarked`);
    }

    await togglePrayerCompletion(prayer, nextState);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-emerald-500/[0.04] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Next Prayer</CardTitle>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300"
              >
                <Sparkles className="mr-1 size-2.5" />
                Live
              </Badge>
            </div>
            <CardDescription className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3 text-primary" />
              {summary.location.city}, {summary.location.country}
            </CardDescription>
          </div>
          {summary.isMockData && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Offline calculation
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {summary.nextPrayer ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Upcoming Salah
            </p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
                  {summary.nextPrayer.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrayerTime(summary.nextPrayer.time)}
                </p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {countdown}
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Today&apos;s Prayer</span>
            <span className="font-semibold">
              {completedCount}/{summary.prayers.length} completed
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* 5 Daily Prayers with interactive toggle */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summary.prayers.map((prayer) => {
            const isCompleted = Boolean(completedMap[prayer.name]);
            const isNext = summary.nextPrayer?.name === prayer.name && !isCompleted;

            return (
              <button
                key={prayer.name}
                type="button"
                onClick={() => handleTogglePrayer(prayer.name, prayer.label)}
                className={cn(
                  "flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer text-left",
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15"
                    : isNext
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-border/70 bg-muted/20 hover:border-emerald-500/30 hover:bg-muted/40",
                )}
              >
                <div className="flex w-full items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground">{prayer.label}</span>
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full text-[10px]",
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : "border border-muted-foreground/40 text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="size-2.5" /> : null}
                  </span>
                </div>

                <p className="my-1.5 text-sm font-bold tabular-nums text-foreground">
                  {formatPrayerTime(prayer.time)}
                </p>

                <div className="flex items-center gap-1 text-[10px]">
                  {isCompleted ? (
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      ✓ Done
                    </span>
                  ) : isNext ? (
                    <span className="font-medium text-primary flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      Next
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">Tap to log</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
