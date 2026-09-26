"use client";

import { Bell, BellOff, Check, Clock, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePrayerCountdown } from "@/hooks/use-prayer-countdown";
import { cn } from "@/lib/utils";
import { formatPrayerTime } from "@/lib/dates";
import {
  PrayerSettingsDialog,
  type PrayerSettingsState,
} from "@/components/prayer/prayer-settings-dialog";
import {
  getPrayerDaySummary,
  type PrayerDaySummary,
  type PrayerName,
} from "@/services/prayer";
import {
  fetchPrayerLogs,
  togglePrayerCompletion,
} from "@/services/prayer/prayer-log-service";
import {
  fetchUserPrayerSettings,
  saveUserPrayerSettings,
} from "@/services/prayer/prayer-settings-service";

interface PrayerPageClientProps {
  summary: PrayerDaySummary;
}

const PRAYER_DESCRIPTIONS: Record<string, string> = {
  Fajr: "Dawn prayer — before sunrise",
  Dhuhr: "Midday prayer — after the sun passes zenith",
  Asr: "Late afternoon prayer",
  Maghrib: "Sunset prayer — right after sunset",
  Isha: "Night prayer",
};

function PrayerCountdownBadge({ time }: { time: Date }) {
  const countdown = usePrayerCountdown(time);
  return <span className="tabular-nums text-base font-semibold">{countdown}</span>;
}

export function PrayerPageClient({ summary: initialSummary }: PrayerPageClientProps) {
  const [summary, setSummary] = useState<PrayerDaySummary>(initialSummary);
  const [settings, setSettings] = useState<PrayerSettingsState>({
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    calculationMethod: "karachi",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    city: initialSummary.location.city,
    country: initialSummary.location.country,
  });

  const [completedPrayers, setCompletedPrayers] = useState<Set<PrayerName>>(
    new Set(initialSummary.prayers.filter((p) => p.completed).map((p) => p.name)),
  );

  // Sync prayer logs & user settings on client mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [userSettings, logs] = await Promise.all([
        fetchUserPrayerSettings(),
        fetchPrayerLogs(),
      ]);

      if (!isMounted) return;

      const completedSet = new Set<PrayerName>();
      (Object.keys(logs) as PrayerName[]).forEach((p) => {
        if (logs[p]) completedSet.add(p);
      });

      setCompletedPrayers(completedSet);
      setSettings({
        ...userSettings,
        city: userSettings.city || "Dhaka",
        country: userSettings.country || "Bangladesh",
      });

      const updatedSummary = await getPrayerDaySummary(
        userSettings,
        new Date(),
        Array.from(completedSet),
      );

      if (isMounted) {
        setSummary(updatedSummary);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const completedCount = completedPrayers.size;
  const totalCount = summary.prayers.length;
  const progressValue = (completedCount / totalCount) * 100;

  const handleTogglePrayer = async (prayerName: PrayerName) => {
    const isNowCompleted = !completedPrayers.has(prayerName);

    // Optimistic UI update
    setCompletedPrayers((prev) => {
      const next = new Set(prev);
      if (isNowCompleted) {
        next.add(prayerName);
        toast.success(`${prayerName.toUpperCase()} marked as completed`);
      } else {
        next.delete(prayerName);
        toast.message(`${prayerName.toUpperCase()} unmarked`);
      }
      return next;
    });

    // Update in service
    await togglePrayerCompletion(prayerName, isNowCompleted);

    // Refresh summary
    const updatedSummary = await getPrayerDaySummary(
      settings,
      new Date(),
      isNowCompleted
        ? [...Array.from(completedPrayers), prayerName]
        : Array.from(completedPrayers).filter((p) => p !== prayerName),
    );
    setSummary(updatedSummary);
  };

  const handleSaveSettings = async (newSettings: PrayerSettingsState) => {
    setSettings(newSettings);
    await saveUserPrayerSettings(newSettings);

    const updatedSummary = await getPrayerDaySummary(
      newSettings,
      new Date(),
      Array.from(completedPrayers),
    );
    setSummary(updatedSummary);
    toast.success("Prayer schedule updated with live calculations");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Prayer Times
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300"
            >
              <Sparkles className="mr-1 size-3" />
              Live Astronomical
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" />
            {summary.location.city}, {summary.location.country}
            <span className="text-muted-foreground/40">·</span>
            <span className="capitalize">{settings.calculationMethod}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{settings.asrMadhhab === "hanafi" ? "Hanafi" : "Standard"}</span>
          </p>
        </div>
        <PrayerSettingsDialog settings={settings} onSave={handleSaveSettings} />
      </div>

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
          <Progress value={progressValue} className="h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount === totalCount
              ? "All prayers completed for today — Alhamdulillah!"
              : completedCount === 0
                ? "No prayers logged yet today."
                : `${totalCount - completedCount} prayer${totalCount - completedCount > 1 ? "s" : ""} remaining today.`}
          </p>
        </CardContent>
      </Card>

      {/* Next Prayer Highlight */}
      {summary.nextPrayer && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Next Prayer
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-4xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
                  {summary.nextPrayer.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {PRAYER_DESCRIPTIONS[summary.nextPrayer.label] || "Obligatory daily Salah"}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
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
                isCompleted && "border-emerald-500/30 bg-emerald-500/[0.04]",
                isNext && !isCompleted && "border-primary/40 shadow-sm",
              )}
            >
              <CardContent className="flex items-center gap-4 py-3.5">
                <button
                  type="button"
                  onClick={() => handleTogglePrayer(prayer.name)}
                  aria-label={`Toggle ${prayer.label}`}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer",
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                      : "border-border bg-muted/40 hover:border-emerald-500 hover:bg-emerald-500/10",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{prayer.label}</p>
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

                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatPrayerTime(prayer.time)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`${prayer.notificationsEnabled ? "Disable" : "Enable"} reminder for ${prayer.label}`}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        toast.info(`Reminder enabled for ${prayer.label}`, {
                          description: "Notifications will trigger at adhan time.",
                        })
                      }
                    >
                      {prayer.notificationsEnabled ? (
                        <Bell className="size-3.5 text-primary" />
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
                    "shrink-0 h-8 text-xs",
                    isCompleted &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 hover:bg-emerald-500/20 dark:text-emerald-100",
                  )}
                  onClick={() => handleTogglePrayer(prayer.name)}
                >
                  {isCompleted ? (
                    <span className="flex items-center gap-1">
                      <Check className="size-3.5" />
                      Done
                    </span>
                  ) : (
                    "Mark done"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Prayer-Based Day Planning Hint */}
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="py-4">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="size-4 text-emerald" />
            <span>Plan your day around Salah</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Attach habits directly to prayer times (e.g. &quot;After Fajr → Read Qur&apos;an&quot;, &quot;After Asr → Exercise&quot;).
            Salah is the natural spiritual rhythm of the believer&apos;s day.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
