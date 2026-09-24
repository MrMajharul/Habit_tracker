import {
  BookMarked,
  BookOpen,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { DashboardHabit } from "@/types";

const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "heart-handshake": HeartHandshake,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-marked": BookMarked,
};

interface TodaysHabitsProps {
  habits: DashboardHabit[];
  isMockData?: boolean;
}

export function TodaysHabits({ habits, isMockData }: TodaysHabitsProps) {
  const completed = habits.filter((h) => h.completed).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Today&apos;s Habits</CardTitle>
        <div className="flex items-center gap-2">
          {isMockData ? (
            <Badge variant="secondary" className="text-[10px]">
              Mock data
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {completed}/{habits.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No habits for today. Create your first habit to start building
            consistency.
          </p>
        ) : (
          <ul className="space-y-2">
            {habits.map((habit) => {
              const Icon = ICON_MAP[habit.icon] ?? BookOpen;

              return (
                <li
                  key={habit.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
                >
                  <Checkbox checked={habit.completed} disabled aria-label={habit.name} />
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        habit.completed ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {habit.name}
                    </p>
                    {habit.target ? (
                      <p className="text-xs text-muted-foreground">{habit.target}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
