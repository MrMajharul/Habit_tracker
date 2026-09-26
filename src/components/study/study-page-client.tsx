"use client";

import {
  BookMarked,
  Layers,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { focusService } from "@/services/study/focus-service";
import { subjectService } from "@/services/study/subject-service";
import { taskService } from "@/services/study/task-service";
import type {
  Subject,
  Task,
  TaskStatus,
} from "@/services/study/types";

export function StudyPageClient() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [fetchedSubs, fetchedTasks, fetchedSessions] = await Promise.all([
      subjectService.getSubjects(),
      taskService.getTasks(),
      focusService.getSessions(),
    ]);

    const enriched = fetchedSubs.map((sub) => {
      const subTasks = fetchedTasks.filter((t) => t.subjectId === sub.id);
      const subSessions = fetchedSessions.filter(
        (s) => s.subjectId === sub.id && s.status === "COMPLETED",
      );
      const completedMinutes = subSessions.reduce(
        (sum, s) => sum + s.actualMinutes,
        0,
      );
      const activeTaskCount = subTasks.filter(
        (t) => t.status !== "COMPLETED",
      ).length;
      const target = sub.weeklyTargetMinutes || 120;
      const progressPercentage = Math.min(
        100,
        Math.round((completedMinutes / target) * 100),
      );

      return {
        ...sub,
        completedMinutes,
        activeTaskCount,
        progressPercentage,
      };
    });

    setSubjects(enriched);
    setTasks(fetchedTasks);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      subjectService.getSubjects(),
      taskService.getTasks(),
      focusService.getSessions(),
    ]).then(([fetchedSubs, fetchedTasks, fetchedSessions]) => {
      if (!mounted) return;
      const enriched = fetchedSubs.map((sub) => {
        const subTasks = fetchedTasks.filter((t) => t.subjectId === sub.id);
        const subSessions = fetchedSessions.filter(
          (s) => s.subjectId === sub.id && s.status === "COMPLETED",
        );
        const completedMinutes = subSessions.reduce(
          (sum, s) => sum + s.actualMinutes,
          0,
        );
        const activeTaskCount = subTasks.filter(
          (t) => t.status !== "COMPLETED",
        ).length;
        const target = sub.weeklyTargetMinutes || 120;
        const progressPercentage = Math.min(
          100,
          Math.round((completedMinutes / target) * 100),
        );

        return {
          ...sub,
          completedMinutes,
          activeTaskCount,
          progressPercentage,
        };
      });

      setSubjects(enriched);
      setTasks(fetchedTasks);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
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
    await taskService.toggleTask(task.id, nextStatus);
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await taskService.deleteTask(id);
    toast.success("Task removed");
    loadData();
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeSubjectId && t.subjectId !== activeSubjectId) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return true;
  });

  const completedToday = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalMinutes = tasks
    .filter((t) => t.status === "COMPLETED" && t.estimatedMinutes)
    .reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Study &amp; Work
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan deep work around your prayer schedule and achieve Istiqamaah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/subjects"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            <Layers className="size-3.5" />
            <span>Subjects</span>
          </Link>

          <Link
            href="/tasks"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            <BookMarked className="size-3.5" />
            <span>All Tasks</span>
          </Link>

          <Button
            size="sm"
            onClick={() => {
              setTaskToEdit(null);
              setTaskDialogOpen(true);
            }}
            className="gap-1.5 shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tasks done", value: completedToday },
          { label: "Study time", value: `${totalMinutes} min` },
          { label: "Subjects", value: subjects.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubjectId(null)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            !activeSubjectId
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : "border-border/80 hover:border-primary/40 text-muted-foreground"
          }`}
        >
          <BookMarked className="size-3" />
          <span>All subjects</span>
        </button>

        {subjects.map((s) => {
          const isSelected = activeSubjectId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSubjectId(isSelected ? null : s.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                  : "border-border/80 hover:border-primary/40 text-muted-foreground"
              }`}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.name}</span>
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSubjectDialogOpen(true)}
          className="h-7 gap-1 rounded-full text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" />
          <span>Add Area</span>
        </Button>
      </div>

      {/* Quick Add Form */}
      <QuickAddTask
        subjects={subjects}
        defaultSubjectId={activeSubjectId || undefined}
        onTaskCreated={(t) => setTasks((prev) => [t, ...prev])}
        createTaskFn={(p) => taskService.createTask(p)}
      />

      {/* Status filter */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
        {(["ALL", "TODO", "IN_PROGRESS", "COMPLETED"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "ALL"
              ? "All"
              : f === "TODO"
                ? "To Do"
                : f === "IN_PROGRESS"
                  ? "In Progress"
                  : "Done"}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No tasks found in this view. Use the quick add box above.
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onEdit={(t) => {
                setTaskToEdit(t);
                setTaskDialogOpen(true);
              }}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        taskToEdit={taskToEdit}
        subjects={subjects}
        defaultSubjectId={activeSubjectId || undefined}
        onSave={() => loadData()}
        createTaskFn={(p) => taskService.createTask(p)}
        updateTaskFn={(id, u) => taskService.updateTask(id, u)}
      />

      <SubjectDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        onSave={() => loadData()}
        createSubjectFn={(p) => subjectService.createSubject(p)}
        updateSubjectFn={(id, u) => subjectService.updateSubject(id, u)}
      />
    </div>
  );
}
