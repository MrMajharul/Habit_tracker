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
import { cn } from "@/lib/utils";
import type { Subject } from "@/services/study/types";
import { SUBJECT_ICON_MAP } from "./subject-card";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectToEdit?: Subject | null;
  onSave: (subject: Subject) => void;
  createSubjectFn: (params: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    weeklyTargetMinutes?: number;
  }) => Promise<Subject>;
  updateSubjectFn: (
    id: string,
    updates: Partial<Subject>,
  ) => Promise<Subject | null>;
}

const PALETTE = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#f97316", // orange
];

const AVAILABLE_ICONS = [
  "book-open",
  "cpu",
  "code",
  "laptop",
  "microscope",
  "briefcase",
  "graduation-cap",
  "layers",
];

function SubjectFormContent({
  subjectToEdit,
  onClose,
  onSave,
  createSubjectFn,
  updateSubjectFn,
}: {
  subjectToEdit?: Subject | null;
  onClose: () => void;
  onSave: (subject: Subject) => void;
  createSubjectFn: SubjectDialogProps["createSubjectFn"];
  updateSubjectFn: SubjectDialogProps["updateSubjectFn"];
}) {
  const [name, setName] = useState(subjectToEdit?.name ?? "");
  const [description, setDescription] = useState(subjectToEdit?.description ?? "");
  const [color, setColor] = useState(subjectToEdit?.color ?? PALETTE[0]!);
  const [icon, setIcon] = useState(subjectToEdit?.icon ?? AVAILABLE_ICONS[0]!);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState(
    subjectToEdit?.weeklyTargetMinutes ?? 180,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (subjectToEdit) {
        const updated = await updateSubjectFn(subjectToEdit.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon,
          weeklyTargetMinutes: Number(weeklyTargetMinutes) || 120,
        });
        if (updated) {
          onSave(updated);
          toast.success("Subject updated");
        }
      } else {
        const created = await createSubjectFn({
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon,
          weeklyTargetMinutes: Number(weeklyTargetMinutes) || 120,
        });
        onSave(created);
        toast.success(`Subject created: "${created.name}"`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {subjectToEdit ? "Edit Subject" : "Create Subject / Work Area"}
        </DialogTitle>
        <DialogDescription>
          {subjectToEdit
            ? "Update subject settings and weekly target."
            : "Create a work or study area to categorize tasks and focus sessions."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="subject-name">Subject Name *</Label>
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Machine Learning, Compiler, Freelance"
            required
            className="w-full"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="subject-description">Description (optional)</Label>
          <Input
            id="subject-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you focus on in this area…"
            className="w-full"
          />
        </div>

        {/* Weekly Target Minutes */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="subject-target">Weekly Target (Minutes)</Label>
            <span className="text-xs font-semibold text-primary">
              {Math.floor(weeklyTargetMinutes / 60)}h{" "}
              {weeklyTargetMinutes % 60 > 0 ? `${weeklyTargetMinutes % 60}m` : ""}
            </span>
          </div>
          <Input
            id="subject-target"
            type="number"
            min={30}
            max={3000}
            step={30}
            value={weeklyTargetMinutes}
            onChange={(e) => setWeeklyTargetMinutes(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Icon Picker */}
        <div className="space-y-1.5">
          <Label>Select Icon</Label>
          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_ICONS.map((ic) => {
              const Icon = SUBJECT_ICON_MAP[ic] || AVAILABLE_ICONS[0]!;
              const isSelected = icon === ic;
              return (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    "flex items-center justify-center p-2.5 rounded-xl border transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border/60 hover:bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-1.5">
          <Label>Accent Color</Label>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {PALETTE.map((c) => {
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    isSelected
                      ? "border-foreground ring-2 ring-primary/40 scale-105"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>
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
          <Button type="submit" disabled={!name.trim() || isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : subjectToEdit
                ? "Update Subject"
                : "Create Subject"}
          </Button>
        </div>
      </form>
    </>
  );
}

export function SubjectDialog({
  open,
  onOpenChange,
  subjectToEdit,
  onSave,
  createSubjectFn,
  updateSubjectFn,
}: SubjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogContent>
          {open && (
            <SubjectFormContent
              key={subjectToEdit?.id ?? "new-subject"}
              subjectToEdit={subjectToEdit}
              onClose={() => onOpenChange(false)}
              onSave={onSave}
              createSubjectFn={createSubjectFn}
              updateSubjectFn={updateSubjectFn}
            />
          )}
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
