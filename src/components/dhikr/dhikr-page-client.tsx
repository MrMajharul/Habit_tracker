"use client";

import {
  BookOpen,
  Check,
  ChevronLeft,
  Compass,
  Heart,
  HeartHandshake,
  Layers,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Star,
  Sunrise,
  Sunset,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CanonicalDhikr, CustomDhikr, DhikrCategory } from "@/services/dhikr/dhikr-types";
import {
  addDhikrFavorite,
  completeDhikrSession,
  createDhikrSession,
  deleteCustomDhikr,
  getAllDhikr,
  getCustomDhikr,
  getDhikrByCategory,
  getDhikrFavorites,
  isDhikrFavorite,
  removeDhikrFavorite,
  searchDhikr,
  updateDhikrSession,
} from "@/services/dhikr/dhikr-service";
import { CustomDhikrDialog } from "./custom-dhikr-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "library" | "counter" | "adhkar_morning" | "adhkar_evening";

interface CounterState {
  dhikr: CanonicalDhikr;
  count: number;
  sessionId?: string;
}

// ─── Helper: Custom to Canonical Adapter ──────────────────────────────────────

function customToCanonical(custom: CustomDhikr): CanonicalDhikr {
  return {
    id: custom.id,
    arabic: custom.arabic || custom.name,
    transliteration: custom.transliteration,
    translationEn: custom.translation || custom.name,
    translationBn: custom.translation,
    recommendedCount: custom.targetCount,
    category: custom.category,
    source: "Personal",
    reference: custom.notes || "Personal Custom Dhikr",
    grade: "ungraded",
  };
}

// ─── Category Metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<DhikrCategory | "favorites" | "all", { label: string; icon: LucideIcon }> = {
  all: { label: "All Dhikr", icon: Layers },
  favorites: { label: "Favorites", icon: Heart },
  personal: { label: "My Dhikr", icon: User },
  morning: { label: "Morning", icon: Sunrise },
  evening: { label: "Evening", icon: Sunset },
  after_salah: { label: "After Salah", icon: Compass },
  general: { label: "General", icon: Sparkles },
  sleep: { label: "Sleep", icon: Moon },
  protection: { label: "Protection", icon: Shield },
  gratitude: { label: "Gratitude", icon: HeartHandshake },
  forgiveness: { label: "Forgiveness", icon: RotateCcw },
  ramadan: { label: "Ramadan", icon: Star },
  dua: { label: "Dua", icon: BookOpen },
};

const CATEGORY_ORDER: (DhikrCategory | "favorites" | "all")[] = [
  "all",
  "favorites",
  "personal",
  "morning",
  "evening",
  "after_salah",
  "general",
  "forgiveness",
  "gratitude",
  "protection",
  "sleep",
  "ramadan",
];

const MOCK_USER_ID = "local-user";

// ─── Dhikr Card ───────────────────────────────────────────────────────────────

function DhikrLibraryCard({
  dhikr,
  isFav,
  onStartCounter,
  onToggleFavorite,
  onDelete,
}: {
  dhikr: CanonicalDhikr;
  isFav: boolean;
  onStartCounter: (d: CanonicalDhikr) => void;
  onToggleFavorite: (d: CanonicalDhikr) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card className="group transition-all hover:border-primary/30 hover:shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="space-y-3">
          {/* Arabic */}
          <p
            className="text-2xl leading-[2] text-foreground sm:text-3xl"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "serif" }}
          >
            {dhikr.arabic}
          </p>

          {/* Translation */}
          {dhikr.transliteration && (
            <p className="text-sm font-medium text-primary/80">{dhikr.transliteration}</p>
          )}
          <p className="text-sm text-muted-foreground">{dhikr.translationEn}</p>
          {dhikr.translationBn && (
            <p className="text-xs text-muted-foreground/70">{dhikr.translationBn}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {dhikr.recommendedCount}×
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {CATEGORY_META[dhikr.category]?.label ?? dhikr.category}
            </Badge>
            <span className={cn(
              "text-[10px]",
              dhikr.source === "Personal" ? "font-semibold text-primary" : "text-muted-foreground"
            )}>
              {dhikr.source}
            </span>
            {dhikr.grade && dhikr.grade !== "ungraded" && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {dhikr.grade}
              </Badge>
            )}
          </div>

          {/* Reference */}
          <p className="text-[10px] text-muted-foreground/60">{dhikr.reference}</p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onStartCounter(dhikr)}
                className="gap-2"
              >
                <Sparkles className="size-3.5" />
                Start Dhikr
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onToggleFavorite(dhikr)}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "size-4 transition-colors",
                    isFav ? "fill-red-500 text-red-500" : "text-muted-foreground",
                  )}
                />
              </Button>
            </div>
            {dhikr.source === "Personal" && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => onDelete(dhikr.id)}
                aria-label="Delete personal dhikr"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Counter View ─────────────────────────────────────────────────────────────

function DhikrCounterView({
  state,
  onIncrement,
  onDecrement,
  onReset,
  onComplete,
  onBack,
}: {
  state: CounterState;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { dhikr, count } = state;
  const target = dhikr.recommendedCount;
  const progress = Math.min(100, (count / target) * 100);
  const isComplete = count >= target;
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Library
      </button>

      {/* Arabic text */}
      <Card className={cn("transition-all", isComplete && "border-emerald/30 bg-emerald/5")}>
        <CardContent className="pt-8 pb-8">
          <div className="space-y-4 text-center">
            <p
              className="text-4xl leading-[2] text-foreground sm:text-5xl"
              dir="rtl"
              lang="ar"
              style={{ fontFamily: "serif" }}
            >
              {dhikr.arabic}
            </p>
            {dhikr.transliteration && (
              <p className="text-sm font-medium">{dhikr.transliteration}</p>
            )}
            <p className="text-sm text-muted-foreground">{dhikr.translationEn}</p>
          </div>
        </CardContent>
      </Card>

      {/* Counter */}
      <div className="flex flex-col items-center gap-6">
        {/* Big number */}
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "font-mono text-7xl font-bold tabular-nums sm:text-8xl transition-colors",
              isComplete ? "text-emerald" : "text-foreground",
            )}
            role="status"
            aria-live="polite"
            aria-label={`${count} of ${target}`}
          >
            {count}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">/ {target}</span>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-muted/60">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isComplete ? "bg-emerald" : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={count}
            aria-valuemin={0}
            aria-valuemax={target}
          />
        </div>

        {isComplete && (
          <Card className="w-full max-w-xs border-emerald/30 bg-emerald/5 text-center">
            <CardContent className="py-4">
              <Check className="mx-auto mb-1 size-6 text-emerald" />
              <p className="text-sm font-medium">Dhikr complete.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                May Allah accept your remembrance.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Touch-friendly controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="size-14 rounded-full"
            onClick={onDecrement}
            disabled={count === 0}
            aria-label="Undo last count"
          >
            <Minus className="size-5" />
          </Button>

          {/* Large tap target */}
          <button
            onClick={isComplete ? onComplete : onIncrement}
            disabled={isComplete}
            className={cn(
              "flex size-24 items-center justify-center rounded-full text-white font-semibold text-lg transition-all active:scale-95 sm:size-28",
              isComplete
                ? "bg-emerald cursor-default"
                : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25",
            )}
            aria-label={isComplete ? "Dhikr completed" : "Tap to count"}
          >
            {isComplete ? <Check className="size-10" /> : <Plus className="size-10" />}
          </button>

          <div className="relative">
            {showResetConfirm ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onReset();
                    setShowResetConfirm(false);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShowResetConfirm(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="size-14 rounded-full"
                onClick={() => {
                  if (count > 0) setShowResetConfirm(true);
                }}
                disabled={count === 0}
                aria-label="Reset counter"
              >
                <RotateCcw className="size-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Source info */}
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/60">
            {dhikr.source} — {dhikr.reference}
          </p>
          {dhikr.notes && (
            <p className="mt-1 text-[10px] text-muted-foreground/50">{dhikr.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Adhkar Sequence View ─────────────────────────────────────────────────────

function AdhkarSequenceView({
  title,
  items,
  onBack,
}: {
  title: string;
  items: CanonicalDhikr[];
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((d) => [d.id, 0])),
  );

  const current = items[currentIndex];
  const currentCount = current ? (counts[current.id] ?? 0) : 0;
  const currentTarget = current?.recommendedCount ?? 1;
  const isCurrentComplete = currentCount >= currentTarget;
  const completedCount = items.filter(
    (d) => (counts[d.id] ?? 0) >= d.recommendedCount,
  ).length;
  const allComplete = completedCount === items.length;

  const handleIncrement = () => {
    if (!current || isCurrentComplete) return;
    setCounts((prev) => ({
      ...prev,
      [current.id]: Math.min(currentTarget, (prev[current.id] ?? 0) + 1),
    }));
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  if (!current) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Library
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{items.length} completed
          </p>
        </div>
        <Badge variant="outline">
          {currentIndex + 1} / {items.length}
        </Badge>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {items.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "size-2.5 rounded-full transition-all",
              i === currentIndex
                ? "scale-125 bg-primary"
                : (counts[d.id] ?? 0) >= d.recommendedCount
                  ? "bg-emerald"
                  : "bg-muted-foreground/30",
            )}
            aria-label={`Go to item ${i + 1}`}
          />
        ))}
      </div>

      {allComplete ? (
        <Card className="border-emerald/30 bg-emerald/5 text-center">
          <CardContent className="py-8">
            <Star className="mx-auto mb-3 size-10 text-gold" />
            <p className="text-lg font-semibold">{title} completed.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              May Allah accept your remembrance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current dhikr */}
          <Card className={cn(isCurrentComplete && "border-emerald/30 bg-emerald/5")}>
            <CardContent className="py-8">
              <div className="space-y-4 text-center">
                <p
                  className="text-3xl leading-[2] sm:text-4xl"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "serif" }}
                >
                  {current.arabic}
                </p>
                {current.transliteration && (
                  <p className="text-sm font-medium text-primary/80">
                    {current.transliteration}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{current.translationEn}</p>
                <p className="text-[10px] text-muted-foreground/60">
                  {current.source} — {current.reference}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Counter */}
          <div className="flex flex-col items-center gap-4">
            <span
              className={cn(
                "font-mono text-5xl font-bold tabular-nums",
                isCurrentComplete ? "text-emerald" : "text-foreground",
              )}
            >
              {currentCount}
              <span className="text-lg text-muted-foreground"> / {currentTarget}</span>
            </span>

            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isCurrentComplete ? "bg-emerald" : "bg-primary",
                )}
                style={{
                  width: `${Math.min(100, (currentCount / currentTarget) * 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>

              <button
                onClick={isCurrentComplete ? handleNext : handleIncrement}
                className={cn(
                  "flex size-20 items-center justify-center rounded-full text-white font-semibold transition-all active:scale-95",
                  isCurrentComplete
                    ? "bg-emerald"
                    : "bg-primary shadow-lg shadow-primary/25",
                )}
              >
                {isCurrentComplete ? (
                  currentIndex < items.length - 1 ? "Next" : <Check className="size-8" />
                ) : (
                  <Plus className="size-8" />
                )}
              </button>

              <Button
                variant="outline"
                onClick={() => {
                  if (currentIndex < items.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  }
                }}
                disabled={currentIndex >= items.length - 1}
              >
                Continue
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DhikrPageClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("library");
  const [activeCategory, setActiveCategory] = useState<DhikrCategory | "favorites" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counterState, setCounterState] = useState<CounterState | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    const favs = getDhikrFavorites(MOCK_USER_ID);
    return new Set(favs.map((f) => f.dhikrId));
  });
  const [customDhikrs, setCustomDhikrs] = useState<CustomDhikr[]>(() => {
    if (typeof window === "undefined") return [];
    return getCustomDhikr(MOCK_USER_ID);
  });

  const handleCustomCreated = useCallback((newDhikr: CustomDhikr) => {
    setCustomDhikrs((prev) => [...prev, newDhikr]);
    setActiveCategory("personal");
  }, []);

  const handleDeleteCustom = useCallback((id: string) => {
    if (deleteCustomDhikr(MOCK_USER_ID, id)) {
      setCustomDhikrs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Personal dhikr removed");
    }
  }, []);

  // Get filtered dhikr items
  const filteredItems = useMemo(() => {
    const canonicalCustom = customDhikrs.map(customToCanonical);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const canonicalMatches = searchDhikr(searchQuery.trim());
      const customMatches = canonicalCustom.filter(
        (c) =>
          c.arabic.toLowerCase().includes(q) ||
          c.translationEn.toLowerCase().includes(q) ||
          (c.transliteration && c.transliteration.toLowerCase().includes(q)),
      );
      return [...customMatches, ...canonicalMatches];
    }
    if (activeCategory === "all") {
      return [...canonicalCustom, ...getAllDhikr()];
    }
    if (activeCategory === "personal") {
      return canonicalCustom;
    }
    if (activeCategory === "favorites") {
      const all = [...canonicalCustom, ...getAllDhikr()];
      return all.filter((d) => favoriteIds.has(d.id));
    }
    const catCustom = canonicalCustom.filter((c) => c.category === activeCategory);
    return [...catCustom, ...getDhikrByCategory(activeCategory)];
  }, [activeCategory, searchQuery, favoriteIds, customDhikrs]);

  const handleStartCounter = useCallback((dhikr: CanonicalDhikr) => {
    const session = createDhikrSession(MOCK_USER_ID, dhikr.id, dhikr.recommendedCount);
    setCounterState({ dhikr, count: 0, sessionId: session.id });
    setViewMode("counter");
  }, []);

  const handleIncrement = useCallback(() => {
    setCounterState((prev) => {
      if (!prev) return prev;
      const newCount = Math.min(prev.dhikr.recommendedCount, prev.count + 1);
      if (newCount === prev.dhikr.recommendedCount) {
        toast.success("Dhikr complete.");
        if (prev.sessionId) {
          completeDhikrSession(prev.sessionId, newCount);
        }
      }
      return { ...prev, count: newCount };
    });
  }, []);

  const handleDecrement = useCallback(() => {
    setCounterState((prev) => {
      if (!prev) return prev;
      return { ...prev, count: Math.max(0, prev.count - 1) };
    });
  }, []);

  const handleReset = useCallback(() => {
    setCounterState((prev) => {
      if (!prev) return prev;
      return { ...prev, count: 0 };
    });
    toast.message("Counter reset");
  }, []);

  const handleComplete = useCallback(() => {
    if (counterState?.sessionId) {
      completeDhikrSession(counterState.sessionId, counterState.count);
    }
    setViewMode("library");
    setCounterState(null);
  }, [counterState]);

  const handleBackToLibrary = useCallback(() => {
    if (counterState?.sessionId && counterState.count > 0) {
      updateDhikrSession(counterState.sessionId, {
        completedCount: counterState.count,
        status: counterState.count >= counterState.dhikr.recommendedCount ? "COMPLETED" : "INTERRUPTED",
      });
    }
    setViewMode("library");
    setCounterState(null);
  }, [counterState]);

  const handleToggleFavorite = useCallback(
    (dhikr: CanonicalDhikr) => {
      if (isDhikrFavorite(MOCK_USER_ID, dhikr.id)) {
        removeDhikrFavorite(MOCK_USER_ID, dhikr.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(dhikr.id);
          return next;
        });
        toast.message("Removed from favorites");
      } else {
        addDhikrFavorite(MOCK_USER_ID, dhikr.id);
        setFavoriteIds((prev) => new Set(prev).add(dhikr.id));
        toast.success("Added to favorites");
      }
    },
    [],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  // Counter view
  if (viewMode === "counter" && counterState) {
    return (
      <DhikrCounterView
        state={counterState}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onReset={handleReset}
        onComplete={handleComplete}
        onBack={handleBackToLibrary}
      />
    );
  }

  // Morning Adhkar
  if (viewMode === "adhkar_morning") {
    const morningItems = getDhikrByCategory("morning");
    return (
      <AdhkarSequenceView
        title="Morning Adhkar"
        items={morningItems}
        onBack={() => setViewMode("library")}
      />
    );
  }

  // Evening Adhkar
  if (viewMode === "adhkar_evening") {
    const eveningItems = getDhikrByCategory("evening");
    return (
      <AdhkarSequenceView
        title="Evening Adhkar"
        items={eveningItems}
        onBack={() => setViewMode("library")}
      />
    );
  }

  // Library view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dhikr</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Remembrance of Allah. Content from verified Islamic sources.
          </p>
        </div>
        <CustomDhikrDialog userId={MOCK_USER_ID} onCreated={handleCustomCreated} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setViewMode("adhkar_morning")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:bg-accent/50"
        >
          <Sunrise className="size-6 text-amber-500" />
          <span className="text-sm font-medium">Morning Adhkar</span>
          <span className="text-[10px] text-muted-foreground">Begin your day</span>
        </button>
        <button
          onClick={() => setViewMode("adhkar_evening")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:bg-accent/50"
        >
          <Sunset className="size-6 text-orange-500" />
          <span className="text-sm font-medium">Evening Adhkar</span>
          <span className="text-[10px] text-muted-foreground">End of day</span>
        </button>
        <button
          onClick={() => {
            setActiveCategory("after_salah");
            setSearchQuery("");
          }}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:bg-accent/50"
        >
          <Compass className="size-6 text-emerald" />
          <span className="text-sm font-medium">After Salah</span>
          <span className="text-[10px] text-muted-foreground">Post-prayer adhkar</span>
        </button>
        <button
          onClick={() => {
            setActiveCategory("favorites");
            setSearchQuery("");
          }}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:bg-accent/50"
        >
          <Heart className="size-6 text-rose-500" />
          <span className="text-sm font-medium">Favorites</span>
          <span className="text-[10px] text-muted-foreground">{favoriteIds.size} saved</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search dhikr..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          id="dhikr-search"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORY_ORDER.map((cat) => {
          const CatIcon = CATEGORY_META[cat]?.icon;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery("");
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              {CatIcon && <CatIcon className="size-3.5" />}
              <span>{CATEGORY_META[cat]?.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No dhikr found matching your search."
                : activeCategory === "favorites"
                  ? "No favorites yet. Tap the heart icon to save dhikr."
                  : "No dhikr in this category."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 && "s"}
          </p>
          {filteredItems.map((dhikr) => (
            <DhikrLibraryCard
              key={dhikr.id}
              dhikr={dhikr}
              isFav={favoriteIds.has(dhikr.id)}
              onStartCounter={handleStartCounter}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteCustom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
