"use client";

import {
  BookMarked,
  BookOpen,
  Code2,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartHandshake,
  Moon,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AddHabitDialog } from "@/components/habits/add-habit-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  fetchHabitsWithStatus,
  toDashboardHabit,
  toggleHabit,
} from "@/services/habits/habit-service";
import type { DashboardHabit } from "@/types";

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

interface TodaysHabitsProps {
  habits: DashboardHabit[];
  isMockData?: boolean;
}

export function TodaysHabits({
  habits: initialHabits,
  isMockData,
}: TodaysHabitsProps) {
  const [habits, setHabits] = useState<DashboardHabit[]>(initialHabits);

  useEffect(() => {
    let mounted = true;
    fetchHabitsWithStatus().then((fetched) => {
      if (mounted && fetched.length > 0) {
        setHabits(fetched.map(toDashboardHabit));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = habits.filter((h) => h.completed).length;

  const handleToggle = async (habitId: string, habitName: string) => {
    // 1. Optimistic Update
    const current = habits.find((h) => h.id === habitId);
    if (!current) return;
    const nextCompleted = !current.completed;

    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              completed: nextCompleted,
              streak:
                nextCompleted
                  ? (h.streak || 0) + 1
                  : Math.max(0, (h.streak || 1) - 1),
            }
          : h,
      ),
    );

    if (nextCompleted) {
      toast.success(`Completed "${habitName}"!`, {
        description: "Consistency recorded in your personal log.",
      });
    } else {
      toast.message(`"${habitName}" marked as pending`);
    }

    try {
      const stats = await toggleHabit(habitId, nextCompleted);
      // Sync precise streak returned by deterministic calculator
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, streak: stats.currentStreak } : h,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle habit:", err);
      // Rollback on error
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, completed: current.completed, streak: current.streak }
            : h,
        ),
      );
      toast.error("Could not sync habit update. Rolled back.");
    }
  };

  const handleHabitCreated = () => {
    fetchHabitsWithStatus().then((fetched) => {
      setHabits(fetched.map(toDashboardHabit));
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Today&apos;s Habits</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount}/{habits.length} completed today
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isMockData && (
            <Badge variant="secondary" className="text-[10px]">
              Offline sync
            </Badge>
          )}
          <AddHabitDialog onHabitCreated={handleHabitCreated} />
        </div>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium">No habits yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start with one small daily habit to build lifelong consistency.
            </p>
            <div className="mt-3">
              <AddHabitDialog onHabitCreated={handleHabitCreated} />
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {habits.map((habit) => {
              const Icon = ICON_MAP[habit.icon] ?? BookOpen;

              return (
                <li
                  key={habit.id}
                  onClick={() => handleToggle(habit.id, habit.name)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-2.5 transition-all cursor-pointer",
                    habit.completed
                      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                      : "border-border/70 bg-muted/20 hover:border-emerald-500/30 hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={habit.completed}
                    onCheckedChange={() => handleToggle(habit.id, habit.name)}
                    aria-label={habit.name}
                  />

                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-foreground/80">
                    <Icon className="size-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        habit.completed && "text-muted-foreground line-through",
                      )}
                    >
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {habit.target ? <span>{habit.target}</span> : null}
                      {habit.prayerAnchor && habit.prayerAnchor !== "none" ? (
                        <span className="text-emerald-700 dark:text-emerald-400 capitalize">
                          · After {habit.prayerAnchor}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {typeof habit.streak === "number" && habit.streak > 0 && (
                    <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Flame className="size-3.5 text-amber-500" />
                      <span>{habit.streak}d</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
