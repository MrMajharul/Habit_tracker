"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Subject, Task, TaskPriority } from "@/services/study/types";

interface QuickAddTaskProps {
  subjects: Subject[];
  defaultSubjectId?: string;
  onTaskCreated: (task: Task) => void;
  createTaskFn: (params: {
    title: string;
    subjectId?: string | null;
    priority?: TaskPriority;
    estimatedMinutes?: number;
  }) => Promise<Task>;
  placeholder?: string;
}

export function QuickAddTask({
  subjects,
  defaultSubjectId,
  onTaskCreated,
  createTaskFn,
  placeholder = "Quick add a task… (e.g. Read 10 pages)",
}: QuickAddTaskProps) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? (subjects[0]?.id || ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newTask = await createTaskFn({
        title: title.trim(),
        subjectId: subjectId || null,
        priority: "MEDIUM",
        estimatedMinutes: 25,
      });

      setTitle("");
      onTaskCreated(newTask);
      toast.success(`Task added: "${newTask.title}"`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-2 sm:flex-row sm:items-center sm:p-2.5"
    >
      <div className="relative flex-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="h-9 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="flex items-center gap-2">
        {subjects.length > 0 && (
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={isSubmitting}
            className="h-8 max-w-[130px] truncate rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Select subject for task"
          >
            <option value="">No Subject</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || isSubmitting}
          className="h-8 gap-1.5 rounded-lg px-3 text-xs"
        >
          <Plus className="size-3.5" />
          <span>Add</span>
        </Button>
      </div>
    </form>
  );
}
