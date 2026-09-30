"use client";

import { AlertTriangle, Bell, BellOff, Check, Clock, MapPin, ShieldAlert, Sparkles } from "lucide-react";
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
  isPrayerAvailable,
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
import { computeForbiddenTimes, type ForbiddenTimeWindow } from "@/services/prayer/forbidden-times";

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

// Calculation method display labels
const METHOD_LABELS: Record<string, string> = {
  karachi: "University of Islamic Sciences, Karachi",
  isna: "Islamic Society of North America (ISNA)",
  north_america: "Islamic Society of North America (ISNA)",
  mwl: "Muslim World League",
  muslim_world_league: "Muslim World League",
  makkah: "Umm al-Qura University, Makkah",
  umm_al_qura: "Umm al-Qura University, Makkah",
  egypt: "Egyptian General Authority of Survey",
  egyptian: "Egyptian General Authority of Survey",
  tehran: "Institute of Geophysics, University of Tehran",
  gulf: "Gulf Region",
  dubai: "Gulf Region (Dubai)",
  kuwait: "Kuwait",
  qatar: "Qatar",
  singapore: "Majlis Ugama Islam Singapura (MUIS)",
  muis: "Majlis Ugama Islam Singapura (MUIS)",
  turkey: "Diyanet İşleri Başkanlığı, Turkey",
  moonsighting: "Moonsighting Committee Worldwide",
};


function PrayerCountdownBadge({ time }: { time: Date }) {
  const countdown = usePrayerCountdown(time);
  return <span className="tabular-nums text-base font-semibold">{countdown}</span>;
}

function ForbiddenTimesSection({ windows }: { windows: ForbiddenTimeWindow[] }) {
  if (windows.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
          <span>Forbidden Prayer Times</span>
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-300">
            Today
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Voluntary (Nafl) prayers should not be performed during these periods.
          Obligatory (Fard) prayers are not affected.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {windows.map((w) => (
            <div
              key={w.name}
              className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{w.name}</p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {formatPrayerTime(w.start)} — {formatPrayerTime(w.end)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/70 pt-1">
          Reference: Based on established Islamic jurisprudence regarding prohibited prayer periods
          (Sahih Muslim 831, Abu Dawud 1274).
        </p>
      </CardContent>
    </Card>
  );
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

  const [forbiddenTimes, setForbiddenTimes] = useState<ForbiddenTimeWindow[]>([]);
  const [now, setNow] = useState(new Date());

  // Update "now" every minute for prayer availability checks
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

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

        // Compute forbidden times
        const forbidden = computeForbiddenTimes({
          latitude: userSettings.latitude || 23.8103,
          longitude: userSettings.longitude || 90.4125,
          calculationMethod: userSettings.calculationMethod || "karachi",
          asrMadhhab: userSettings.asrMadhhab || "standard",
        });
        setForbiddenTimes(forbidden);
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

    // Timing validation: prevent marking as complete before prayer time begins
    if (isNowCompleted && !isPrayerAvailable(prayerName, summary.prayers, now)) {
      const prayer = summary.prayers.find((p) => p.name === prayerName);
      toast.warning(`${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} hasn't started yet`, {
        description: prayer
          ? `Available at ${formatPrayerTime(prayer.time)}`
          : "Please wait for the prayer time to begin.",
      });
      return;
    }

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

    // Recompute forbidden times with new settings
    const forbidden = computeForbiddenTimes({
      latitude: newSettings.latitude || 23.8103,
      longitude: newSettings.longitude || 90.4125,
      calculationMethod: newSettings.calculationMethod || "karachi",
      asrMadhhab: newSettings.asrMadhhab || "standard",
    });
    setForbiddenTimes(forbidden);

    toast.success("Prayer schedule updated with live calculations");
  };

  const methodLabel = METHOD_LABELS[settings.calculationMethod] || settings.calculationMethod;

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
          <div className="mt-1 space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              {summary.location.city}, {summary.location.country}
              <span className="text-muted-foreground/40">·</span>
              <span>{settings.asrMadhhab === "hanafi" ? "Hanafi" : "Standard"}</span>
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Calculation: {methodLabel}
            </p>
          </div>
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
          const available = isPrayerAvailable(prayer.name, summary.prayers, now);
          const canMark = available || isCompleted; // Allow unmarking even if time hasn't come

          return (
            <Card
              key={prayer.name}
              className={cn(
                "transition-all",
                isCompleted && "border-emerald-500/30 bg-emerald-500/[0.04]",
                isNext && !isCompleted && "border-primary/40 shadow-sm",
                !available && !isCompleted && "opacity-60",
              )}
            >
              <CardContent className="flex items-center gap-4 py-3.5">
                <button
                  type="button"
                  onClick={() => handleTogglePrayer(prayer.name)}
                  disabled={!canMark}
                  aria-label={`Toggle ${prayer.label}`}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 cursor-pointer"
                      : canMark
                        ? "border-border bg-muted/40 hover:border-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                        : "border-border/50 bg-muted/20 cursor-not-allowed",
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
                    {!available && !isCompleted && (
                      <Badge variant="outline" className="border-muted-foreground/30 text-[10px] text-muted-foreground">
                        Not yet
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
                  disabled={!canMark}
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
                  ) : available ? (
                    "Mark done"
                  ) : (
                    "Upcoming"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Forbidden Prayer Times */}
      <ForbiddenTimesSection windows={forbiddenTimes} />

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
