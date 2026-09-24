import { CheckSquare, Clock, Sparkles, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProgressOverview as ProgressData } from "@/types";

interface ProgressOverviewProps {
  progress: ProgressData;
}

function pct(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function ProgressOverview({ progress }: ProgressOverviewProps) {
  const items = [
    {
      label: "Prayers",
      icon: Sparkles,
      completed: progress.prayersCompleted,
      total: progress.prayersTotal,
      color: "text-emerald",
    },
    {
      label: "Habits",
      icon: CheckSquare,
      completed: progress.habitsCompleted,
      total: progress.habitsTotal,
      color: "text-primary",
    },
    {
      label: "Tasks",
      icon: Target,
      completed: progress.tasksCompleted,
      total: progress.tasksTotal,
      color: "text-gold",
    },
    {
      label: "Focus",
      icon: Clock,
      completed: progress.focusMinutesToday,
      total: 120,
      color: "text-muted-foreground",
      suffix: "min",
      isMinutes: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          const value = item.isMinutes
            ? Math.min(100, (item.completed / item.total) * 100)
            : pct(item.completed, item.total);

          return (
            <div key={item.label} className="space-y-2 rounded-xl border border-border/70 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {item.isMinutes
                    ? `${item.completed} ${item.suffix}`
                    : `${item.completed}/${item.total}`}
                </span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
