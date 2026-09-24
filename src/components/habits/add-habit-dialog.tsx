"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import {
  BookMarked,
  BookOpen,
  Code2,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Moon,
  Plus,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHabit } from "@/services/habits/habit-service";
import type { Habit, HabitCategory, PrayerAnchor } from "@/types";

const habitFormSchema = z.object({
  name: z.string().min(2, "Habit name must be at least 2 characters").max(50),
  description: z.string().max(100).optional(),
  category: z.enum([
    "islamic",
    "health",
    "study",
    "work",
    "personal",
    "family",
    "other",
  ]),
  icon: z.string(),
  frequency: z.enum(["daily", "weekly"]),
  targetValue: z.coerce.number().min(1).default(1),
  targetUnit: z.string().max(20).optional(),
  prayerAnchor: z.enum(["none", "fajr", "dhuhr", "asr", "maghrib", "isha"]),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

export const HABIT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  "book-open": { icon: BookOpen, label: "Qur'an / Book" },
  "heart-handshake": { icon: HeartHandshake, label: "Dhikr / Charity" },
  dumbbell: { icon: Dumbbell, label: "Exercise" },
  "graduation-cap": { icon: GraduationCap, label: "Study" },
  "book-marked": { icon: BookMarked, label: "Reading" },
  code: { icon: Code2, label: "Coding / Tech" },
  sun: { icon: Sun, label: "Morning" },
  moon: { icon: Moon, label: "Night" },
  sparkles: { icon: Sparkles, label: "Spiritual" },
};

interface AddHabitDialogProps {
  onHabitCreated?: (habit: Habit) => void;
  triggerButton?: React.ReactNode;
}

export function AddHabitDialog({
  onHabitCreated,
  triggerButton,
}: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "islamic",
      icon: "book-open",
      frequency: "daily",
      targetValue: 1,
      targetUnit: "times",
      prayerAnchor: "none",
      reminderEnabled: false,
    },
  });

  const selectedIcon = useWatch({ control, name: "icon" });
  const selectedAnchor = useWatch({ control, name: "prayerAnchor" });

  const onSubmit = async (values: HabitFormValues) => {
    try {
      const newHabit = await createHabit({
        name: values.name.trim(),
        description: values.description?.trim(),
        category: values.category as HabitCategory,
        icon: values.icon,
        frequency: values.frequency as "daily" | "weekly",
        targetValue: values.targetValue,
        targetUnit: values.targetUnit?.trim(),
        prayerAnchor: values.prayerAnchor as PrayerAnchor,
        reminderEnabled: values.reminderEnabled,
        reminderTime: values.reminderTime,
        isActive: true,
      });

      toast.success("New habit created 🎉", {
        description: `"${newHabit.name}" has been added to your daily routine.`,
      });

      reset();
      setOpen(false);
      onHabitCreated?.(newHabit);
    } catch (err) {
      console.error("Failed to create habit:", err);
      toast.error("Could not create habit. Please try again.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            Add Habit
          </Button>
        )}
      </DialogTrigger>
      <DialogPopup>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Habit</DialogTitle>
            <DialogDescription>
              Plan your day around Salah and build steady Islamic &amp; productive habits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="h-name" className="text-xs font-semibold">
                Habit Name
              </Label>
              <Input
                id="h-name"
                {...register("name")}
                placeholder="e.g. Read Qur'an, Morning Adhkar, Exercise"
                className="text-xs"
              />
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="h-cat" className="text-xs font-semibold">
                  Category
                </Label>
                <select id="h-cat" {...register("category")} className={inputClass}>
                  <option value="islamic">🕌 Islamic / Worship</option>
                  <option value="health">🏃 Health &amp; Fitness</option>
                  <option value="study">📚 Study &amp; Learning</option>
                  <option value="work">💼 Work &amp; Career</option>
                  <option value="personal">🌱 Personal Growth</option>
                  <option value="family">👨‍👩‍👧 Family &amp; Community</option>
                  <option value="other">✨ Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="h-freq" className="text-xs font-semibold">
                  Frequency
                </Label>
                <select id="h-freq" {...register("frequency")} className={inputClass}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            {/* Prayer Anchor (Section 20) */}
            <div className="space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
              <Label htmlFor="h-anchor" className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Salah Anchor (Optional)
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Tie this habit directly to a prayer to build natural consistency.
              </p>
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[
                  { value: "none", label: "No anchor" },
                  { value: "fajr", label: "After Fajr" },
                  { value: "dhuhr", label: "After Dhuhr" },
                  { value: "asr", label: "After Asr" },
                  { value: "maghrib", label: "After Maghrib" },
                  { value: "isha", label: "After Isha" },
                ].map((anchor) => (
                  <button
                    key={anchor.value}
                    type="button"
                    onClick={() => setValue("prayerAnchor", anchor.value as PrayerAnchor)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                      selectedAnchor === anchor.value
                        ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {anchor.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(HABIT_ICONS).map(([key, item]) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue("icon", key)}
                      className={`flex size-8 items-center justify-center rounded-lg border transition-all ${
                        selectedIcon === key
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                      title={item.label}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="h-target-val" className="text-xs font-semibold">
                  Target Amount
                </Label>
                <Input
                  id="h-target-val"
                  type="number"
                  min={1}
                  {...register("targetValue")}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="h-target-unit" className="text-xs font-semibold">
                  Unit (e.g. pages, min)
                </Label>
                <Input
                  id="h-target-unit"
                  {...register("targetUnit")}
                  placeholder="e.g. pages, minutes"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Habit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
