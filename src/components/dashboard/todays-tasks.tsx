"use client";

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { taskService } from "@/services/study/task-service";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DashboardTask, TaskStatus } from "@/types";

const PRIORITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  LOW: "secondary",
  medium: "outline",
  MEDIUM: "outline",
  high: "destructive",
  HIGH: "destructive",
  urgent: "destructive",
  URGENT: "destructive",
};

interface TodaysTasksProps {
  tasks: DashboardTask[];
  isMockData?: boolean;
  focusMinutesToday?: number;
  completedSessionsToday?: number;
  onAddTask?: (title: string) => void;
}

export function TodaysTasks({
  tasks: initialTasks,
  isMockData,
  focusMinutesToday = 70,
  completedSessionsToday = 2,
  onAddTask,
}: TodaysTasksProps) {
  const [tasks, setTasks] = useState<DashboardTask[]>(initialTasks);
  const [quickTitle, setQuickTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Sync with persistent tasks on client mount
  useEffect(() => {
    let mounted = true;
    taskService.getTasks().then((all) => {
      if (!mounted || all.length === 0) return;
      const todayList = all.filter(
        (t) => taskService.isDueToday(t) || (!t.dueDate && t.status !== "COMPLETED"),
      );
      if (todayList.length > 0) {
        setTasks(
          todayList.map((t) => ({
            id: t.id,
            title: t.title,
            priority:
              (t.priority?.toLowerCase() as DashboardTask["priority"]) ||
              "medium",
            status: t.status === "COMPLETED" ? "completed" : "todo",
            estimatedMinutes: t.estimatedMinutes ?? undefined,
            subject: "General",
          })),
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = tasks.filter(
    (t) => t.status === "completed" || t.status === "COMPLETED",
  ).length;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Identify top task (first uncompleted task or high priority task)
  const pendingTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "COMPLETED",
  );
  const topTask =
    pendingTasks.find(
      (t) =>
        t.priority === "high" ||
        t.priority === "HIGH" ||
        t.priority === "urgent" ||
        t.priority === "URGENT",
    ) || pendingTasks[0];

  const nextTask =
    pendingTasks.length > 1
      ? pendingTasks.find((t) => t.id !== topTask?.id)
      : null;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const created = await taskService.createTask({
        title: quickTitle.trim(),
        priority: "MEDIUM",
        estimatedMinutes: 25,
      });

      const newTask: DashboardTask = {
        id: created.id,
        title: created.title,
        priority: "medium",
        status: "todo",
        estimatedMinutes: created.estimatedMinutes ?? undefined,
        subject: "General",
      };

      setTasks((prev) => [newTask, ...prev]);
      if (onAddTask) {
        onAddTask(quickTitle.trim());
      }
      toast.success(`Task added: "${newTask.title}"`);
      setQuickTitle("");
    } catch (err) {
      console.error("Failed to add task:", err);
      toast.error("Failed to add task");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (taskId: string) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;
    const isDone =
      current.status === "completed" || current.status === "COMPLETED";
    const nextStatus: TaskStatus = isDone ? "todo" : "completed";

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
    );

    if (!isDone) {
      toast.success("Task completed! Barakallahu feek");
    }

    try {
      await taskService.toggleTask(
        taskId,
        nextStatus === "completed" ? "COMPLETED" : "TODO",
      );
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Today&apos;s Plan</CardTitle>
          <span className="text-xs text-muted-foreground">
            ({completedCount}/{totalCount} done)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isMockData ? (
            <Badge variant="secondary" className="text-[10px]">
              Demo
            </Badge>
          ) : null}
          <Link
            href="/tasks"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-7 text-xs text-primary hover:bg-primary/10 gap-1 px-2",
            )}
          >
            <span>View All</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {/* Task Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Focus Widget Bar */}
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {focusMinutesToday} min focused today
              </p>
              <p className="text-[11px] text-muted-foreground">
                {completedSessionsToday} completed {completedSessionsToday === 1 ? "session" : "sessions"}
              </p>
            </div>
          </div>

          <Link
            href="/focus"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs",
            )}
          >
            <Play className="size-3 fill-current" />
            <span>Start Focus</span>
          </Link>
        </div>

        {/* Top Task Highlight (if available) */}
        {topTask && (
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gold">
                <Sparkles className="size-3" /> Top Priority Today
              </span>
              {topTask.estimatedMinutes && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {topTask.estimatedMinutes} min
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {topTask.title}
            </p>
            {topTask.subject && (
              <span className="inline-block text-[11px] text-muted-foreground">
                Area: {topTask.subject}
              </span>
            )}
          </div>
        )}

        {/* Next Task & Upcoming Deadline snippet */}
        {nextTask && (
          <div className="flex items-center justify-between text-xs rounded-lg bg-muted/40 px-3 py-2 text-muted-foreground">
            <span className="flex items-center gap-1.5 truncate">
              <Target className="size-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">Up Next:</span>{" "}
              <span className="truncate">{nextTask.title}</span>
            </span>
            <span className="shrink-0 text-[11px]">
              {nextTask.estimatedMinutes ? `${nextTask.estimatedMinutes}m` : ""}
            </span>
          </div>
        )}

        {/* Quick Add Input */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add a task for today…"
            className="h-8.5 text-xs bg-card"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!quickTitle.trim() || isAdding}
            className="h-8.5 px-3 text-xs gap-1"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        </form>

        {/* Task list items */}
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No tasks scheduled for today. Plan your study and work around prayer times.
          </p>
        ) : (
          <ul className="space-y-2 pt-1">
            {tasks.slice(0, 5).map((task) => {
              const isCompleted =
                task.status === "completed" || task.status === "COMPLETED";
              return (
                <li
                  key={task.id}
                  onClick={() => handleToggle(task.id)}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-xl border border-border/70 p-2.5 cursor-pointer transition-colors hover:bg-muted/40",
                    isCompleted && "bg-emerald/5 border-emerald/20 opacity-70",
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                      className={cn(
                        "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors",
                        isCompleted
                          ? "border-emerald bg-emerald text-emerald-foreground"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {isCompleted && <CheckCircle2 className="size-3" />}
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={cn(
                          "text-xs font-medium text-foreground truncate",
                          isCompleted && "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {task.subject && <span>{task.subject}</span>}
                        {task.estimatedMinutes && (
                          <span>{task.estimatedMinutes} min</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={PRIORITY_VARIANT[task.priority] || "outline"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
