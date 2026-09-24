"use client";

import { Bell, BellOff, Check, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePrayerCountdown } from "@/hooks/use-prayer-countdown";
import { cn } from "@/lib/utils";
import { formatPrayerTime } from "@/lib/dates";
import { PrayerSettingsDialog } from "@/components/prayer/prayer-settings-dialog";
import type { PrayerDaySummary, PrayerSettings } from "@/services/prayer";

interface PrayerPageClientProps {
  summary: PrayerDaySummary;
}

const PRAYER_DESCRIPTIONS: Record<string, string> = {
  Fajr: "Dawn prayer — before sunrise",
  Dhuhr: "Midday prayer — after the sun passes zenith",
  Asr: "Afternoon prayer",
  Maghrib: "Sunset prayer — after the sun has set",
  Isha: "Night prayer",
};

function PrayerCountdownBadge({ time }: { time: Date }) {
  const countdown = usePrayerCountdown(time);
  return <span className="tabular-nums text-base font-semibold">{countdown}</span>;
}

export function PrayerPageClient({ summary: initialSummary }: PrayerPageClientProps) {
  const [summary] = useState(initialSummary);
  const [settings, setSettings] = useState<PrayerSettings & { city: string; country: string }>({
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    calculationMethod: "karachi",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    city: summary.location.city,
    country: summary.location.country,
  });
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(
    new Set(summary.prayers.filter((p) => p.completed).map((p) => p.name)),
  );

  const completedCount = completedPrayers.size;
  const totalCount = summary.prayers.length;
  const progressValue = (completedCount / totalCount) * 100;

  const handleTogglePrayer = (prayerName: string) => {
    setCompletedPrayers((prev) => {
      const next = new Set(prev);
      if (next.has(prayerName)) {
        next.delete(prayerName);
        toast.message(`${prayerName} unmarked`);
      } else {
        next.add(prayerName);
        toast.success(`${prayerName} marked as complete 🤲`);
      }
      return next;
    });
  };

  const handleSaveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    // In a real app, this would persist to Supabase and reload prayer times
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Prayer Times</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {summary.location.city}, {summary.location.country}
          </p>
        </div>
        <PrayerSettingsDialog settings={settings} onSave={handleSaveSettings} />
      </div>

      {/* Mock data notice */}
      {summary.isMockData && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
          <strong>Mock prayer times</strong> — These are example times for Dhaka. Connect a live prayer API in Phase 2 for accurate calculations.
        </div>
      )}

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Today&apos;s Progress</span>
            <Badge
              variant={completedCount === totalCount ? "default" : "secondary"}
              className={cn(
                "text-xs",
                completedCount === totalCount &&
                  "bg-emerald text-emerald-foreground",
              )}
            >
              {completedCount}/{totalCount} prayers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressValue} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount === totalCount
              ? "All prayers completed — MashAllah! 🌟"
              : completedCount === 0
                ? "No prayers logged yet today."
                : `${totalCount - completedCount} prayer${totalCount - completedCount > 1 ? "s" : ""} remaining today.`}
          </p>
        </CardContent>
      </Card>

      {/* Next Prayer Highlight */}
      {summary.nextPrayer && !completedPrayers.has(summary.nextPrayer.name) && (
        <Card className="border-emerald/30 bg-emerald/5">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald/70">
              Next Prayer
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-4xl font-semibold tracking-tight text-emerald">
                  {summary.nextPrayer.label}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {PRAYER_DESCRIPTIONS[summary.nextPrayer.label]}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatPrayerTime(summary.nextPrayer.time)}
                </p>
              </div>
              <PrayerCountdownBadge time={summary.nextPrayer.time} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Prayers List */}
      <div className="space-y-3">
        {summary.prayers.map((prayer) => {
          const isCompleted = completedPrayers.has(prayer.name);
          const isNext = summary.nextPrayer?.name === prayer.name && !isCompleted;

          return (
            <Card
              key={prayer.name}
              className={cn(
                "transition-all",
                isCompleted && "border-emerald/30 bg-emerald/5",
                isNext && !isCompleted && "border-primary/30",
              )}
            >
              <CardContent className="flex items-center gap-4 pt-4 pb-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "border-emerald bg-emerald text-emerald-foreground"
                      : "border-border bg-muted/30",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{prayer.label}</p>
                    {isNext && (
                      <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
                        Up next
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PRAYER_DESCRIPTIONS[prayer.label]}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-medium tabular-nums">
                    {formatPrayerTime(prayer.time)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label={`${prayer.notificationsEnabled ? "Disable" : "Enable"} notification for ${prayer.label}`}
                      className="rounded p-1 text-muted-foreground/60 hover:text-foreground"
                      onClick={() =>
                        toast.message("Notifications coming in Phase 5", {
                          description: "Browser push notification support.",
                        })
                      }
                    >
                      {prayer.notificationsEnabled ? (
                        <Bell className="size-3.5" />
                      ) : (
                        <BellOff className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isCompleted ? "secondary" : "outline"}
                  className={cn(
                    "shrink-0",
                    isCompleted &&
                      "border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20",
                  )}
                  onClick={() => handleTogglePrayer(prayer.name)}
                  aria-label={`Mark ${prayer.label} as ${isCompleted ? "not complete" : "complete"}`}
                >
                  {isCompleted ? "Done ✓" : "Mark done"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Prayer-Based Day Planning Hint */}
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium">💡 Plan around your prayers</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The Habits and Focus pages let you schedule tasks relative to prayer times — &quot;After Fajr&quot;, &quot;Before Asr&quot; and so on. Full prayer-based scheduling arrives in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
