"use client";

import {
  BookMarked,
  BookOpen,
  Check,
  Code2,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartHandshake,
  Moon,
  Sparkles,
  Sun,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AddHabitDialog } from "@/components/habits/add-habit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  deleteHabit,
  fetchHabitsWithStatus,
  toggleHabit,
} from "@/services/habits/habit-service";
import type { Habit, HabitCategory } from "@/types";

const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "heart-handshake": HeartHandshake,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-marked": BookMarked,
  code: Code2,
  sun: Sun,
  moon: Moon,
  sparkles: Sparkles,
};

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  islamic: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  health: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40",
  study: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40",
  work: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40",
  personal: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/40",
  family: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800/40",
  other: "bg-muted text-muted-foreground border-border",
};

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const Icon = ICON_MAP[habit.icon] ?? BookOpen;
  const isCompleted = Boolean(habit.completedToday);

  return (
    <Card
      className={cn(
        "transition-all",
        isCompleted && "border-emerald-500/30 bg-emerald-500/[0.04]",
      )}
    >
      <CardContent className="flex items-center gap-3.5 py-3.5">
        <Checkbox
          id={`habit-${habit.id}`}
          checked={isCompleted}
          onCheckedChange={() => onToggle(habit.id, habit.name)}
          aria-label={`Toggle ${habit.name}`}
          className={cn(
            "transition-colors cursor-pointer",
            isCompleted && "border-emerald-600 data-[state=checked]:bg-emerald-600",
          )}
        />

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border",
            isCompleted
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-border bg-muted/40",
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <label
            htmlFor={`habit-${habit.id}`}
            className={cn(
              "block cursor-pointer text-sm font-semibold text-foreground",
              isCompleted && "text-muted-foreground line-through",
            )}
          >
            {habit.name}
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {habit.targetValue && (
              <span className="text-xs text-muted-foreground">
                {habit.targetValue} {habit.targetUnit || ""}
              </span>
            )}
            <Badge
              variant="outline"
              className={cn("border text-[10px] capitalize", CATEGORY_COLORS[habit.category])}
            >
              {habit.category}
            </Badge>
            {habit.prayerAnchor && habit.prayerAnchor !== "none" && (
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300 capitalize"
              >
                After {habit.prayerAnchor}
              </Badge>
            )}
            {typeof habit.streak === "number" && habit.streak > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Flame className="size-3 text-amber-500" />
                <span>{habit.streak}d streak</span>
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${habit.name}`}
          className="text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => onDelete(habit.id, habit.name)}
        >
          <Trash2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function HabitsPageClient({
  initialHabits,
}: {
  initialHabits: Habit[];
}) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    fetchHabitsWithStatus().then((fetched) => {
      if (mounted && fetched.length > 0) {
        setHabits(fetched);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const filtered = habits.filter((h) => {
    if (filter === "completed" && !h.completedToday) return false;
    if (filter === "pending" && h.completedToday) return false;
    if (selectedCategory !== "all" && h.category !== selectedCategory) return false;
    return true;
  });

  const handleToggle = async (id: string, name: string) => {
    const current = habits.find((h) => h.id === id);
    if (!current) return;
    const nextCompleted = !current.completedToday;

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              completedToday: nextCompleted,
              streak: nextCompleted
                ? (h.streak || 0) + 1
                : Math.max(0, (h.streak || 1) - 1),
            }
          : h,
      ),
    );

    if (nextCompleted) {
      toast.success(`Completed "${name}"!`, {
        description: "Consistency saved in your personal worship & habit log.",
      });
    } else {
      toast.message(`"${name}" unmarked`);
    }

    try {
      const stats = await toggleHabit(id, nextCompleted);
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, streak: stats.currentStreak } : h,
        ),
      );
    } catch (err) {
      console.error("Toggle error:", err);
      // Rollback
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, completedToday: current.completedToday, streak: current.streak }
            : h,
        ),
      );
      toast.error("Could not sync habit update. Rolled back.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Archive habit "${name}"?`)) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      await deleteHabit(id);
      toast.info(`Habit "${name}" archived`);
    }
  };

  const handleHabitCreated = (newHabit: Habit) => {
    setHabits((prev) => [...prev, newHabit]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build steady consistency around Salah, one day at a time.
          </p>
        </div>
        <AddHabitDialog onHabitCreated={handleHabitCreated} />
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Today&apos;s Habits</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{totalCount} completed
              {completedCount === totalCount && totalCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="size-3" />
                  All done!
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2.5" />
          {totalCount === 0 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              No habits yet. Click &quot;Add Habit&quot; above to start.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs & Category Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                filter === f
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {[
            { value: "all", label: "All" },
            { value: "islamic", label: "Islamic" },
            { value: "health", label: "Health" },
            { value: "study", label: "Study" },
            { value: "personal", label: "Personal" },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                selectedCategory === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                {filter === "completed"
                  ? "No completed habits yet today."
                  : filter === "pending"
                    ? "All habits completed for today!"
                    : "No habits match this category."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Maintain consistency without pressure or competitive scoring.
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Completion State Card */}
      {completedCount === totalCount && totalCount > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 text-center">
          <CardContent className="py-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <Check className="size-6" />
            </div>
            <p className="mt-3 font-semibold text-foreground">All habits completed today!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Alhamdulillah for the discipline and barakah in your time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
