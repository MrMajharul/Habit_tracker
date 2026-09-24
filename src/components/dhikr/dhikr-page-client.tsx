"use client";

import { Minus, Plus, RotateCcw, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  count: number;
  category: "morning" | "evening" | "after_prayer" | "general";
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const DHIKR_SETS: Record<string, DhikrItem[]> = {
  morning: [
    {
      id: "subhanallah-m",
      arabic: "سُبْحَانَ اللهِ",
      transliteration: "SubhanAllah",
      translation: "Glory be to Allah",
      target: 33,
      count: 0,
      category: "morning",
    },
    {
      id: "alhamdulillah-m",
      arabic: "الْحَمْدُ لِلَّهِ",
      transliteration: "Alhamdulillah",
      translation: "All praise is due to Allah",
      target: 33,
      count: 0,
      category: "morning",
    },
    {
      id: "allahuakbar-m",
      arabic: "اللهُ أَكْبَرُ",
      transliteration: "Allahu Akbar",
      translation: "Allah is the Greatest",
      target: 34,
      count: 0,
      category: "morning",
    },
    {
      id: "astaghfirullah-m",
      arabic: "أَسْتَغْفِرُ اللهَ",
      transliteration: "Astaghfirullah",
      translation: "I seek forgiveness from Allah",
      target: 100,
      count: 0,
      category: "morning",
    },
  ],
  evening: [
    {
      id: "subhanallah-e",
      arabic: "سُبْحَانَ اللهِ",
      transliteration: "SubhanAllah",
      translation: "Glory be to Allah",
      target: 33,
      count: 0,
      category: "evening",
    },
    {
      id: "alhamdulillah-e",
      arabic: "الْحَمْدُ لِلَّهِ",
      transliteration: "Alhamdulillah",
      translation: "All praise is due to Allah",
      target: 33,
      count: 0,
      category: "evening",
    },
    {
      id: "allahuakbar-e",
      arabic: "اللهُ أَكْبَرُ",
      transliteration: "Allahu Akbar",
      translation: "Allah is the Greatest",
      target: 34,
      count: 0,
      category: "evening",
    },
  ],
  after_prayer: [
    {
      id: "subhanallah-p",
      arabic: "سُبْحَانَ اللهِ",
      transliteration: "SubhanAllah",
      translation: "Glory be to Allah",
      target: 33,
      count: 0,
      category: "after_prayer",
    },
    {
      id: "alhamdulillah-p",
      arabic: "الْحَمْدُ لِلَّهِ",
      transliteration: "Alhamdulillah",
      translation: "All praise is due to Allah",
      target: 33,
      count: 0,
      category: "after_prayer",
    },
    {
      id: "allahuakbar-p",
      arabic: "اللهُ أَكْبَرُ",
      transliteration: "Allahu Akbar",
      translation: "Allah is the Greatest",
      target: 33,
      count: 0,
      category: "after_prayer",
    },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  morning: "🌅 Morning Adhkar",
  evening: "🌇 Evening Adhkar",
  after_prayer: "🤲 After Prayer",
};

// ─── Dhikr Counter Card ───────────────────────────────────────────────────────

function DhikrCard({
  item,
  onIncrement,
  onDecrement,
  onReset,
}: {
  item: DhikrItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const progress = Math.min(100, (item.count / item.target) * 100);
  const isComplete = item.count >= item.target;

  return (
    <Card className={cn("transition-all", isComplete && "border-emerald/30 bg-emerald/5")}>
      <CardContent className="pt-5 pb-5">
        <div className="space-y-3 text-center">
          {/* Arabic text */}
          <p
            className="text-3xl leading-loose text-foreground sm:text-4xl"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "serif" }}
          >
            {item.arabic}
          </p>

          {/* Transliteration */}
          <div>
            <p className="text-sm font-medium">{item.transliteration}</p>
            <p className="text-xs text-muted-foreground">{item.translation}</p>
          </div>

          {/* Counter */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDecrement(item.id)}
              disabled={item.count === 0}
              aria-label="Decrease count"
            >
              <Minus className="size-4" />
            </Button>

            <div className="flex min-w-[4rem] flex-col items-center">
              <span
                className={cn(
                  "font-mono text-4xl font-semibold tabular-nums",
                  isComplete && "text-emerald",
                )}
              >
                {item.count}
              </span>
              <span className="text-xs text-muted-foreground">/ {item.target}</span>
            </div>

            <Button
              size="icon"
              onClick={() => onIncrement(item.id)}
              disabled={isComplete}
              aria-label="Increase count"
              className={cn(isComplete && "bg-emerald hover:bg-emerald/80")}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Progress ring */}
          <div className="mx-auto h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isComplete ? "bg-emerald" : "bg-primary",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {isComplete && (
            <Badge className="mx-auto bg-emerald/10 text-emerald">
              ✓ Complete
            </Badge>
          )}

          <button
            onClick={() => onReset(item.id)}
            aria-label="Reset counter"
            className="mx-auto flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
          >
            <RotateCcw className="size-2.5" />
            Reset
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DhikrPageClient() {
  const [activeSet, setActiveSet] = useState<keyof typeof DHIKR_SETS>("morning");
  const [dhikrSets, setDhikrSets] = useState(DHIKR_SETS);

  const currentItems = dhikrSets[activeSet] ?? [];
  const completedCount = currentItems.filter((d) => d.count >= d.target).length;
  const allComplete = completedCount === currentItems.length;

  const updateItem = (id: string, updater: (item: DhikrItem) => DhikrItem) => {
    setDhikrSets((prev) => ({
      ...prev,
      [activeSet]: prev[activeSet]!.map((d) => (d.id === id ? updater(d) : d)),
    }));
  };

  const handleIncrement = (id: string) => {
    updateItem(id, (d) => {
      const next = d.count + 1;
      if (next === d.target) {
        toast.success(`${d.transliteration} completed! 🤲`);
      }
      return { ...d, count: Math.min(d.target, next) };
    });
  };

  const handleDecrement = (id: string) => {
    updateItem(id, (d) => ({ ...d, count: Math.max(0, d.count - 1) }));
  };

  const handleReset = (id: string) => {
    updateItem(id, (d) => ({ ...d, count: 0 }));
  };

  const handleResetAll = () => {
    setDhikrSets((prev) => ({
      ...prev,
      [activeSet]: prev[activeSet]!.map((d) => ({ ...d, count: 0 })),
    }));
    toast.message("All counters reset");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dhikr</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount}/{currentItems.length} completed
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetAll} className="gap-2 self-start sm:self-auto">
          <RotateCcw className="size-3.5" />
          Reset all
        </Button>
      </div>

      {allComplete && (
        <Card className="border-emerald/30 bg-emerald/5 text-center">
          <CardContent className="pt-5 pb-5">
            <Star className="mx-auto mb-2 size-8 text-gold" />
            <p className="font-semibold">All adhkar complete!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              MashAllah! May Allah accept your remembrance. 🤲
            </p>
          </CardContent>
        </Card>
      )}

      {/* Set selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(DHIKR_SETS) as Array<keyof typeof DHIKR_SETS>).map((setKey) => {
          const items = dhikrSets[setKey]!;
          const done = items.filter((d) => d.count >= d.target).length;
          return (
            <button
              key={setKey}
              onClick={() => setActiveSet(setKey)}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-colors",
                activeSet === setKey
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              <p className="text-sm font-medium">{CATEGORY_LABELS[setKey]?.split(" ").slice(1).join(" ")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{done}/{items.length}</p>
            </button>
          );
        })}
      </div>

      {/* Category header */}
      <div>
        <h2 className="text-lg font-semibold">{CATEGORY_LABELS[activeSet]}</h2>
        <p className="text-sm text-muted-foreground">
          Tap + to count. Content from verified Islamic sources.
        </p>
      </div>

      {/* Dhikr cards */}
      <div className="space-y-4">
        {currentItems.map((item) => (
          <DhikrCard
            key={item.id}
            item={item}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onReset={handleReset}
          />
        ))}
      </div>
    </div>
  );
}
