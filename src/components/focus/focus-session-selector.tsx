"use client";

import { BookMarked, CheckSquare } from "lucide-react";

import { Label } from "@/components/ui/label";
import type { Subject, Task } from "@/services/study/types";

interface FocusSessionSelectorProps {
  subjects: Subject[];
  tasks: Task[];
  selectedSubjectId: string;
  selectedTaskId: string;
  onSubjectChange: (subjectId: string) => void;
  onTaskChange: (taskId: string) => void;
  disabled?: boolean;
}

export function FocusSessionSelector({
  subjects,
  tasks,
  selectedSubjectId,
  selectedTaskId,
  onSubjectChange,
  onTaskChange,
  disabled = false,
}: FocusSessionSelectorProps) {
  // If a subject is selected, filter tasks for that subject
  const availableTasks = selectedSubjectId
    ? tasks.filter((t) => !t.subjectId || t.subjectId === selectedSubjectId)
    : tasks;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-card p-4">
      {/* Subject select */}
      <div className="space-y-1.5">
        <Label
          htmlFor="focus-subject-select"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <BookMarked className="size-3.5" />
          <span>Subject / Area</span>
        </Label>
        <select
          id="focus-subject-select"
          disabled={disabled}
          value={selectedSubjectId}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        >
          <option value="">General Work / Study</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task select */}
      <div className="space-y-1.5">
        <Label
          htmlFor="focus-task-select"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <CheckSquare className="size-3.5" />
          <span>Associated Task (Optional)</span>
        </Label>
        <select
          id="focus-task-select"
          disabled={disabled}
          value={selectedTaskId}
          onChange={(e) => onTaskChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        >
          <option value="">No specific task</option>
          {availableTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} {t.estimatedMinutes ? `(${t.estimatedMinutes}m)` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
