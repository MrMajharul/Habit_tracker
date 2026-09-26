"use client";

import { Calendar, Check, Clock, MoreVertical, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { taskService } from "@/services/study/task-service";
import type { Task } from "@/services/study/types";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusBadge } from "./task-status-badge";

interface TaskCardProps {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  className,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = task.status === "COMPLETED";
  const isOverdue = taskService.isOverdue(task);

  const handleToggle = async () => {
    try {
      setIsUpdating(true);
      await onToggle(task);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDue = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return "Today";
      if (isTomorrow(d)) return "Tomorrow";
      return format(d, "MMM d");
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 rounded-xl border p-4 transition-all duration-200",
        isCompleted
          ? "border-emerald/30 bg-emerald/5 dark:bg-emerald/10 opacity-75"
          : isOverdue
            ? "border-red-300/60 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20"
            : "border-border/80 bg-card hover:border-primary/40 hover:shadow-xs",
        className,
      )}
    >
      {/* Complete toggle checkbox */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={handleToggle}
        aria-label={isCompleted ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
        className={cn(
          "mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40",
          isCompleted
            ? "border-emerald bg-emerald text-emerald-foreground shadow-xs"
            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/5",
        )}
      >
        {isCompleted && <Check className="size-3.5 stroke-[2.5]" />}
      </button>

      {/* Main task content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {task.subject && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `${task.subject.color}15`,
                color: task.subject.color,
                border: `1px solid ${task.subject.color}35`,
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: task.subject.color }}
                aria-hidden="true"
              />
              {task.subject.name}
            </span>
          )}

          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>

        <h3
          className={cn(
            "text-sm font-medium tracking-tight text-foreground transition-all",
            isCompleted && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </h3>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
          {task.estimatedMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              <span>{task.estimatedMinutes} min</span>
            </span>
          ) : null}

          {task.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : isToday(new Date(task.dueDate))
                    ? "text-gold"
                    : "text-muted-foreground",
              )}
            >
              <Calendar className="size-3 shrink-0" />
              <span>Due: {formatDue(task.dueDate)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {!isCompleted && (
          <Link
            href={`/focus?taskId=${task.id}&task=${encodeURIComponent(task.title)}${task.subjectId ? `&subjectId=${task.subjectId}` : ""}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 gap-1.5 rounded-lg px-2 text-xs text-primary hover:bg-primary/10",
            )}
            title="Start Pomodoro focus timer with this task"
          >
            <Play className="size-3.5 fill-current" />
            <span className="hidden sm:inline">Focus</span>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-8 rounded-lg text-muted-foreground hover:text-foreground",
            )}
            aria-label={`Options for ${task.title}`}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Edit Task
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleToggle}>
              {isCompleted ? "Mark Incomplete" : "Mark Complete"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
