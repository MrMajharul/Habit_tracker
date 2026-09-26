import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/services/study/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  TODO: {
    label: "To Do",
    className: "border-border/60 bg-muted/50 text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "border-primary/30 bg-primary/10 text-primary dark:bg-primary/20",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "border-emerald/30 bg-emerald/10 text-emerald dark:bg-emerald/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-border/40 bg-muted/30 text-muted-foreground/60 line-through",
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const normalized = (status?.toUpperCase() as TaskStatus) || "TODO";
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.TODO;

  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium tracking-wide", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
