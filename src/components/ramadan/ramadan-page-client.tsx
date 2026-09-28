"use client";

import {
  BookOpen,
  Check,
  Clock,
  Heart,
  Moon,
  Settings,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type {
  RamadanDailyLog,
  RamadanGoal,
  RamadanSettings,
} from "@/services/dhikr/dhikr-types";
import {
  getDefaultRamadanSettings,
  getRamadanDailyLog,
  getRamadanGoals,
  getRamadanInfo,
  getRamadanSettings,
  saveRamadanDailyLog,
  saveRamadanGoal,
  saveRamadanSettings,
  deleteRamadanGoal,
} from "@/services/dhikr/dhikr-service";

const MOCK_USER_ID = "local-user";

// ─── Checklist Item ───────────────────────────────────────────────────────────

function ChecklistItem({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all w-full",
        checked
          ? "border-emerald/30 bg-emerald/5"
          : "border-border hover:border-primary/30",
      )}
    >
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          checked
            ? "border-emerald bg-emerald text-white"
            : "border-muted-foreground/30",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </div>
      {icon && <span className="text-sm">{icon}</span>}
      <span
        className={cn(
          "text-sm font-medium",
          checked && "text-muted-foreground line-through",
        )}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Fasting Times Card ───────────────────────────────────────────────────────

function FastingTimesCard() {
  // Use mock times based on Dhaka. The real implementation
  // should integrate with the existing prayer engine.
  return (
    <Card className="border-gold/20 bg-gradient-to-br from-card to-gold/5">
      <CardContent className="pt-5 pb-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sunrise className="size-5 text-gold" />
              <span className="text-xs text-muted-foreground">Suhoor ends</span>
            </div>
            <p className="mt-1 font-mono text-2xl font-bold">04:38</p>
            <p className="text-[10px] text-muted-foreground">Before Fajr</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sunset className="size-5 text-gold" />
              <span className="text-xs text-muted-foreground">Iftar</span>
            </div>
            <p className="mt-1 font-mono text-2xl font-bold">18:21</p>
            <p className="text-[10px] text-muted-foreground">At Maghrib</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Ramadan Settings Dialog ──────────────────────────────────────────────────

function RamadanSettingsPanel({
  settings,
  onSave,
  onClose,
}: {
  settings: RamadanSettings;
  onSave: (s: RamadanSettings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(settings);

  const toggle = (key: keyof RamadanSettings) => {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="size-4" />
          Ramadan Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggles */}
        {[
          { key: "isEnabled" as const, label: "Enable Ramadan Mode" },
          { key: "suhoorReminder" as const, label: "Suhoor Reminder" },
          { key: "iftarReminder" as const, label: "Iftar Reminder" },
          { key: "dhikrReminder" as const, label: "Dhikr Reminder" },
          { key: "reflectionReminder" as const, label: "Daily Reflection" },
          { key: "taraweehTracking" as const, label: "Track Taraweeh" },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="text-sm">{label}</span>
            <button
              onClick={() => toggle(key)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                local[key] ? "bg-primary" : "bg-muted",
              )}
              role="switch"
              aria-checked={!!local[key]}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                  local[key] && "translate-x-5",
                )}
              />
            </button>
          </label>
        ))}

        {/* Quran target */}
        <div>
          <label className="text-sm" htmlFor="ramadan-quran-target">Daily Qur&apos;an Target (minutes)</label>
          <Input
            id="ramadan-quran-target"
            type="number"
            min={5}
            max={120}
            value={local.dailyQuranTarget}
            onChange={(e) =>
              setLocal((prev) => ({
                ...prev,
                dailyQuranTarget: parseInt(e.target.value) || 20,
              }))
            }
            className="mt-1 w-24"
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onSave(local);
              toast.success("Ramadan settings saved");
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Ramadan Goal Card ────────────────────────────────────────────────────────

function RamadanGoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: RamadanGoal;
  onUpdate: (g: RamadanGoal) => void;
  onDelete: (id: string) => void;
}) {
  const progress = goal.targetValue > 0
    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
    : 0;

  return (
    <Card className={cn(goal.isCompleted && "border-emerald/30 bg-emerald/5")}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">{goal.title}</p>
            {goal.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{goal.description}</p>
            )}
          </div>
          {goal.isCompleted && (
            <Badge className="bg-emerald/10 text-emerald text-[10px]">
              <Check className="mr-1 size-3" /> Complete
            </Badge>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                const newValue = Math.min(goal.targetValue, goal.currentValue + 1);
                const updated = {
                  ...goal,
                  currentValue: newValue,
                  isCompleted: newValue >= goal.targetValue,
                };
                onUpdate(updated);
              }}
              disabled={goal.isCompleted}
            >
              +1
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => onDelete(goal.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RamadanPageClient() {
  const ramadanInfo = getRamadanInfo();
  const [settings, setSettings] = useState<RamadanSettings>(() =>
    getRamadanSettings(MOCK_USER_ID) ?? getDefaultRamadanSettings(MOCK_USER_ID),
  );
  const [showSettings, setShowSettings] = useState(false);
  const [goals, setGoals] = useState<RamadanGoal[]>(() =>
    getRamadanGoals(MOCK_USER_ID),
  );
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Current day (use Ramadan day if in Ramadan, else demo with day 12)
  const currentDay = ramadanInfo.isRamadan ? (ramadanInfo.ramadanDay ?? 1) : 12;

  const [dailyLog, setDailyLog] = useState<RamadanDailyLog>(() => {
    const existing = getRamadanDailyLog(MOCK_USER_ID, currentDay);
    return existing ?? {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: MOCK_USER_ID,
      hijriDate: `${ramadanInfo.hijriDate.year}-09-${currentDay.toString().padStart(2, "0")}`,
      ramadanDay: currentDay,
      fajrCompleted: false,
      quranCompleted: false,
      morningAdhkarCompleted: false,
      dhikrCompleted: false,
      dhuhrCompleted: false,
      asrCompleted: false,
      iftarCompleted: false,
      maghribCompleted: false,
      eveningAdhkarCompleted: false,
      ishaCompleted: false,
      taraweehCompleted: false,
      reflectionCompleted: false,
      customItems: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const handleToggleChecklist = useCallback(
    (key: keyof RamadanDailyLog, checked: boolean) => {
      setDailyLog((prev) => {
        const updated = { ...prev, [key]: checked, updatedAt: new Date().toISOString() };
        saveRamadanDailyLog(updated);
        return updated;
      });
    },
    [],
  );

  const handleSaveSettings = useCallback((s: RamadanSettings) => {
    setSettings(s);
    saveRamadanSettings(s);
    setShowSettings(false);
  }, []);

  const handleUpdateGoal = useCallback((goal: RamadanGoal) => {
    saveRamadanGoal(goal);
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    if (goal.isCompleted) {
      toast.success(`${goal.title} completed. Alhamdulillah!`);
    }
  }, []);

  const handleDeleteGoal = useCallback((id: string) => {
    deleteRamadanGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const handleAddGoal = useCallback(
    (title: string, targetValue: number, unit: string, goalType: string) => {
      const goal: RamadanGoal = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: MOCK_USER_ID,
        title,
        goalType: goalType as RamadanGoal["goalType"],
        targetValue,
        currentValue: 0,
        unit,
        startDate: new Date().toISOString().slice(0, 10),
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveRamadanGoal(goal);
      setGoals((prev) => [...prev, goal]);
      setShowGoalForm(false);
      toast.success("Ramadan goal created");
    },
    [],
  );

  // Checklist items
  const checklistItems: { key: keyof RamadanDailyLog; label: string; icon: LucideIcon }[] = [
    { key: "fajrCompleted", label: "Fajr", icon: Sunrise },
    { key: "quranCompleted", label: "Qur'an Reading", icon: BookOpen },
    { key: "morningAdhkarCompleted", label: "Morning Adhkar", icon: Sun },
    { key: "dhikrCompleted", label: "Dhikr", icon: Sparkles },
    { key: "dhuhrCompleted", label: "Dhuhr", icon: Clock },
    { key: "asrCompleted", label: "Asr", icon: Clock },
    { key: "iftarCompleted", label: "Iftar", icon: Utensils },
    { key: "maghribCompleted", label: "Maghrib", icon: Sunset },
    { key: "eveningAdhkarCompleted", label: "Evening Adhkar", icon: Moon },
    { key: "ishaCompleted", label: "Isha", icon: Moon },
    ...(settings.taraweehTracking
      ? [{ key: "taraweehCompleted" as keyof RamadanDailyLog, label: "Taraweeh", icon: Star }]
      : []),
    { key: "reflectionCompleted", label: "Reflection", icon: Heart },
  ];

  const completedChecklistCount = checklistItems.filter(
    (item) => dailyLog[item.key] === true,
  ).length;

  const isRamadanActive = settings.isEnabled || ramadanInfo.isRamadan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Moon className="size-6 text-gold" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ramadan Mode
            </h1>
            {isRamadanActive && (
              <Badge className="bg-gold/10 text-gold border-gold/30">Active</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {ramadanInfo.isRamadan
              ? `Ramadan ${ramadanInfo.hijriDate.year} — Day ${currentDay}`
              : "A dedicated companion for the blessed month."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="size-3.5" />
          Settings
        </Button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <RamadanSettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Ramadan Day Banner */}
      <Card className="border-gold/20 bg-gradient-to-br from-card to-gold/5">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <Moon className="size-8 text-gold" />
            <Star className="size-5 text-gold/60" />
          </div>
          <h2 className="mt-3 text-2xl font-bold">
            {isRamadanActive ? `Ramadan Day ${currentDay}` : "Ramadan Mode"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ramadanInfo.hijriDate.day} {ramadanInfo.hijriDate.monthName}{" "}
            {ramadanInfo.hijriDate.year} AH
          </p>
          {!isRamadanActive && (
            <div className="mt-4">
              <Button
                size="sm"
                onClick={() => {
                  const updated = { ...settings, isEnabled: true };
                  handleSaveSettings(updated);
                  toast.success("Ramadan Mode enabled");
                }}
              >
                Enable Ramadan Mode
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fasting Times */}
      <FastingTimesCard />

      {/* Daily Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Daily Checklist
          </h2>
          <Badge variant="outline" className="text-xs">
            {completedChecklistCount}/{checklistItems.length}
          </Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          A personal organization tool for your day. Complete items at your own pace.
        </p>
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <ChecklistItem
              key={item.key}
              label={item.label}
              icon={<item.icon className="size-4 text-primary" />}
              checked={dailyLog[item.key] === true}
              onChange={(checked) => handleToggleChecklist(item.key, checked)}
            />
          ))}
        </div>
      </div>

      {/* Ramadan Goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Target className="size-4 text-primary" />
            Ramadan Goals
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowGoalForm(!showGoalForm)}
          >
            + Add Goal
          </Button>
        </div>

        {showGoalForm && <AddGoalForm onAdd={handleAddGoal} onCancel={() => setShowGoalForm(false)} />}

        {goals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Target className="mx-auto mb-2 size-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Set personal Ramadan goals — Qur&apos;an completion, daily adhkar, or anything you&apos;d like.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <RamadanGoalCard
                key={goal.id}
                goal={goal}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reflection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            Daily Reflection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Optional prompts for personal reflection. Your thoughts remain private.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground italic">
              &ldquo;What am I grateful for today?&rdquo;
            </p>
            <p className="text-sm text-muted-foreground italic">
              &ldquo;What did I learn today?&rdquo;
            </p>
            <p className="text-sm text-muted-foreground italic">
              &ldquo;What would I like to improve tomorrow?&rdquo;
            </p>
          </div>
          <a
            href="/hadith"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <BookOpen className="size-3.5" />
            Open Reflection
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Add Goal Form ────────────────────────────────────────────────────────────

function AddGoalForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, target: number, unit: string, type: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(30);
  const [unit, setUnit] = useState("days");
  const [type, setType] = useState("custom");

  const presets = [
    { label: "Complete Qur'an", type: "quran_khatm", target: 30, unit: "juz" },
    { label: "Read Qur'an Daily", type: "quran_daily", target: 30, unit: "days" },
    { label: "Morning Adhkar Daily", type: "adhkar", target: 30, unit: "days" },
    { label: "Evening Adhkar Daily", type: "adhkar", target: 30, unit: "days" },
  ];

  return (
    <Card className="mb-4">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setTitle(p.label);
                setTarget(p.target);
                setUnit(p.unit);
                setType(p.type);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          id="ramadan-goal-title"
        />
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
            className="w-20"
            id="ramadan-goal-target"
          />
          <Input
            placeholder="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-24"
            id="ramadan-goal-unit"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAdd(title, target, unit, type)} disabled={!title.trim()}>
            Create Goal
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
