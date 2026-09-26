import { AlertCircle, ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/services/study/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string; icon: typeof AlertCircle }
> = {
  LOW: {
    label: "Low",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400",
    icon: ArrowDown,
  },
  MEDIUM: {
    label: "Medium",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400",
    icon: Minus,
  },
  HIGH: {
    label: "High",
    className:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-400",
    icon: ArrowUp,
  },
  URGENT: {
    label: "Urgent",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 font-semibold",
    icon: AlertCircle,
  },
};

export function TaskPriorityBadge({
  priority,
  className,
  showIcon = true,
}: TaskPriorityBadgeProps) {
  const normalized = (priority?.toUpperCase() as TaskPriority) || "MEDIUM";
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tracking-wide",
        config.className,
        className,
      )}
    >
      {showIcon && <Icon className="size-3 shrink-0" aria-hidden="true" />}
      <span>{config.label}</span>
    </Badge>
  );
}
