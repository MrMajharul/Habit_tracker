"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { CheckCircle2, Circle, Plus, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalCategory = "daily" | "weekly" | "long_term";

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  isCompleted: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_GOALS: Goal[] = [
  { id: "1", title: "Read Qur'an daily", category: "daily", targetValue: 1, currentValue: 1, unit: "session", isCompleted: true },
  { id: "2", title: "Study 2 hours", category: "daily", targetValue: 120, currentValue: 45, unit: "minutes", isCompleted: false },
  { id: "3", title: "Exercise", category: "daily", targetValue: 1, currentValue: 0, unit: "session", isCompleted: false },
  { id: "4", title: "Study 15 hours this week", category: "weekly", targetValue: 900, currentValue: 315, unit: "minutes", isCompleted: false },
  { id: "5", title: "Read 50 pages this week", category: "weekly", targetValue: 50, currentValue: 22, unit: "pages", isCompleted: false },
  { id: "6", title: "Complete Qur'an (1 khatm)", category: "long_term", targetValue: 30, currentValue: 12, unit: "juz", deadline: "Ramadan 2027", isCompleted: false },
  { id: "7", title: "Learn Python fundamentals", category: "long_term", targetValue: 100, currentValue: 60, unit: "%", deadline: "Dec 2026", isCompleted: false },
  { id: "8", title: "Prepare for IELTS", category: "long_term", targetValue: 100, currentValue: 30, unit: "%", deadline: "Mar 2027", isCompleted: false },
];

const GOALS_STORAGE_KEY = "istiqamaah_user_goals";
const LEGACY_GOALS_STORAGE_KEY = "noorpath_user_goals";

function getLocalGoals(): Goal[] {
  if (typeof window === "undefined") return SEED_GOALS;
  try {
    const raw =
      localStorage.getItem(GOALS_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_GOALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_GOALS;
  } catch {
    return SEED_GOALS;
  }
}

function saveLocalGoals(goals: Goal[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // Ignore storage quota
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; badge: string }> = {
  daily: { label: "Daily", badge: "bg-emerald/10 text-emerald border-emerald/20" },
  weekly: { label: "Weekly", badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30" },
  long_term: { label: "Long-term", badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30" },
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  description: z.string().optional(),
  category: z.enum(["daily", "weekly", "long_term"]),
  targetValue: z.coerce.number().min(1),
  unit: z.string().min(1, "Unit is required").max(20),
  deadline: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

// ─── Add Goal Dialog ──────────────────────────────────────────────────────────

function AddGoalDialog({ onAdd }: { onAdd: (g: Goal) => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { category: "daily", targetValue: 1, unit: "session" },
  });

  const onSubmit = (values: GoalFormValues) => {
    onAdd({
      id: crypto.randomUUID(),
      title: values.title,
      description: values.description,
      category: values.category,
      targetValue: values.targetValue,
      currentValue: 0,
      unit: values.unit,
      deadline: values.deadline,
      isCompleted: false,
    });
    toast.success(`Goal "${values.title}" created!`);
    reset();
    setOpen(false);
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Goal</DialogTitle>
            <DialogDescription>Set a meaningful goal to work towards.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-title">Title</Label>
              <input id="goal-title" {...register("title")} className={inputClass} placeholder="Complete Qur'an" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-category">Type</Label>
                <select id="goal-category" {...register("category")} className={inputClass}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="long_term">Long-term</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-target">Target</Label>
                <input id="goal-target" type="number" min={1} {...register("targetValue")} className={inputClass} placeholder="30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-unit">Unit</Label>
                <input id="goal-unit" {...register("unit")} className={inputClass} placeholder="juz" />
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-deadline">Deadline (optional)</Label>
              <input id="goal-deadline" {...register("deadline")} className={inputClass} placeholder="Ramadan 2027" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-desc">Description (optional)</Label>
              <textarea id="goal-desc" {...register("description")} rows={2} className={inputClass + " resize-none"} placeholder="Why this goal matters…" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create goal</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onIncrement, onDelete }: {
  goal: Goal;
  onIncrement: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const cfg = CATEGORY_CONFIG[goal.category];

  return (
    <Card className={cn("transition-all", goal.isCompleted && "border-emerald/30 bg-emerald/5")}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {goal.isCompleted ? (
              <CheckCircle2 className="size-5 text-emerald" />
            ) : (
              <Circle className="size-5 text-muted-foreground/50" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className={cn(
                "font-medium",
                goal.isCompleted && "text-muted-foreground line-through",
              )}>
                {goal.title}
              </p>
              <Badge variant="outline" className={cn("shrink-0 border text-[10px]", cfg.badge)}>
                {cfg.label}
              </Badge>
            </div>
            {goal.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{goal.description}</p>
            )}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className={cn("h-2", goal.isCompleted && "[&>div]:bg-emerald")}
              />
            </div>
            {goal.deadline && (
              <p className="mt-2 text-[10px] font-medium text-gold">
                Target: {goal.deadline}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {!goal.isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onIncrement(goal.id)}
                className="h-7 px-2 text-xs"
              >
                +1
              </Button>
            )}
            <button
              aria-label={`Delete goal "${goal.title}"`}
              onClick={() => onDelete(goal.id)}
              className="rounded p-1 text-muted-foreground/60 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoalsPageClient() {
  const [goals, setGoals] = useState<Goal[]>(SEED_GOALS);
  const [activeCategory, setActiveCategory] = useState<GoalCategory | "all">("all");

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        setGoals(getLocalGoals());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAdd = (g: Goal) => {
    setGoals((prev) => {
      const next = [g, ...prev];
      saveLocalGoals(next);
      return next;
    });
  };

  const handleIncrement = (id: string) => {
    setGoals((prev) => {
      const next = prev.map((g) => {
        if (g.id !== id) return g;
        const nextVal = Math.min(g.targetValue, g.currentValue + 1);
        const done = nextVal >= g.targetValue;
        if (done) toast.success(`Goal "${g.title}" achieved!`);
        return { ...g, currentValue: nextVal, isCompleted: done };
      });
      saveLocalGoals(next);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveLocalGoals(next);
      return next;
    });
    toast.success("Goal removed");
  };

  const filtered = activeCategory === "all"
    ? goals
    : goals.filter((g) => g.category === activeCategory);

  const completed = goals.filter((g) => g.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed}/{goals.length} goals achieved
          </p>
        </div>
        <AddGoalDialog onAdd={handleAdd} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["daily", "weekly", "long_term"] as GoalCategory[]).map((cat) => {
          const catGoals = goals.filter((g) => g.category === cat);
          const catDone = catGoals.filter((g) => g.isCompleted).length;
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <Card key={cat}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xl font-semibold">{catDone}/{catGoals.length}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
        {(["all", "daily", "weekly", "long_term"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-colors",
              activeCategory === cat
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {cat === "long_term" ? "Long-term" : cat === "all" ? "All" : CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Target className="mx-auto mb-3 size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No goals yet. Add one above.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onIncrement={handleIncrement}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
