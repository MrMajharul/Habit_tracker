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

  if (focus.completedSessions > 0) {
    insights.push(
      insight(
        "focus-sessions",
        `You completed ${focus.completedSessions} focus session${focus.completedSessions === 1 ? "" : "s"} in this period.`,
      ),
    );
  }

  if (focus.byDay.length > 0 && focus.totalMinutes > 0) {
    const sorted = [...focus.byDay].sort((a, b) => b.value - a.value);
    const top = sorted.filter((p) => p.value === sorted[0]?.value && p.value > 0).slice(0, 2);
    if (top.length > 0) {
      insights.push(
        insight(
          "focus-days",
          top.length === 1
            ? `Your longest focus time was on ${top[0].label}.`
            : `Your longest focus sessions were on ${top[0].label} and ${top[1].label}.`,
        ),
      );
    }
  }

  if (focus.bySubject[0] && focus.bySubject[0].minutes > 0) {
    insights.push(
      insight(
        "focus-subject",
        `Most of your completed focus time this period was spent on ${focus.bySubject[0].name} (${formatMinutes(focus.bySubject[0].minutes)}).`,
      ),
    );
  }

  if (quran.possibleDays > 0) {
    insights.push(
      insight(
        "quran-days",
        `You read Qur'an on ${quran.readingDays} of the last ${quran.possibleDays} day${quran.possibleDays === 1 ? "" : "s"} in this range.`,
      ),
    );
  }

  if (quran.minutesRead > 0) {
    insights.push(
      insight("quran-minutes", `Qur'an reading totaled ${formatMinutes(quran.minutesRead)} (${quran.ayahsRead} ayahs).`),
    );
  }

  if (habits.habits.length > 0) {
    insights.push(
      insight(
        "habit-rate",
        `You completed ${habits.completionRate}% of your habit targets in this period.`,
      ),
    );
  }

  if (tasks.completed > 0) {
    insights.push(
      insight("tasks-completed", `You completed ${tasks.completed} task${tasks.completed === 1 ? "" : "s"} in this period.`),
    );
  }

  if (dhikr.completedSessions > 0) {
    insights.push(
      insight(
        "dhikr-activity",
        `Dhikr activity includes ${dhikr.completedSessions} completed session${dhikr.completedSessions === 1 ? "" : "s"} and ${dhikr.totalCounts} counted repetitions.`,
      ),
    );
  }

  if (prayer.possible > 0) {
    insights.push(
      insight(
        "prayer-activity",
        `Prayer activity: ${prayer.completed} of ${prayer.possible} logged completions in this range.`,
      ),
    );
  }

  if (insights.length === 0) {
    insights.push(
      insight(
        "empty",
        `No activity is recorded for ${range.startDate} to ${range.endDate} yet.`,
      ),
    );
  }

  return insights.filter((item) => {
    const lower = item.text.toLowerCase();
    return !FORBIDDEN.some((phrase) => lower.includes(phrase));
  });
}

export const INSIGHT_FORBIDDEN_PHRASES = FORBIDDEN;
