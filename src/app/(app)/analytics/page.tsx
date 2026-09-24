import { BarChart3, BookOpen, Calendar, CheckSquare, Clock, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Analytics" };

// Mock analytics data — real data from Supabase in Phase 5
const HABIT_STATS = [
  { name: "Morning Qur'an", completionRate: 92, streak: 7 },
  { name: "Morning Adhkar", completionRate: 98, streak: 12 },
  { name: "Exercise", completionRate: 65, streak: 3 },
  { name: "Study Session", completionRate: 78, streak: 5 },
  { name: "Read Book", completionRate: 45, streak: 1 },
];

const WEEKLY_PRAYER_DATA = [
  { day: "Mon", completed: 5 },
  { day: "Tue", completed: 4 },
  { day: "Wed", completed: 5 },
  { day: "Thu", completed: 3 },
  { day: "Fri", completed: 5 },
  { day: "Sat", completed: 4 },
  { day: "Sun", completed: 2 },
];

const STUDY_SUBJECTS = [
  { subject: "Machine Learning", minutes: 180, color: "bg-emerald" },
  { subject: "Compiler Design", minutes: 90, color: "bg-blue-500" },
  { subject: "Database Systems", minutes: 120, color: "bg-purple-500" },
  { subject: "Programming", minutes: 60, color: "bg-orange-500" },
];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={`rounded-xl p-2 ${color}`}>
            <Icon className="size-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const totalStudyMinutes = STUDY_SUBJECTS.reduce((sum, s) => sum + s.minutes, 0);
  const maxStudyMinutes = Math.max(...STUDY_SUBJECTS.map((s) => s.minutes));
  const avgPrayer = (WEEKLY_PRAYER_DATA.reduce((sum, d) => sum + d.completed, 0) / 7).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal progress — private and meaningful.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Sparkles} label="Avg prayers/day" value={avgPrayer} sub="This week" color="bg-emerald" />
        <StatCard icon={CheckSquare} label="Habit completion" value="75%" sub="7-day average" color="bg-primary" />
        <StatCard icon={Clock} label="Study time" value={`${Math.round(totalStudyMinutes / 60)}h`} sub="This week" color="bg-blue-500" />
        <StatCard icon={BookOpen} label="Qur'an pages" value="84" sub="This week" color="bg-gold" />
      </div>

      {/* Prayer completion — week view */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-emerald" />
            Prayer Completion — This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-1">
            {WEEKLY_PRAYER_DATA.map(({ day, completed }) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium">{completed}/5</span>
                <div className="flex w-full flex-col-reverse gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 w-full rounded-sm transition-colors ${
                        i < completed ? "bg-emerald" : "bg-muted/60"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Habit Completion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="size-4 text-primary" />
            Habit Completion (30-day)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {HABIT_STATS.map((h) => (
            <div key={h.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{h.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gold">🔥 {h.streak}d</span>
                  <span className="tabular-nums text-muted-foreground">{h.completionRate}%</span>
                </div>
              </div>
              <Progress value={h.completionRate} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Study Time by Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-blue-500" />
            Study Time by Subject — This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {STUDY_SUBJECTS.map((s) => (
            <div key={s.subject} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.subject}</span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.floor(s.minutes / 60)}h {s.minutes % 60}m
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                <div
                  className={`h-full rounded-full ${s.color} transition-all`}
                  style={{ width: `${(s.minutes / maxStudyMinutes) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="pt-1 text-right text-xs text-muted-foreground">
            Total: {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
          </p>
        </CardContent>
      </Card>

      {/* Calendar heatmap placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-muted-foreground" />
            Activity Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const seedLevels = [0.9, 0.4, 0.7, 0.2, 0.85, 0.6, 0.3, 0.95, 0.5, 0.8, 0.1, 0.75, 0.9, 0.4];
              const activity = seedLevels[i % seedLevels.length];
              return (
                <div
                  key={i}
                  title={`Day ${i + 1}`}
                  className={`aspect-square rounded-sm transition-colors ${
                    activity > 0.8
                      ? "bg-emerald"
                      : activity > 0.5
                        ? "bg-emerald/50"
                        : activity > 0.2
                          ? "bg-emerald/20"
                          : "bg-muted/40"
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            {["bg-muted/40", "bg-emerald/20", "bg-emerald/50", "bg-emerald"].map((c) => (
              <div key={c} className={`size-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
