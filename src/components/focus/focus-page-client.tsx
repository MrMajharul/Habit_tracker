"use client";

import {
  Armchair,
  Check,
  Clock,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { focusService } from "@/services/study/focus-service";
import { planningService, type PrayerFitResult } from "@/services/study/planning-service";
import { subjectService } from "@/services/study/subject-service";
import { taskService } from "@/services/study/task-service";
import type {
  FocusSession,
  Subject,
  Task,
} from "@/services/study/types";
import { notificationService } from "@/services/notifications/notification-service";
import { FocusSessionSelector } from "./focus-session-selector";
import { PrayerAwarePrompt } from "./prayer-aware-prompt";

type TimerMode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK" | "CUSTOM";
type TimerStatus = "IDLE" | "RUNNING" | "PAUSED";

interface ModePreset {
  id: TimerMode;
  label: string;
  defaultMinutes: number;
  icon: typeof Clock;
}

const PRESETS: ModePreset[] = [
  { id: "FOCUS", label: "Focus (25m)", defaultMinutes: 25, icon: Clock },
  { id: "SHORT_BREAK", label: "Short Break (5m)", defaultMinutes: 5, icon: Coffee },
  { id: "LONG_BREAK", label: "Long Break (15m)", defaultMinutes: 15, icon: Armchair },
  { id: "CUSTOM", label: "Custom", defaultMinutes: 30, icon: Sparkles },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusPageClient() {
  const searchParams = useSearchParams();

  // Mode and durations
  const [mode, setMode] = useState<TimerMode>("FOCUS");
  const [customMinutes, setCustomMinutes] = useState(30);

  // Subjects & Tasks
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // Drift-proof timer state
  const [status, setStatus] = useState<TimerStatus>("IDLE");
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Prayer prompt state
  const [prayerPromptOpen, setPrayerPromptOpen] = useState(false);
  const [prayerFit, setPrayerFit] = useState<PrayerFitResult | null>(null);
  const [pendingStartMinutes, setPendingStartMinutes] = useState<number | null>(null);

  // History & stats
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Calculate current planned minutes
  const currentPlannedMinutes =
    mode === "FOCUS"
      ? 25
      : mode === "SHORT_BREAK"
        ? 5
        : mode === "LONG_BREAK"
          ? 15
          : customMinutes;

  const totalSeconds = currentPlannedMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100),
  );

  // Load initial data and handle URL query params
  useEffect(() => {
    async function loadData() {
      const [fetchedSubs, fetchedTasks, fetchedSessions] = await Promise.all([
        subjectService.getSubjects(),
        taskService.getTasks({ status: "TODO" }),
        focusService.getTodaySessions(),
      ]);

      setSubjects(fetchedSubs);
      setTasks(fetchedTasks);
      setSessions(fetchedSessions);

      // Check query params
      const paramTaskId = searchParams.get("taskId");
      const paramSubjectId = searchParams.get("subjectId");
      const paramTask = searchParams.get("task");

      if (paramSubjectId) setSelectedSubjectId(paramSubjectId);
      if (paramTaskId) {
        setSelectedTaskId(paramTaskId);
      } else if (paramTask) {
        const found = fetchedTasks.find(
          (t) => t.title.toLowerCase() === paramTask.toLowerCase(),
        );
        if (found) {
          setSelectedTaskId(found.id);
          if (found.subjectId) setSelectedSubjectId(found.subjectId);
        }
      }
    }
    loadData();
  }, [searchParams]);

  // Request notification permission on first visit
  useEffect(() => {
    notificationService.requestPermission().catch(() => {});
  }, []);

  // Handle session completed
  const handleSessionCompleted = useCallback(async () => {
    setStatus("IDLE");
    setTargetEndTime(null);
    setPausedRemainingMs(null);

    const isWorkSession = mode === "FOCUS" || mode === "CUSTOM";
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

    if (isWorkSession) {
      const actualMinutes = currentPlannedMinutes;
      const newSession = await focusService.recordSession({
        taskId: selectedTaskId || null,
        subjectId: selectedSubjectId || null,
        startedAt: sessionStartTime || new Date(Date.now() - actualMinutes * 60000).toISOString(),
        endedAt: new Date().toISOString(),
        plannedMinutes: actualMinutes,
        actualMinutes,
        status: "COMPLETED",
        taskTitle: selectedTask?.title,
        subjectName: selectedSubject?.name,
      });

      setSessions((prev) => [newSession, ...prev]);

      // Complete notification
      notificationService.sendFocusCompleteNotification(
        selectedTask?.title || selectedSubject?.name || "Focus Session",
        actualMinutes,
      );

      toast.success("Alhamdulillah! Focus session completed 🎉", {
        description: `Logged ${actualMinutes} minutes on ${selectedTask?.title || selectedSubject?.name || "Deep Work"}.`,
        duration: 8000,
      });

      // Switch to short break
      setMode("SHORT_BREAK");
      setRemainingSeconds(5 * 60);
    } else {
      toast.info("Break finished! Ready for your next focus session?");
      setMode("FOCUS");
      setRemainingSeconds(25 * 60);
    }
  }, [
    mode,
    tasks,
    selectedTaskId,
    subjects,
    selectedSubjectId,
    currentPlannedMinutes,
    sessionStartTime,
  ]);

  // Drift-proof timer update loop
  useEffect(() => {
    if (status !== "RUNNING" || !targetEndTime) return;

    const interval = setInterval(() => {
      const diffMs = targetEndTime - Date.now();
      if (diffMs <= 0) {
        clearInterval(interval);
        setRemainingSeconds(0);
        handleSessionCompleted();
      } else {
        setRemainingSeconds(Math.ceil(diffMs / 1000));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [status, targetEndTime, handleSessionCompleted]);

  // Start timer with prayer check
  const startTimerWithCheck = async (durationMinutes: number) => {
    // Only check prayer boundaries for focus sessions, not short breaks
    if (mode === "FOCUS" || mode === "CUSTOM") {
      const fitResult = await planningService.checkFocusSessionPrayerFit(durationMinutes);
      if (!fitResult.fits && fitResult.suggestedShorterDuration) {
        setPrayerFit(fitResult);
        setPendingStartMinutes(durationMinutes);
        setPrayerPromptOpen(true);
        return;
      }
    }

    executeStart(durationMinutes);
  };

  const executeStart = (minutes: number) => {
    const totalSecs = minutes * 60;
    const end = Date.now() + totalSecs * 1000;
    setTargetEndTime(end);
    setRemainingSeconds(totalSecs);
    setStatus("RUNNING");
    setSessionStartTime(new Date().toISOString());
  };

  const handlePause = () => {
    if (status !== "RUNNING" || !targetEndTime) return;
    const remainingMs = Math.max(0, targetEndTime - Date.now());
    setPausedRemainingMs(remainingMs);
    setTargetEndTime(null);
    setStatus("PAUSED");
  };

  const handleResume = () => {
    if (status !== "PAUSED" || pausedRemainingMs === null) return;
    const end = Date.now() + pausedRemainingMs;
    setTargetEndTime(end);
    setStatus("RUNNING");
  };

  const handleReset = () => {
    setStatus("IDLE");
    setTargetEndTime(null);
    setPausedRemainingMs(null);
    setRemainingSeconds(currentPlannedMinutes * 60);
  };

  const handleStopEarly = async () => {
    if (status === "IDLE") return;

    const elapsedSeconds = currentPlannedMinutes * 60 - remainingSeconds;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    setStatus("IDLE");
    setTargetEndTime(null);
    setPausedRemainingMs(null);
    setRemainingSeconds(currentPlannedMinutes * 60);

    if ((mode === "FOCUS" || mode === "CUSTOM") && elapsedMinutes >= 1) {
      const selectedTask = tasks.find((t) => t.id === selectedTaskId);
      const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

      const saved = await focusService.recordSession({
        taskId: selectedTaskId || null,
        subjectId: selectedSubjectId || null,
        startedAt: sessionStartTime || new Date(Date.now() - elapsedMinutes * 60000).toISOString(),
        endedAt: new Date().toISOString(),
        plannedMinutes: currentPlannedMinutes,
        actualMinutes: elapsedMinutes,
        status: "INTERRUPTED",
        taskTitle: selectedTask?.title,
        subjectName: selectedSubject?.name,
      });

      setSessions((prev) => [saved, ...prev]);
      toast.info(`Session ended early. Logged ${elapsedMinutes} minutes.`);
    }
  };

  const handleModeSwitch = (newMode: TimerMode) => {
    setStatus("IDLE");
    setTargetEndTime(null);
    setPausedRemainingMs(null);
    setMode(newMode);

    const mins =
      newMode === "FOCUS"
        ? 25
        : newMode === "SHORT_BREAK"
          ? 5
          : newMode === "LONG_BREAK"
            ? 15
            : customMinutes;
    setRemainingSeconds(mins * 60);
  };

  // Ring SVG metrics
  const circumference = 2 * Math.PI * 96;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const todayMinutes = sessions
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + s.actualMinutes, 0);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Focus Timer
        </h1>
        <p className="text-sm text-muted-foreground">
          Drift-proof Pomodoro structured around your Salah and daily study targets.
        </p>
      </div>

      {/* Mode Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-muted/60 p-1.5">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const isActive = mode === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleModeSwitch(p.id)}
              disabled={status === "RUNNING"}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold transition-all disabled:opacity-60",
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subject and Task Selector */}
      <FocusSessionSelector
        subjects={subjects}
        tasks={tasks}
        selectedSubjectId={selectedSubjectId}
        selectedTaskId={selectedTaskId}
        onSubjectChange={setSelectedSubjectId}
        onTaskChange={setSelectedTaskId}
        disabled={status === "RUNNING"}
      />

      {/* Main Timer Display Card */}
      <Card className="relative overflow-hidden border-border/80">
        <div
          className={cn(
            "h-1.5 w-full transition-all duration-300",
            mode === "FOCUS" || mode === "CUSTOM"
              ? "bg-primary"
              : "bg-emerald",
          )}
        />
        <CardContent className="flex flex-col items-center gap-6 p-8">
          {/* Active Context Tag */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-xs font-semibold tracking-wide",
                mode === "FOCUS" || mode === "CUSTOM"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-emerald/30 bg-emerald/10 text-emerald",
              )}
            >
              {mode === "FOCUS" || mode === "CUSTOM"
                ? `⏱ Focus — ${selectedTask?.title || selectedSubject?.name || "General Deep Work"}`
                : mode === "SHORT_BREAK"
                  ? "☕ Short Break"
                  : "🛋 Long Break"}
            </Badge>

            {status === "PAUSED" && (
              <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-600">
                Paused
              </Badge>
            )}
          </div>

          {/* Circular Countdown Ring */}
          <div className="relative flex size-60 items-center justify-center sm:size-64">
            <svg
              className="-rotate-90 absolute inset-0 size-full"
              viewBox="0 0 220 220"
              aria-hidden="true"
            >
              {/* Background circle */}
              <circle
                cx="110"
                cy="110"
                r="96"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/40"
              />
              {/* Animated Progress circle */}
              <circle
                cx="110"
                cy="110"
                r="96"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke="currentColor"
                className={cn(
                  "transition-all duration-300",
                  mode === "FOCUS" || mode === "CUSTOM"
                    ? "text-primary"
                    : "text-emerald",
                )}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            {/* Centered digits */}
            <div className="text-center select-none">
              <p className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums text-foreground">
                {formatTime(remainingSeconds)}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                {status === "RUNNING"
                  ? "Remaining"
                  : status === "PAUSED"
                    ? "Paused"
                    : "Ready"}
              </p>
            </div>
          </div>

          {/* Custom Duration Input */}
          {mode === "CUSTOM" && status === "IDLE" && (
            <div className="flex items-center gap-3 pt-1">
              <Label htmlFor="custom-duration" className="text-xs text-muted-foreground">
                Duration (minutes):
              </Label>
              <Input
                id="custom-duration"
                type="number"
                min={5}
                max={180}
                step={5}
                value={customMinutes}
                onChange={(e) => {
                  const val = Math.max(5, Math.min(180, Number(e.target.value) || 25));
                  setCustomMinutes(val);
                  setRemainingSeconds(val * 60);
                }}
                className="w-20 text-center font-semibold"
              />
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center gap-4 pt-2">
            {/* Reset Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={status === "IDLE"}
              aria-label="Reset timer"
              className="size-11 rounded-full"
            >
              <RotateCcw className="size-4" />
            </Button>

            {/* Primary Start / Pause / Resume Button */}
            {status === "IDLE" ? (
              <Button
                size="lg"
                onClick={() => startTimerWithCheck(currentPlannedMinutes)}
                className="h-14 px-8 rounded-full text-base font-semibold gap-2 shadow-md hover:scale-105 transition-transform"
              >
                <Play className="size-5 fill-current" />
                <span>Start Focus</span>
              </Button>
            ) : status === "RUNNING" ? (
              <Button
                size="lg"
                onClick={handlePause}
                variant="outline"
                className="h-14 px-8 rounded-full text-base font-semibold gap-2 border-primary/50 text-primary shadow-xs"
              >
                <Pause className="size-5 fill-current" />
                <span>Pause</span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleResume}
                className="h-14 px-8 rounded-full text-base font-semibold gap-2 shadow-md"
              >
                <Play className="size-5 fill-current" />
                <span>Resume</span>
              </Button>
            )}

            {/* Stop Early / Skip */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleStopEarly}
              disabled={status === "IDLE"}
              aria-label="Stop session"
              className="size-11 rounded-full text-muted-foreground hover:text-destructive"
            >
              <Square className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Completed Focus History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Today&apos;s Sessions
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">
              {todayMinutes} min total
            </span>
            <Badge variant="secondary" className="text-[11px]">
              {sessions.filter((s) => s.status === "COMPLETED").length} sessions
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No sessions completed today yet. Start a 25-minute Pomodoro above.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
                      <Check className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.taskTitle || session.subjectName || "Focus Session"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(session.startedAt), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {session.actualMinutes} min
                    </span>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {session.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prayer-Aware approaching prompt modal */}
      {prayerFit && (
        <PrayerAwarePrompt
          open={prayerPromptOpen}
          onOpenChange={setPrayerPromptOpen}
          nextPrayerName={prayerFit.nextPrayerName}
          minutesUntilNextPrayer={prayerFit.minutesUntilNextPrayer}
          suggestedDuration={prayerFit.suggestedShorterDuration || 15}
          originalDuration={pendingStartMinutes || 25}
          onSelectDuration={(duration) => {
            setPrayerPromptOpen(false);
            executeStart(duration);
          }}
          onCancel={() => {
            setPrayerPromptOpen(false);
          }}
        />
      )}
    </div>
  );
}
