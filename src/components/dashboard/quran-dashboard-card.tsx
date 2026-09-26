"use client";

import { BookOpen, Check, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { quranGoalService } from "@/services/quran/quran-goal-service";
import { quranProgressService } from "@/services/quran/quran-progress-service";
import type { QuranProgressSummary } from "@/services/quran/quran-types";

export function QuranDashboardCard() {
  const [progress, setProgress] = useState<QuranProgressSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        setProgress(quranProgressService.getProgressSummary());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!progress) return null;

  const goalSettings = quranGoalService.getGoalSettings();
  const hasTarget = goalSettings?.isEnabled;
  const targetType = goalSettings?.targetType ?? "minutes";
  const targetValue = goalSettings?.targetValue ?? 10;
  const current =
    targetType === "minutes"
      ? progress.daily.minutesRead
      : progress.daily.ayahsRead;
  const pct = hasTarget
    ? Math.min(100, Math.round((current / targetValue) * 100))
    : 0;

  return (
    <Card className="border-emerald/20 bg-gradient-to-br from-card to-emerald/5">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-emerald" />
          Today&apos;s Qur&apos;an
        </CardTitle>
        <Link
          href="/quran"
          className="flex items-center gap-0.5 text-xs text-primary hover:underline"
        >
          Open <ChevronRight className="size-3" />
        </Link>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Daily target progress */}
        {hasTarget ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {current} / {targetValue} {targetType}
              </span>
              {pct >= 100 ? (
                <Badge className="h-4 bg-emerald/10 text-emerald border-emerald/20 text-[10px] flex items-center gap-0.5">
                  <Check className="size-2.5" />
                  Done
                </Badge>
              ) : (
                <span className="font-semibold">{pct}%</span>
              )}
            </div>
            <Progress
              value={pct}
              className={cn("h-2", pct >= 100 && "[&>div]:bg-emerald")}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progress.daily.minutesRead} min ·{" "}
              {progress.daily.ayahsRead} ayahs today
            </span>
          </div>
        )}

        {/* Continue reading */}
        {progress.lastPosition ? (
          <Link
            href="/quran"
            className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2 text-xs transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Continue from
              </span>
              <p className="font-semibold text-foreground">
                Surah{" "}
                {progress.lastPosition.surahName ??
                  `#${progress.lastPosition.surahNumber}`}{" "}
                · Ayah {progress.lastPosition.ayahNumber}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            href="/quran"
            className="flex items-center justify-center rounded-xl border border-dashed border-emerald/30 bg-emerald/5 px-3 py-2.5 text-xs font-medium text-emerald transition-colors hover:bg-emerald/10"
          >
            <BookOpen className="mr-1.5 size-3.5" />
            Start Reading
          </Link>
        )}

        {/* Streak */}
        {progress.streak.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Flame className="size-3 text-emerald" />
            <span>
              {progress.streak.currentStreak}-day reading streak
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
