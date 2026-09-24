import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTask, TaskPriority } from "@/types";

const PRIORITY_VARIANT: Record<
  TaskPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "destructive",
};

const STATUS_LABEL = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Done",
} as const;

interface TodaysTasksProps {
  tasks: DashboardTask[];
  isMockData?: boolean;
}

export function TodaysTasks({ tasks, isMockData }: TodaysTasksProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
        {isMockData ? (
          <Badge variant="secondary" className="text-[10px]">
            Mock data
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tasks scheduled for today. Plan your study and work around
            prayer times.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div className="min-w-0 space-y-1">
                  <p
                    className={`text-sm font-medium ${
                      task.status === "completed"
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {task.subject ? <span>{task.subject}</span> : null}
                    {task.estimatedMinutes ? (
                      <span>{task.estimatedMinutes} min</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={PRIORITY_VARIANT[task.priority]} className="text-[10px]">
                    {task.priority}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
