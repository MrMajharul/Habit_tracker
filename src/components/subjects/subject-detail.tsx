"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  Play,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FocusSession, Subject, Task } from "@/services/study/types";
import { TaskCard } from "../tasks/task-card";
import { QuickAddTask } from "../tasks/quick-add-task";
import { SUBJECT_ICON_MAP } from "./subject-card";

interface SubjectDetailProps {
  subject: Subject;
  tasks: Task[];
  sessions: FocusSession[];
  onBack: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject?: (id: string) => void;
  onToggleTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTaskCreated: (task: Task) => void;
  createTaskFn: (params: {
    title: string;
    subjectId?: string | null;
  }) => Promise<Task>;
}

export function SubjectDetail({
  subject,
  tasks,
  sessions,
  onBack,
  onEditSubject,
  onDeleteSubject,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onTaskCreated,
  createTaskFn,
}: SubjectDetailProps) {
  const [tab, setTab] = useState<"tasks" | "sessions">("tasks");
  const IconComponent = SUBJECT_ICON_MAP[subject.icon] || Clock;

  const subjectTasks = tasks.filter((t) => t.subjectId === subject.id);
  const completedTasks = subjectTasks.filter((t) => t.status === "COMPLETED");
  const activeTasks = subjectTasks.filter((t) => t.status !== "COMPLETED");

  const completedMinutesThisWeek = sessions
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + s.actualMinutes, 0);

  const targetMinutes = subject.weeklyTargetMinutes || 120;
  const progressPercent = Math.min(
    100,
    Math.round((completedMinutesThisWeek / targetMinutes) * 100),
  );

  return (
    <div className="space-y-6">
      {/* Top back button and action bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>All Subjects</span>
        </Button>

        <div className="flex items-center gap-2">
          {onDeleteSubject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${subject.name}?`)) {
                  onDeleteSubject(subject.id);
                  onBack();
                }
              }}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditSubject(subject)}
            className="gap-1.5"
          >
            <Edit className="size-3.5" />
            <span>Edit</span>
          </Button>

          <Link
            href={`/focus?subjectId=${subject.id}&subject=${encodeURIComponent(subject.name)}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground",
            )}
          >
            <Play className="size-3.5 fill-current" />
            <span>Start Focus</span>
          </Link>
        </div>
      </div>

      {/* Overview Banner Card */}
      <Card className="relative overflow-hidden">
        <div
          className="h-2 w-full"
          style={{ backgroundColor: subject.color || "#10b981" }}
        />
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${subject.color || "#10b981"}20`,
                  color: subject.color || "#10b981",
                }}
              >
                <IconComponent className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {subject.name}
                </h1>
                {subject.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>

            {/* Weekly Target Widget */}
            <div className="min-w-[220px] rounded-xl border border-border/80 bg-muted/30 p-3.5">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Weekly Target Progress</span>
                <span className="font-semibold text-foreground">
                  {completedMinutesThisWeek} / {targetMinutes} min
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: subject.color || "#10b981",
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>{progressPercent}% completed</span>
                {progressPercent >= 100 && (
                  <span className="text-emerald font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="size-3" /> Met target!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
            <div>
              <p className="text-xs text-muted-foreground">Active Tasks</p>
              <p className="text-xl font-bold text-foreground mt-0.5">
                {activeTasks.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Tasks</p>
              <p className="text-xl font-bold text-emerald mt-0.5">
                {completedTasks.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Focus Sessions</p>
              <p className="text-xl font-bold text-foreground mt-0.5">
                {sessions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Focus Time</p>
              <p className="text-xl font-bold text-foreground mt-0.5">
                {sessions.reduce((sum, s) => sum + s.actualMinutes, 0)} min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Tasks vs Focus History */}
      <div className="flex gap-2 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setTab("tasks")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            tab === "tasks"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks ({subjectTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("sessions")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            tab === "sessions"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Focus Sessions ({sessions.length})
        </button>
      </div>

      {tab === "tasks" ? (
        <div className="space-y-4">
          <QuickAddTask
            subjects={[subject]}
            defaultSubjectId={subject.id}
            onTaskCreated={onTaskCreated}
            createTaskFn={createTaskFn}
            placeholder={`Add a task to ${subject.name}…`}
          />

          {subjectTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No tasks added to {subject.name} yet. Use the quick add box above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {subjectTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No focus sessions recorded for {subject.name} yet.
                </p>
                <Link
                  href={`/focus?subjectId=${subject.id}&subject=${encodeURIComponent(subject.name)}`}
                  className={cn(buttonVariants({ size: "sm" }), "mt-3 gap-1.5")}
                >
                  <Play className="size-3.5 fill-current" />
                  <span>Start First Session</span>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-2.5">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.taskTitle || "General Focus"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.startedAt), "MMM d, yyyy · h:mm a")}
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
