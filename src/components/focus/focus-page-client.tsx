"use client";

import { BookMarked, Check, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimerMode = "25/5" | "50/10" | "custom";
type TimerPhase = "focus" | "break";

interface TimerPreset {
  id: TimerMode;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
}

interface FocusSession {
  id: string;
  subject: string;
  durationMinutes: number;
  completedAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS: TimerPreset[] = [
  { id: "25/5", label: "Pomodoro 25/5", focusMinutes: 25, breakMinutes: 5 },
  { id: "50/10", label: "Deep Work 50/10", focusMinutes: 50, breakMinutes: 10 },
  { id: "custom", label: "Custom", focusMinutes: 30, breakMinutes: 5 },
];

const SUBJECTS = [
  "Machine Learning",
  "Compiler Design",
  "Database Systems",
  "Programming",
  "Mathematics",
  "English",
  "Qur'an Study",
  "General",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FocusPageClient() {
  const [mode, setMode] = useState<TimerMode>("25/5");
  const [customFocus, setCustomFocus] = useState(30);
  const [customBreak, setCustomBreak] = useState(5);
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [subject, setSubject] = useState(SUBJECTS[0]!);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const preset = PRESETS.find((p) => p.id === mode)!;
  const focusSecs = (mode === "custom" ? customFocus : preset.focusMinutes) * 60;
  const breakSecs = (mode === "custom" ? customBreak : preset.breakMinutes) * 60;
  const totalSecs = phase === "focus" ? focusSecs : breakSecs;

  const [timeLeft, setTimeLeft] = useState(focusSecs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = ((totalSecs - timeLeft) / totalSecs) * 100;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopTimer();
            if (phase === "focus") {
              toast.success(`Focus session complete! 🎉`, {
                description: `${preset.focusMinutes || customFocus} minutes on ${subject}.`,
                duration: 8000,
              });
              setSessions((prev) => [
                {
                  id: crypto.randomUUID(),
                  subject,
                  durationMinutes: mode === "custom" ? customFocus : preset.focusMinutes,
                  completedAt: new Date(),
                },
                ...prev,
              ]);
              setPhase("break");
              return breakSecs;
            } else {
              toast.message("Break over — ready for your next session?");
              setPhase("focus");
              return focusSecs;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, breakSecs, focusSecs, preset, subject, stopTimer, customFocus, mode]);

  const handleReset = () => {
    stopTimer();
    setPhase("focus");
    setTimeLeft(focusSecs);
  };

  const handleModeChange = (newMode: TimerMode) => {
    stopTimer();
    setMode(newMode);
    setPhase("focus");
    const p = PRESETS.find((x) => x.id === newMode)!;
    setTimeLeft((newMode === "custom" ? customFocus : p.focusMinutes) * 60);
  };

  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const totalFocusToday = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const inputClass =
    "rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-20 text-center";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Focus Timer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deep work sessions structured around your goals.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleModeChange(p.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              mode === p.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Subject Selector */}
      <div className="flex items-center gap-3">
        <BookMarked className="size-4 shrink-0 text-muted-foreground" />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={running}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Timer Ring */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8">
          {/* Phase Badge */}
          <Badge
            variant="secondary"
            className={cn(
              "text-sm font-medium",
              phase === "focus"
                ? "bg-primary/10 text-primary"
                : "bg-emerald/10 text-emerald",
            )}
          >
            {phase === "focus" ? `⏱ Focus — ${subject}` : "☕ Break time"}
          </Badge>

          {/* SVG Ring */}
          <div className="relative flex size-52 items-center justify-center">
            <svg className="-rotate-90 absolute inset-0" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/40"
              />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke="currentColor"
                className={cn(
                  "transition-all duration-1000",
                  phase === "focus" ? "text-primary" : "text-emerald",
                )}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="text-center">
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
                {formatTime(timeLeft)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {phase === "focus" ? "remaining" : "break"}
              </p>
            </div>
          </div>

          {/* Custom Duration Inputs */}
          {mode === "custom" && !running && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Focus (min)</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={customFocus}
                  onChange={(e) => {
                    const v = Math.max(5, Math.min(120, Number(e.target.value)));
                    setCustomFocus(v);
                    if (phase === "focus") setTimeLeft(v * 60);
                  }}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Break (min)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={customBreak}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(30, Number(e.target.value)));
                    setCustomBreak(v);
                    if (phase === "break") setTimeLeft(v * 60);
                  }}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              aria-label="Reset timer"
            >
              <RotateCcw className="size-4" />
            </Button>

            <Button
              size="lg"
              onClick={() => setRunning((r) => !r)}
              className={cn(
                "size-14 rounded-full",
                phase === "focus" ? "" : "bg-emerald hover:bg-emerald/80",
              )}
              aria-label={running ? "Pause timer" : "Start timer"}
            >
              {running ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 translate-x-0.5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                stopTimer();
                if (phase === "focus" && running) {
                  const elapsed = Math.round((focusSecs - timeLeft) / 60);
                  if (elapsed >= 1) {
                    setSessions((prev) => [
                      {
                        id: crypto.randomUUID(),
                        subject,
                        durationMinutes: elapsed,
                        completedAt: new Date(),
                      },
                      ...prev,
                    ]);
                    toast.message(`Saved ${elapsed} min session — ${subject}`);
                  }
                }
                handleReset();
              }}
              aria-label="Stop session"
            >
              <Square className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Today&apos;s Sessions</span>
              <Badge variant="secondary" className="text-xs">
                {totalFocusToday} min total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald" />
                    <span className="text-sm font-medium">{session.subject}</span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{session.durationMinutes} min</p>
                    <p>
                      {session.completedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
