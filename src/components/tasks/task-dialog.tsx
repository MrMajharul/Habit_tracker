"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Subject, Task, TaskPriority, TaskStatus } from "@/services/study/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task | null;
  subjects: Subject[];
  defaultSubjectId?: string;
  onSave: (task: Task) => void;
  createTaskFn: (params: {
    title: string;
    subjectId?: string | null;
    description?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string | null;
    estimatedMinutes?: number | null;
  }) => Promise<Task>;
  updateTaskFn: (
    id: string,
    updates: Partial<Task>,
  ) => Promise<Task | null>;
}

function TaskFormContent({
  taskToEdit,
  subjects,
  defaultSubjectId,
  onClose,
  onSave,
  createTaskFn,
  updateTaskFn,
}: {
  taskToEdit?: Task | null;
  subjects: Subject[];
  defaultSubjectId?: string;
  onClose: () => void;
  onSave: (task: Task) => void;
  createTaskFn: TaskDialogProps["createTaskFn"];
  updateTaskFn: TaskDialogProps["updateTaskFn"];
}) {
  const [title, setTitle] = useState(taskToEdit?.title ?? "");
  const [subjectId, setSubjectId] = useState(
    taskToEdit?.subjectId ?? defaultSubjectId ?? (subjects[0]?.id || ""),
  );
  const [description, setDescription] = useState(taskToEdit?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status ?? "TODO");
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate
      ? taskToEdit.dueDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    taskToEdit?.estimatedMinutes ?? 25,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const parsedDueDate = dueDate ? `${dueDate}T23:59:59.000Z` : null;

      if (taskToEdit) {
        const updated = await updateTaskFn(taskToEdit.id, {
          title: title.trim(),
          subjectId: subjectId || null,
          description: description.trim() || null,
          priority,
          status,
          dueDate: parsedDueDate,
          estimatedMinutes: Number(estimatedMinutes) || 25,
        });
        if (updated) {
          onSave(updated);
          toast.success("Task updated");
        }
      } else {
        const created = await createTaskFn({
          title: title.trim(),
          subjectId: subjectId || null,
          description: description.trim() || null,
          priority,
          status,
          dueDate: parsedDueDate,
          estimatedMinutes: Number(estimatedMinutes) || 25,
        });
        onSave(created);
        toast.success(`Task created: "${created.title}"`);
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {taskToEdit ? "Edit Task" : "Create New Task"}
        </DialogTitle>
        <DialogDescription>
          {taskToEdit
            ? "Update task details, deadline, and estimated duration."
            : "Plan your study or work task around your Salah routine."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Title *</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement parser grammar"
            required
            className="w-full"
            autoFocus
          />
        </div>

        {/* Subject and Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-subject">Subject / Area</Label>
            <select
              id="task-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">No Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Due date and Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-due-date">Due Date</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-est-minutes">Est. Duration (min)</Label>
            <Input
              id="task-est-minutes"
              type="number"
              min={5}
              max={480}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Status (if editing) */}
        {taskToEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="task-status">Status</Label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="task-description">Notes &amp; Description</Label>
          <textarea
            id="task-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes or sub-tasks…"
            className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : taskToEdit
                ? "Update Task"
                : "Create Task"}
          </Button>
        </div>
      </form>
    </>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  taskToEdit,
  subjects,
  defaultSubjectId,
  onSave,
  createTaskFn,
  updateTaskFn,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogContent>
          {open && (
            <TaskFormContent
              key={taskToEdit?.id ?? "new-task"}
              taskToEdit={taskToEdit}
              subjects={subjects}
              defaultSubjectId={defaultSubjectId}
              onClose={() => onOpenChange(false)}
              onSave={onSave}
              createTaskFn={createTaskFn}
              updateTaskFn={updateTaskFn}
            />
          )}
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
