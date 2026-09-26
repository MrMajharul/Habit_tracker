"use client";

import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Subject, Task } from "@/services/study/types";
import { QuickAddTask } from "./quick-add-task";
import { TaskCard } from "./task-card";

interface TaskListProps {
  tasks: Task[];
  subjects: Subject[];
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onTaskCreated: (task: Task) => void;
  createTaskFn: (params: {
    title: string;
    subjectId?: string | null;
  }) => Promise<Task>;
  showQuickAdd?: boolean;
  emptyMessage?: string;
  defaultSubjectId?: string;
}

export function TaskList({
  tasks,
  subjects,
  onToggle,
  onEdit,
  onDelete,
  onTaskCreated,
  createTaskFn,
  showQuickAdd = true,
  emptyMessage = "No tasks found in this view.",
  defaultSubjectId,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      {showQuickAdd && (
        <QuickAddTask
          subjects={subjects}
          defaultSubjectId={defaultSubjectId}
          onTaskCreated={onTaskCreated}
          createTaskFn={createTaskFn}
        />
      )}

      {tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              All clear
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
