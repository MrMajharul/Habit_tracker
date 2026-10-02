import type { AnalyticsSummary, PersonalInsight } from "./analytics-types";
import { formatMinutes } from "./analytics-period";

const FORBIDDEN = [
  "better muslim",
  "bad muslim",
  "spiritually weak",
  "you are lazy",
  "you failed",
  "worship score",
  "prayer score",
  "dhikr score",
  "religious worth",
];

function insight(id: string, text: string): PersonalInsight {
  return { id, text };
}

export function generatePersonalInsights(summary: AnalyticsSummary): PersonalInsight[] {
  const insights: PersonalInsight[] = [];
  const { range, focus, quran, habits, tasks, dhikr, prayer } = summary;

  // 1. Focus duration & session insights
  if (focus.completedSessions > 0) {
    insights.push(
      insight(
        "focus-sessions",
        `You completed ${focus.completedSessions} focus session${focus.completedSessions === 1 ? "" : "s"} in this period (${formatMinutes(focus.totalMinutes)} total).`,
      ),
    );

    const avgMinutes = Math.round(focus.totalMinutes / focus.completedSessions);
    if (avgMinutes > 0) {
      insights.push(
        insight(
          "focus-avg",
          `Your average focus session duration was ${avgMinutes} minutes.`,
        ),
      );
    }
  }

  // 2. Longest focus day
  if (focus.byDay.length > 0 && focus.totalMinutes > 0) {
    const sorted = [...focus.byDay].sort((a, b) => b.value - a.value);
    const top = sorted.filter((p) => p.value === sorted[0]?.value && p.value > 0).slice(0, 2);
    if (top.length > 0) {
      insights.push(
        insight(
          "focus-days",
          top.length === 1
            ? `Your longest focus time was on ${top[0].label} (${formatMinutes(top[0].value)}).`
            : `Your longest focus sessions were on ${top[0].label} and ${top[1].label}.`,
        ),
      );
    }
  }

  // 3. Subject focus distribution
  if (focus.bySubject[0] && focus.bySubject[0].minutes > 0) {
    insights.push(
      insight(
        "focus-subject",
        `Most of your completed focus time this period was dedicated to ${focus.bySubject[0].name} (${formatMinutes(focus.bySubject[0].minutes)}).`,
      ),
    );
  }

  // 4. Qur'an reading consistency
  if (quran.readingDays > 0) {
    insights.push(
      insight(
        "quran-days",
        `You read Qur'an on ${quran.readingDays} of the ${quran.possibleDays} day${quran.possibleDays === 1 ? "" : "s"} in this range.`,
      ),
    );
  }

  if (quran.minutesRead > 0) {
    insights.push(
      insight(
        "quran-minutes",
        `Qur'an reading totaled ${formatMinutes(quran.minutesRead)} across ${quran.ayahsRead} ayahs.`,
      ),
    );
  }

  // 5. Habit completion rate & top consistency
  if (habits.habits.length > 0) {
    insights.push(
      insight(
        "habit-rate",
        `You completed ${habits.completionRate}% of your habit targets in this period.`,
      ),
    );

    const sortedHabits = [...habits.habits].sort(
      (a, b) => b.completionRate - a.completionRate,
    );
    const topHabit = sortedHabits[0];
    if (topHabit && topHabit.completionRate > 0) {
      insights.push(
        insight(
          "habit-top",
          `"${topHabit.name}" had your highest habit consistency at ${topHabit.completionRate}%.`,
        ),
      );
    }
  }

  // 6. Task progress
  if (tasks.completed > 0) {
    insights.push(
      insight(
        "tasks-completed",
        `You completed ${tasks.completed} task${tasks.completed === 1 ? "" : "s"} in this period.`,
      ),
    );
  }

  if (tasks.overdue > 0) {
    insights.push(
      insight(
        "tasks-overdue",
        `You have ${tasks.overdue} overdue task${tasks.overdue === 1 ? "" : "s"} that may need rescheduling.`,
      ),
    );
  } else if (tasks.completed > 0 && tasks.completionRate === 100) {
    insights.push(
      insight(
        "tasks-all-done",
        "All planned tasks in this period were completed.",
      ),
    );
  }

  // 7. Dhikr activity
  if (dhikr.completedSessions > 0) {
    insights.push(
      insight(
        "dhikr-activity",
        `Dhikr activity includes ${dhikr.completedSessions} completed session${dhikr.completedSessions === 1 ? "" : "s"} and ${dhikr.totalCounts.toLocaleString()} counted repetitions.`,
      ),
    );
  }

  // 8. Prayer logging completeness (purely factual logging records, no scoring)
  if (prayer.completed > 0) {
    insights.push(
      insight(
        "prayer-activity",
        `Salah log: ${prayer.completed} of ${prayer.possible} prayer slots recorded in this range.`,
      ),
    );
  }

  // 9. Empty state
  if (insights.length === 0) {
    insights.push(
      insight(
        "empty",
        `No activity recorded for ${range.startDate} to ${range.endDate} yet.`,
      ),
    );
  }

  // Safety filter to guarantee no forbidden phrases
  return insights.filter((item) => {
    const lower = item.text.toLowerCase();
    return !FORBIDDEN.some((phrase) => lower.includes(phrase));
  });
}

export const INSIGHT_FORBIDDEN_PHRASES = FORBIDDEN;
