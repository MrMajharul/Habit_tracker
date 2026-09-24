"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import {
  BookMarked,
  Check,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import type { DashboardTask, TaskPriority, TaskStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

interface Task extends DashboardTask {
  description?: string;
  deadline?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400",
  medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400",
  high: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Done",
};

const SUBJECT_COLORS = [
  "bg-emerald/10 text-emerald border-emerald/30",
  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
  "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30",
  "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30",
  "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800/30",
];

const SEED_SUBJECTS: Subject[] = [
  { id: "1", name: "Machine Learning", color: SUBJECT_COLORS[0]!, taskCount: 3 },
  { id: "2", name: "Compiler Design", color: SUBJECT_COLORS[1]!, taskCount: 2 },
  { id: "3", name: "Database Systems", color: SUBJECT_COLORS[2]!, taskCount: 2 },
  { id: "4", name: "Programming", color: SUBJECT_COLORS[3]!, taskCount: 1 },
];

const SEED_TASKS: Task[] = [
  { id: "1", title: "Read Chapter 4 — Gradient Descent", subject: "Machine Learning", priority: "high", status: "in_progress", estimatedMinutes: 60 },
  { id: "2", title: "Solve 20 practice problems", subject: "Machine Learning", priority: "medium", status: "todo", estimatedMinutes: 90 },
  { id: "3", title: "Finish assignment 3", subject: "Machine Learning", priority: "high", status: "todo", estimatedMinutes: 120, deadline: "Today" },
  { id: "4", title: "Implement lexer phase", subject: "Compiler Design", priority: "medium", status: "todo", estimatedMinutes: 90 },
  { id: "5", title: "Read parser notes", subject: "Compiler Design", priority: "low", status: "completed", estimatedMinutes: 45 },
  { id: "6", title: "Prepare ER diagram", subject: "Database Systems", priority: "high", status: "todo", estimatedMinutes: 60 },
  { id: "7", title: "Study normalization", subject: "Database Systems", priority: "medium", status: "in_progress", estimatedMinutes: 60 },
];

// ─── Schemas ──────────────────────────────────────────────────────────────────

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  subject: z.string().min(1, "Subject is required"),
  priority: z.enum(["low", "medium", "high"]),
  estimatedMinutes: z.coerce.number().min(5).max(480).optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;
type TaskFormValues = z.infer<typeof taskSchema>;

// ─── Add Subject Dialog ───────────────────────────────────────────────────────

function AddSubjectDialog({ subjects, onAdd }: { subjects: Subject[]; onAdd: (s: Subject) => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
  });

  const onSubmit = (values: SubjectFormValues) => {
    onAdd({
      id: crypto.randomUUID(),
      name: values.name,
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]!,
      taskCount: 0,
    });
    toast.success(`Subject "${values.name}" created`);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>Create a new subject to organise your tasks.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject-name">Subject name</Label>
              <input
                id="subject-name"
                {...register("name")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Machine Learning"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Add subject</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Add Task Dialog ──────────────────────────────────────────────────────────

function AddTaskDialog({ subjects, onAdd }: { subjects: Subject[]; onAdd: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: "medium", subject: subjects[0]?.name ?? "" },
  });

  const onSubmit = (values: TaskFormValues) => {
    onAdd({
      id: crypto.randomUUID(),
      title: values.title,
      subject: values.subject,
      priority: values.priority,
      status: "todo",
      estimatedMinutes: values.estimatedMinutes,
      description: values.description,
      deadline: values.deadline,
    });
    toast.success(`Task "${values.title}" added`);
    reset();
    setOpen(false);
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Task</DialogTitle>
            <DialogDescription>Add a task to one of your subjects.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <input id="task-title" {...register("title")} className={inputClass} placeholder="Read chapter 4" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-subject">Subject</Label>
                <select id="task-subject" {...register("subject")} className={inputClass}>
                  {subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <select id="task-priority" {...register("priority")} className={inputClass}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-mins">Est. minutes</Label>
                <input id="task-mins" type="number" min={5} max={480} {...register("estimatedMinutes")} className={inputClass} placeholder="60" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-deadline">Deadline</Label>
                <input id="task-deadline" {...register("deadline")} className={inputClass} placeholder="Today, Nov 10…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description (optional)</Label>
              <textarea
                id="task-desc"
                {...register("description")}
                rows={2}
                className={inputClass + " resize-none"}
                placeholder="Notes about this task…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Add task</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, onDelete }: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: "in_progress",
    in_progress: "completed",
    completed: "todo",
  };

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
      task.status === "completed" && "border-emerald/30 bg-emerald/5",
    )}>
      <button
        onClick={() => onStatusChange(task.id, nextStatus[task.status])}
        aria-label={`Status: ${STATUS_LABEL[task.status]}`}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.status === "completed"
            ? "border-emerald bg-emerald text-emerald-foreground"
            : task.status === "in_progress"
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/40",
        )}
      >
        {task.status === "completed" && <Check className="size-2.5" />}
        {task.status === "in_progress" && <div className="size-2 rounded-full bg-primary" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-sm font-medium",
          task.status === "completed" && "text-muted-foreground line-through",
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("border text-[10px]", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{STATUS_LABEL[task.status]}</span>
          {task.estimatedMinutes && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="size-2.5" />
              {task.estimatedMinutes} min
            </span>
          )}
          {task.deadline && (
            <span className="text-[10px] font-medium text-gold">
              Due: {task.deadline}
            </span>
          )}
        </div>
      </div>

      <button
        aria-label={`Delete task "${task.title}"`}
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded p-1 text-muted-foreground/60 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function StudyPageClient() {
  const [subjects, setSubjects] = useState<Subject[]>(SEED_SUBJECTS);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  const filteredTasks = tasks.filter((t) => {
    if (activeSubject && t.subject !== activeSubject) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (status === "completed") toast.success("Task completed! ✓");
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task removed");
  };

  const handleAddSubject = (s: Subject) => setSubjects((prev) => [...prev, s]);
  const handleAddTask = (t: Task) => setTasks((prev) => [t, ...prev]);

  const completedToday = tasks.filter((t) => t.status === "completed").length;
  const totalMinutes = tasks
    .filter((t) => t.status === "completed" && t.estimatedMinutes)
    .reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Study &amp; Work</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan tasks around your prayer schedule.</p>
        </div>
        <div className="flex gap-2">
          <AddSubjectDialog subjects={subjects} onAdd={handleAddSubject} />
          <AddTaskDialog subjects={subjects} onAdd={handleAddTask} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tasks done", value: completedToday },
          { label: "Study time", value: `${totalMinutes} min` },
          { label: "Subjects", value: subjects.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubject(null)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !activeSubject
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/40",
          )}
        >
          <BookMarked className="size-3" />
          All subjects
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSubject(s.name === activeSubject ? null : s.name)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeSubject === s.name
                ? s.color
                : "border-border hover:border-primary/40",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
        {(["all", "todo", "in_progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-colors",
              statusFilter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "in_progress" ? "In progress" : f === "all" ? "All" : STATUS_LABEL[f as TaskStatus]}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {activeSubject
                  ? `No ${statusFilter === "all" ? "" : statusFilter + " "}tasks in "${activeSubject}".`
                  : "No tasks found. Add a task above."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-2 pt-4 pb-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
