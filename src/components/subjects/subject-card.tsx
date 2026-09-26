"use client";

import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Code,
  Cpu,
  GraduationCap,
  Laptop,
  Layers,
  Microscope,
  MoreVertical,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Subject } from "@/services/study/types";

export const SUBJECT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "book-open": BookOpen,
  cpu: Cpu,
  code: Code,
  laptop: Laptop,
  microscope: Microscope,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  layers: Layers,
  sparkles: Sparkles,
};

interface SubjectCardProps {
  subject: Subject;
  onClick: (subject: Subject) => void;
  onEdit?: (subject: Subject) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  onDelete?: (id: string) => void;
}

export function SubjectCard({
  subject,
  onClick,
  onEdit,
  onArchive,
  onDelete,
}: SubjectCardProps) {
  const IconComponent = SUBJECT_ICON_MAP[subject.icon] || BookOpen;
  const completedMinutes = subject.completedMinutes ?? 0;
  const targetMinutes = subject.weeklyTargetMinutes || 120;
  const progressPercent = Math.min(
    100,
    Math.round((completedMinutes / targetMinutes) * 100),
  );
  const activeTasks = subject.activeTaskCount ?? 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/40",
        subject.isArchived && "opacity-60 grayscale",
      )}
    >
      {/* Top accent bar with subject's unique color */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: subject.color || "#10b981" }}
      />

      <CardContent className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div
            onClick={() => onClick(subject)}
            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
          >
            <div
              className="flex size-10.5 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${subject.color || "#10b981"}18`,
                color: subject.color || "#10b981",
              }}
            >
              <IconComponent className="size-5" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {subject.description}
                </p>
              )}
            </div>
          </div>

          {/* Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-8 rounded-lg text-muted-foreground hover:text-foreground",
              )}
              aria-label={`Options for ${subject.name}`}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onClick(subject)}>
                View Details
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(subject)}>
                  Edit Subject
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem
                  onClick={() => onArchive(subject.id, !subject.isArchived)}
                >
                  {subject.isArchived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(subject.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Weekly Target Progress */}
        <div className="space-y-1.5" onClick={() => onClick(subject)}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>Weekly Target</span>
            </span>
            <span className="font-medium text-foreground">
              {completedMinutes} / {targetMinutes} min
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: subject.color || "#10b981",
              }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>{progressPercent}% completed</span>
            {progressPercent >= 100 && (
              <span className="flex items-center gap-0.5 text-emerald font-semibold">
                <CheckCircle2 className="size-3" /> Done
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: Active tasks count and Focus button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => onClick(subject)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            {activeTasks} {activeTasks === 1 ? "active task" : "active tasks"}
          </button>

          <Link
            href={`/focus?subjectId=${subject.id}&subject=${encodeURIComponent(subject.name)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-7.5 gap-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg px-2.5",
            )}
          >
            <Play className="size-3 fill-current" />
            <span>Focus</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
