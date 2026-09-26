"use client";

import { format } from "date-fns";

import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  ChevronLeft,
  Clock,
  Flame,
  Search,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { getQuranProvider, SURAH_DATA } from "@/services/quran/quran-provider";
import { quranService } from "@/services/quran/quran-service";
import { quranBookmarkService } from "@/services/quran/quran-bookmark-service";
import { quranGoalService } from "@/services/quran/quran-goal-service";
import { quranProgressService } from "@/services/quran/quran-progress-service";
import type {
  SurahInfo,
  AyahWithTranslation,
  QuranProgressSummary,
  QuranGoalSettings,
} from "@/services/quran/quran-types";

// ─── Surah Browser ──────────────────────────────────────────────────────────

function SurahBrowser({
  onSelectSurah,
  progress,
}: {
  onSelectSurah: (n: number) => void;
  progress: QuranProgressSummary;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "meccan" | "medinan">("all");

  const filtered = SURAH_DATA.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
      s.arabicName.includes(search) ||
      String(s.number) === search;
    const matchesFilter = filter === "all" || s.revelationType === filter;
    return matchesSearch && matchesFilter;
  });

  // Recently read surahs
  const sessions = quranService.getReadingSessions();
  const recentSurahNumbers = [
    ...new Set(sessions.slice(0, 5).map((s) => s.surahNumber)),
  ];
  const recentSurahs = recentSurahNumbers
    .map((n) => SURAH_DATA[n - 1])
    .filter(Boolean);

  // Bookmarked surahs
  const bookmarks = quranBookmarkService.getAllBookmarks();
  const bookmarkedSurahNumbers = [
    ...new Set(bookmarks.map((b) => b.surahNumber)),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Qur&apos;an
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read, reflect, and track your Qur&apos;an journey.
        </p>
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-emerald/20 bg-gradient-to-br from-card to-emerald/5">
          <CardContent className="pt-4 pb-3 text-center">
            <Flame className="mx-auto mb-1 size-5 text-emerald" />
            <p className="text-xl font-bold text-emerald">
              {progress.streak.currentStreak}
            </p>
            <p className="text-[11px] text-muted-foreground">Day streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Clock className="mx-auto mb-1 size-5 text-primary" />
            <p className="text-xl font-bold">
              {progress.daily.minutesRead}
            </p>
            <p className="text-[11px] text-muted-foreground">Min today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <BookOpen className="mx-auto mb-1 size-5 text-primary" />
            <p className="text-xl font-bold">
              {progress.daily.ayahsRead}
            </p>
            <p className="text-[11px] text-muted-foreground">Ayahs today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="mx-auto mb-1 size-5 text-primary" />
            <p className="text-xl font-bold">
              {progress.weekly.daysRead}/7
            </p>
            <p className="text-[11px] text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Reading */}
      {progress.lastPosition && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                Continue Reading
              </p>
              <p className="text-sm font-semibold">
                Surah {progress.lastPosition.surahName ?? `#${progress.lastPosition.surahNumber}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Ayah {progress.lastPosition.ayahNumber}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                onSelectSurah(progress.lastPosition!.surahNumber)
              }
              className="gap-1.5"
            >
              <BookOpen className="size-3.5" />
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recently Read */}
      {recentSurahs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recently Read
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentSurahs.map((s) => (
              <button
                key={s.number}
                onClick={() => onSelectSurah(s.number)}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {s.number}
                </span>
                <div>
                  <p className="text-xs font-semibold">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.arabicName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Surah by name or number…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
          {(["all", "meccan", "medinan"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarked Surahs */}
      {bookmarkedSurahNumbers.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <BookmarkCheck className="size-3.5" />
            Bookmarked
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {bookmarkedSurahNumbers.map((n) => {
              const s = SURAH_DATA[n - 1];
              return (
                <button
                  key={n}
                  onClick={() => onSelectSurah(n)}
                  className="rounded-lg border border-gold/30 bg-gold/5 px-2.5 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
                >
                  {s?.name ?? `Surah ${n}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Surah List */}
      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {filtered.length} Surahs
        </h2>
        <div className="space-y-1.5">
          {filtered.map((surah) => (
            <SurahCard
              key={surah.number}
              surah={surah}
              onClick={() => onSelectSurah(surah.number)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SurahCard({
  surah,
  onClick,
}: {
  surah: SurahInfo;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
        {surah.number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{surah.name}</p>
          <p
            className="shrink-0 text-right font-arabic text-base font-semibold text-foreground"
            dir="rtl"
          >
            {surah.arabicName}
          </p>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{surah.englishNameTranslation}</span>
          <span>·</span>
          <span>{surah.ayahCount} ayahs</span>
          <span>·</span>
          <Badge
            variant="outline"
            className={cn(
              "h-4 border px-1.5 text-[9px]",
              surah.revelationType === "meccan"
                ? "border-amber-300/30 text-amber-600 dark:text-amber-400"
                : "border-blue-300/30 text-blue-600 dark:text-blue-400",
            )}
          >
            {surah.revelationType}
          </Badge>
        </div>
      </div>
    </button>
  );
}

// ─── Qur'an Reader ──────────────────────────────────────────────────────────

function QuranReader({
  surahNumber,
  onBack,
  onSelectSurah,
}: {
  surahNumber: number;
  onBack: () => void;
  onSelectSurah?: (n: number) => void;
}) {
  const [surah, setSurah] = useState<SurahInfo | null>(null);
  const [ayahs, setAyahs] = useState<AyahWithTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provider = getQuranProvider();
    let mounted = true;

    Promise.resolve()
      .then(() => {
        if (!mounted) return null;
        setLoading(true);
        setError(null);
        return Promise.all([
          provider.getSurah(surahNumber),
          provider.getAyahs(surahNumber),
        ]);
      })
      .then((res) => {
        if (!res || !mounted) return;
        const [s, a] = res;
        setSurah(s);
        setAyahs(a);
        if (a.length === 0) {
          setError("Could not load Qur'an text. Please check your connection.");
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError("Failed to load Surah. Please check your internet connection.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [surahNumber]);

  const handleBookmarkToggle = useCallback(
    (ayahNumber: number) => {
      if (quranBookmarkService.isBookmarked(surahNumber, ayahNumber)) {
        quranBookmarkService.removeBookmark(surahNumber, ayahNumber);
        toast.success("Bookmark removed");
      } else {
        quranBookmarkService.addBookmark({
          userId: "local",
          surahNumber,
          ayahNumber,
        });
        toast.success("Ayah bookmarked");
      }
    },
    [surahNumber],
  );

  const handleLogSession = useCallback(() => {
    if (ayahs.length === 0) return;
    quranService.createReadingSession({
      userId: "local",
      surahNumber,
      startAyah: 1,
      endAyah: ayahs.length,
      minutesRead: 10,
      readingDate: format(new Date(), "yyyy-MM-dd"),
    });
    toast.success("Reading session logged — keep going!");
  }, [surahNumber, ayahs.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading Surah…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="size-4" />
          Surahs
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLogSession}
          className="gap-1.5 text-xs"
        >
          <Clock className="size-3.5" />
          Log Session
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Content source: Al-Quran Cloud API (alquran.cloud)
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Surah Title */}
          {surah && (
            <Card className="border-emerald/20 bg-gradient-to-br from-card to-emerald/5">
              <CardContent className="py-6 text-center">
                <p
                  className="font-arabic text-3xl font-bold text-foreground"
                  dir="rtl"
                >
                  {surah.arabicName}
                </p>
                <p className="mt-1 text-lg font-semibold">{surah.name}</p>
                <p className="text-sm text-muted-foreground">
                  {surah.englishNameTranslation} · {surah.ayahCount} Ayahs ·{" "}
                  {surah.revelationType === "meccan" ? "Meccan" : "Medinan"}
                </p>
                {surahNumber !== 9 && (
                  <p
                    className="mt-4 font-arabic text-xl text-foreground/80"
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ayah list */}
          <Card>
            <CardContent className="divide-y divide-border/50 p-0">
              {ayahs.map((ayah) => (
                <AyahRow
                  key={ayah.number}
                  ayah={ayah}
                  surahNumber={surahNumber}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {surahNumber > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onSelectSurah) {
                    onSelectSurah(surahNumber - 1);
                  } else {
                    onBack();
                  }
                }}
              >
                ← Surah {surahNumber - 1}
              </Button>
            )}
            <div className="flex-1" />
            {surahNumber < 114 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onSelectSurah) {
                    onSelectSurah(surahNumber + 1);
                  } else {
                    onBack();
                  }
                }}
              >
                Surah {surahNumber + 1} →
              </Button>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Content source: Al-Quran Cloud API (alquran.cloud) · Sahih International Translation
          </p>
        </>
      )}
    </div>
  );
}

// ─── Ayah Row ───────────────────────────────────────────────────────────────

function AyahRow({
  ayah,
  surahNumber,
  onBookmarkToggle,
}: {
  ayah: AyahWithTranslation;
  surahNumber: number;
  onBookmarkToggle: (n: number) => void;
}) {
  const [bookmarked, setBookmarked] = useState(
    quranBookmarkService.isBookmarked(surahNumber, ayah.number),
  );

  const handleToggle = () => {
    onBookmarkToggle(ayah.number);
    setBookmarked(!bookmarked);
  };

  return (
    <div className="group relative px-4 py-4 transition-colors hover:bg-muted/30 sm:px-6">
      {/* Ayah number & bookmark */}
      <div className="mb-2 flex items-center justify-between">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {ayah.number}
        </span>
        <button
          onClick={handleToggle}
          aria-label={
            bookmarked ? "Remove bookmark" : "Bookmark this ayah"
          }
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            bookmarked
              ? "text-gold"
              : "text-muted-foreground/40 opacity-0 group-hover:opacity-100",
          )}
        >
          {bookmarked ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </button>
      </div>

      {/* Arabic text */}
      <p
        className="font-arabic text-xl leading-loose text-foreground sm:text-2xl"
        dir="rtl"
        lang="ar"
        style={{ lineHeight: "2.2" }}
      >
        {ayah.text}
      </p>

      {/* Translation */}
      {ayah.translation && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {ayah.translation}
        </p>
      )}
    </div>
  );
}

// ─── Daily Target Settings ──────────────────────────────────────────────────

function DailyTargetCard({
  progress,
}: {
  progress: QuranProgressSummary;
}) {
  const [settings, setSettings] = useState<QuranGoalSettings | null>(
    quranGoalService.getGoalSettings(),
  );
  const [editing, setEditing] = useState(false);
  const [targetType, setTargetType] = useState<"minutes" | "ayahs">(
    settings?.targetType ?? "minutes",
  );
  const [targetValue, setTargetValue] = useState(
    settings?.targetValue ?? 10,
  );

  const handleSave = () => {
    const newSettings = quranGoalService.createGoalSettings({
      userId: "local",
      targetType,
      targetValue,
      isEnabled: true,
      prayerAnchor: settings?.prayerAnchor ?? "none",
    });
    setSettings(newSettings);
    setEditing(false);
    toast.success("Daily Qur'an target updated");
  };

  if (!settings?.isEnabled && !editing) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Target className="mx-auto mb-2 size-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No daily target set
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setEditing(true)}
          >
            Set a target
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current =
    settings?.targetType === "minutes"
      ? progress.daily.minutesRead
      : progress.daily.ayahsRead;
  const target = settings?.targetValue ?? 10;
  const pct = Math.min(100, Math.round((current / target) * 100));

  if (editing) {
    const inputClass =
      "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Qur&apos;an Target</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Type
              </label>
              <select
                value={targetType}
                onChange={(e) =>
                  setTargetType(e.target.value as "minutes" | "ayahs")
                }
                className={inputClass}
              >
                <option value="minutes">Minutes</option>
                <option value="ayahs">Ayahs</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Daily target
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(pct >= 100 && "border-emerald/30 bg-emerald/5")}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Daily Target
            </p>
            <p className="text-lg font-bold">
              {current} / {target}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {settings?.targetType}
              </span>
            </p>
          </div>
          <div className="text-right">
            {pct >= 100 ? (
              <Badge className="bg-emerald/10 text-emerald border-emerald/20 flex items-center gap-1">
                <Check className="size-3" />
                Completed
              </Badge>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>
        </div>
        <Progress
          value={pct}
          className={cn("mt-2 h-2", pct >= 100 && "[&>div]:bg-emerald")}
        />
        {pct < 100 && pct > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Keep going — you&apos;re {pct}% there today.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Streak & Stats Card ────────────────────────────────────────────────────

function StreakCard({
  progress,
}: {
  progress: QuranProgressSummary;
}) {
  const { streak } = progress;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="size-4 text-gold" />
          Reading Consistency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-2xl font-bold text-emerald">
              {streak.currentStreak}
            </p>
            <p className="text-[11px] text-muted-foreground">Current streak</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-2xl font-bold">{streak.longestStreak}</p>
            <p className="text-[11px] text-muted-foreground">Longest streak</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{streak.daysReadThisWeek} days this week</span>
          <span>{streak.daysReadThisMonth} days this month</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress.totalSessions} total sessions</span>
          <span>{progress.totalMinutes} total minutes</span>
        </div>
        {streak.currentStreak === 0 && (
          <p className="text-center text-xs text-muted-foreground italic">
            Your reading rhythm can start again today.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function QuranPageClient() {
  const searchParams = useSearchParams();
  const querySurah = searchParams?.get("surah");

  const [selectedSurah, setSelectedSurah] = useState<number | null>(() => {
    if (querySurah) {
      const parsed = parseInt(querySurah, 10);
      if (parsed >= 1 && parsed <= 114) return parsed;
    }
    return null;
  });
  const [progress, setProgress] = useState<QuranProgressSummary | null>(null);

  useEffect(() => {
    if (querySurah) {
      const parsed = parseInt(querySurah, 10);
      if (parsed >= 1 && parsed <= 114) {
        Promise.resolve().then(() => {
          setSelectedSurah(parsed);
        });
      }
    }
  }, [querySurah]);

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
  }, [selectedSurah]);

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (selectedSurah) {
    return (
      <QuranReader
        surahNumber={selectedSurah}
        onBack={() => setSelectedSurah(null)}
        onSelectSurah={(next) => setSelectedSurah(next)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SurahBrowser onSelectSurah={setSelectedSurah} progress={progress} />

      <div className="grid gap-4 md:grid-cols-2">
        <DailyTargetCard progress={progress} />
        <StreakCard progress={progress} />
      </div>

      {/* Link to bookmarks & goals */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/quran/bookmarks"
          className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <BookmarkCheck className="size-4 text-gold" />
          My Bookmarks
        </Link>
        <Link
          href="/goals"
          className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <Target className="size-4 text-primary" />
          Spiritual Goals
        </Link>
      </div>
    </div>
  );
}
