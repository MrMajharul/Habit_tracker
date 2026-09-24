"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import {
  BookMarked,
  BookOpen,
  Check,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Moon,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DashboardHabit, HabitCategory } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Habit extends DashboardHabit {
  streak: number;
  frequency: "daily" | "weekly";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "heart-handshake": HeartHandshake,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-marked": BookMarked,
  moon: Moon,
};

const ICON_OPTIONS = [
  { value: "book-open", label: "Book", icon: BookOpen },
  { value: "heart-handshake", label: "Prayer", icon: HeartHandshake },
  { value: "dumbbell", label: "Exercise", icon: Dumbbell },
  { value: "graduation-cap", label: "Study", icon: GraduationCap },
  { value: "book-marked", label: "Reading", icon: BookMarked },
  { value: "moon", label: "Night", icon: Moon },
];

const CATEGORY_OPTIONS: { value: HabitCategory; label: string }[] = [
  { value: "islamic", label: "Islamic" },
  { value: "health", label: "Health" },
  { value: "study", label: "Study" },
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  islamic: "bg-emerald/10 text-emerald border-emerald/20",
  health: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40",
  study: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40",
  work: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40",
  personal: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/40",
  family: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800/40",
  other: "bg-muted text-muted-foreground border-border",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const habitSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  icon: z.string(),
  category: z.enum(["islamic", "health", "study", "work", "personal", "family", "other"]),
  target: z.string().optional(),
  frequency: z.enum(["daily", "weekly"]),
});

type HabitFormValues = z.infer<typeof habitSchema>;

// ─── Add Habit Dialog ─────────────────────────────────────────────────────────

function AddHabitDialog({ onAdd }: { onAdd: (habit: Habit) => void }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      icon: "book-open",
      category: "personal",
      frequency: "daily",
    },
  });

  const selectedIcon = watch("icon");

  const onSubmit = (values: HabitFormValues) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: values.name,
      icon: values.icon,
      category: values.category,
      completed: false,
      target: values.target || undefined,
      streak: 0,
      frequency: values.frequency,
    };
    onAdd(newHabit);
    toast.success(`"${values.name}" habit created!`);
    reset();
    setOpen(false);
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Habit</DialogTitle>
            <DialogDescription>
              Build consistency with a new daily or weekly habit.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="habit-name">Name</Label>
              <input
                id="habit-name"
                {...register("name")}
                className={inputClass}
                placeholder="Read Qur'an"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("icon", value)}
                    aria-label={label}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border transition-colors",
                      selectedIcon === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="habit-category">Category</Label>
                <select id="habit-category" {...register("category")} className={inputClass}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="habit-frequency">Frequency</Label>
                <select id="habit-frequency" {...register("frequency")} className={inputClass}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="habit-target">Target (optional)</Label>
              <input
                id="habit-target"
                {...register("target")}
                className={inputClass}
                placeholder="20 pages, 30 minutes…"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create habit</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = ICON_MAP[habit.icon] ?? BookOpen;

  return (
    <Card
      className={cn(
        "transition-all",
        habit.completed && "border-emerald/30 bg-emerald/5",
      )}
    >
      <CardContent className="flex items-center gap-3 pt-4 pb-4">
        <Checkbox
          id={`habit-${habit.id}`}
          checked={habit.completed}
          onCheckedChange={() => onToggle(habit.id)}
          aria-label={`Toggle ${habit.name}`}
          className={cn(
            "transition-colors",
            habit.completed && "border-emerald data-[state=checked]:bg-emerald",
          )}
        />

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border",
            habit.completed ? "border-emerald/30 bg-emerald/10 text-emerald" : "border-border bg-muted/40",
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <label
            htmlFor={`habit-${habit.id}`}
            className={cn(
              "block cursor-pointer text-sm font-medium",
              habit.completed && "text-muted-foreground line-through",
            )}
          >
            {habit.name}
          </label>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {habit.target && (
              <span className="text-xs text-muted-foreground">{habit.target}</span>
            )}
            <Badge
              variant="outline"
              className={cn("border text-[10px]", CATEGORY_COLORS[habit.category])}
            >
              {habit.category}
            </Badge>
            {habit.streak > 0 && (
              <span className="text-[10px] font-medium text-gold">
                🔥 {habit.streak} day streak
              </span>
            )}
          </div>
        </div>

        <button
          aria-label={`Delete ${habit.name}`}
          onClick={() => {
            if (window.confirm(`Delete "${habit.name}"?`)) {
              onDelete(habit.id);
            }
          }}
          className="shrink-0 rounded p-1 text-muted-foreground/60 transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HabitsPageClient({ initialHabits }: { initialHabits: Habit[] }) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const completed = habits.filter((h) => h.completed).length;
  const total = habits.length;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  const filtered =
    filter === "all"
      ? habits
      : filter === "completed"
        ? habits.filter((h) => h.completed)
        : habits.filter((h) => !h.completed);

  const handleToggle = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completed: !h.completed } : h,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    toast.success("Habit removed");
  };

  const handleAdd = (habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build consistency, one day at a time.
          </p>
        </div>
        <AddHabitDialog onAdd={handleAdd} />
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Today&apos;s Habits</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completed}/{total}
              {completed === total && total > 0 && (
                <span className="ml-2 text-emerald">✓ All done!</span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2.5" />
          {total === 0 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              No habits yet. Add your first habit above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      {total > 0 && (
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {filter === "completed"
              ? "No completed habits yet today."
              : filter === "pending"
                ? "All habits completed! 🎉"
                : "No habits. Add one above."}
          </p>
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

      {/* Completion State */}
      {completed === total && total > 0 && (
        <Card className="border-emerald/30 bg-emerald/5 text-center">
          <CardContent className="pt-6 pb-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald/20">
              <Check className="size-6 text-emerald" />
            </div>
            <p className="mt-3 font-semibold">All habits complete!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              MashAllah! You&apos;ve completed all your habits today. 🌟
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export type { Habit };
