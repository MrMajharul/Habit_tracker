"use client";

import {
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  planningService,
} from "@/services/study/planning-service";
import { subjectService } from "@/services/study/subject-service";
import {
  taskService,
  type TaskFilterOptions,
} from "@/services/study/task-service";
import type {
  PlanningWindow,
  Subject,
  Task,
  TaskStatus,
} from "@/services/study/types";
import { TaskDialog } from "./task-dialog";
import { TaskFilters } from "./task-filters";
import { TaskList } from "./task-list";

export function TasksPageClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filters, setFilters] = useState<TaskFilterOptions>({
    timeframe: "TODAY",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [planningWindow, setPlanningWindow] = useState<PlanningWindow | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      taskService.getTasks(filters),
      subjectService.getSubjects(),
      planningService.getPrayerPlanningWindow().catch(() => null),
    ]).then(([fetchedTasks, fetchedSubjects, windowInfo]) => {
      if (!mounted) return;
      setTasks(fetchedTasks);
      setSubjects(fetchedSubjects);
      setPlanningWindow(windowInfo);
    });
    return () => {
      mounted = false;
    };
  }, [filters]);

  const handleToggleTask = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === "COMPLETED" ? "TODO" : "COMPLETED";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt:
                nextStatus === "COMPLETED" ? new Date().toISOString() : null,
            }
          : t,
      ),
    );

    const updated = await taskService.toggleTask(task.id, nextStatus);
    if (updated) {
      if (nextStatus === "COMPLETED") {
        toast.success("Task completed! Barakallahu feek");
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await taskService.deleteTask(id);
    toast.success("Task removed");
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setTaskToEdit(null);
    setDialogOpen(true);
  };

  const handleSaveTask = (savedTask: Task) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === savedTask.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = savedTask;
        return copy;
      }
      return [savedTask, ...prev];
    });
  };

  // Quick stats
  const overdueCount = tasks.filter((t) => taskService.isOverdue(t)).length;
  const todayCount = tasks.filter((t) => taskService.isDueToday(t)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tasks &amp; Planning
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structure your study and work sessions around your Salah routine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/subjects"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 border-border/80 text-foreground",
            )}
          >
            <span>View Subjects</span>
          </Link>

          <Button onClick={handleCreateNew} className="gap-2 shadow-xs">
            <Plus className="size-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Prayer-Aware Planning Suggestion Banner */}
      {planningWindow && planningWindow.availableMinutes > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  You have {planningWindow.availableMinutes} minutes before{" "}
                  {planningWindow.nextPrayer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {planningWindow.recommendedTasks.length > 0
                    ? `Recommended: "${planningWindow.recommendedTasks[0]?.task.title}" fits comfortably before prayer.`
                    : "A short focus sprint or dhikr pause will fit nicely."}
                </p>
              </div>
            </div>

            <Link
              href={`/focus?duration=${planningWindow.recommendedFocusDuration}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "shrink-0 gap-1.5 bg-primary text-primary-foreground font-semibold",
              )}
            >
              <Clock className="size-3.5" />
              <span>Start {planningWindow.recommendedFocusDuration}m Focus</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Filters (Timeframe tabs, search, dropdowns) */}
      <TaskFilters
        filters={filters}
        subjects={subjects}
        onFilterChange={setFilters}
        overdueCount={overdueCount}
        todayCount={todayCount}
      />

      {/* Main Task List */}
      <TaskList
        tasks={tasks}
        subjects={subjects}
        onToggle={handleToggleTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onTaskCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
        createTaskFn={(params) => taskService.createTask(params)}
        emptyMessage={
          filters.timeframe === "TODAY"
            ? "No tasks due today. Plan tasks above or take a focused break!"
            : filters.timeframe === "OVERDUE"
              ? "Alhamdulillah, you have no overdue tasks!"
              : "No tasks found matching the selected filters."
        }
      />

      {/* Create / Edit Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        taskToEdit={taskToEdit}
        subjects={subjects}
        onSave={handleSaveTask}
        createTaskFn={(p) => taskService.createTask(p)}
        updateTaskFn={(id, u) => taskService.updateTask(id, u)}
      />
    </div>
  );
}
