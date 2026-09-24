"use client";

import { Bell, MapPin } from "lucide-react";

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
import type { PrayerDaySummary } from "@/services/prayer";

interface PrayerTimesCardProps {
  summary: PrayerDaySummary;
}

export function PrayerTimesCard({ summary }: PrayerTimesCardProps) {
  const countdown = usePrayerCountdown(summary.nextPrayer?.time ?? null);
  const completedCount = summary.prayers.filter((p) => p.completed).length;
  const progressValue = (completedCount / summary.prayers.length) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-emerald/5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              Next Prayer
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {summary.location.city}, {summary.location.country}
            </CardDescription>
          </div>
          {summary.isMockData && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Mock data
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {summary.nextPrayer ? (
          <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-4">
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-emerald">
                  {summary.nextPrayer.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPrayerTime(summary.nextPrayer.time)}
                </p>
              </div>
              <p className="text-lg font-medium tabular-nums">{countdown}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today&apos;s progress</span>
            <span className="font-medium">
              {completedCount}/{summary.prayers.length}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summary.prayers.map((prayer) => (
            <li
              key={prayer.name}
              className={`rounded-xl border px-3 py-2.5 text-center transition-colors ${
                prayer.completed
                  ? "border-emerald/30 bg-emerald/10"
                  : summary.nextPrayer?.name === prayer.name
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-muted/30"
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {prayer.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatPrayerTime(prayer.time)}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1">
                {prayer.completed ? (
                  <span className="text-[10px] font-medium text-emerald">
                    Done
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Pending
                  </span>
                )}
                {prayer.notificationsEnabled && (
                  <Bell className="size-3 text-muted-foreground/70" />
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
