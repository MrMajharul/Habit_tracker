import type {
  SmartSuggestion,
  SuggestionContext,
  SuggestionEngine,
  SuggestionItem,
} from "./types";

export class RuleBasedSuggestionEngine implements SuggestionEngine {
  async generateSuggestions(
    context: SuggestionContext = {},
  ): Promise<SmartSuggestion> {
    const now = context.currentTime ?? new Date();
    const hour = now.getHours();
    const nextPrayer = context.nextPrayerName ?? "Asr";
    const minutesLeft =
      context.minutesUntilNextPrayer ??
      (context.nextPrayerTime
        ? Math.max(
            0,
            Math.floor((context.nextPrayerTime.getTime() - now.getTime()) / 60000),
          )
        : 45);

    // Find any uncompleted habit tied to the next prayer anchor
    const nextAnchorHabit = context.userHabits?.find(
      (h) =>
        !h.completed &&
        h.prayerAnchor?.toLowerCase() === nextPrayer.toLowerCase(),
    );

    const pendingTasks = context.pendingTasks ?? [];

    // Check for overdue or due-today tasks
    const todayStr = now.toISOString().slice(0, 10);
    const overdueTask = pendingTasks.find(
      (t) =>
        t.status !== "COMPLETED" &&
        t.status !== "completed" &&
        (t.isOverdue || (t.dueDate && t.dueDate < todayStr)),
    );
    const dueTodayTask = pendingTasks.find(
      (t) =>
        t.status !== "COMPLETED" &&
        t.status !== "completed" &&
        (t.isDueToday || (t.dueDate && t.dueDate.startsWith(todayStr))),
    );

    // Case 1: Night / Evening (After 9 PM or before 4 AM)
    if (hour >= 21 || hour < 4) {
      return {
        id: "evening-wind-down",
        type: "DAILY_PLAN",
        planLayer: "spiritual",
        contextTitle: "🌙 Evening Reflection & Rest",
        contextSubtitle:
          "Worship and study for today are resting. Prepare your heart for tomorrow.",
        urgency: "calm",
        items: [
          {
            id: "surah-mulk",
            icon: "📖",
            category: "worship",
            title: "Recite Surah Al-Mulk",
            durationMinutes: 10,
            actionUrl: "/quran",
            actionLabel: "Read",
            type: "POST_PRAYER_TASK",
          },
          {
            id: "night-reflection",
            icon: "🌙",
            category: "reflection",
            title: "Daily Self-Reflection",
            durationMinutes: 5,
            actionUrl: "#daily-reflection",
            actionLabel: "Reflect",
            type: "DAILY_PLAN",
          },
          {
            id: "sleep-adhkar",
            icon: "🤲",
            category: "worship",
            title: "Bedtime Adhkar & Tasbeeh",
            durationMinutes: 5,
            actionUrl: "/dhikr",
            actionLabel: "Dhikr",
            type: "POST_PRAYER_TASK",
          },
        ],
        reflectionPrompt:
          "What is one sincere deed you did today purely for Allah's sake?",
      };
    }

    // Case 2: Early Morning / Post-Fajr (4 AM - 8 AM)
    if (hour >= 4 && hour < 8) {
      const fajrHabit = context.userHabits?.find(
        (h) => !h.completed && h.prayerAnchor === "fajr",
      );

      const items: SuggestionItem[] = [
        {
          id: "morning-quran",
          icon: "📖",
          category: "worship",
          title: fajrHabit ? fajrHabit.name : "Qur'an Recitation (2 Juz/Pages)",
          durationMinutes: 20,
          actionUrl: "/quran",
          actionLabel: "Recite",
          type: "POST_PRAYER_TASK",
        },
        {
          id: "morning-adhkar",
          icon: "🤲",
          category: "worship",
          title: "Morning Adhkar",
          durationMinutes: 10,
          actionUrl: "/dhikr",
          actionLabel: "Adhkar",
          type: "POST_PRAYER_TASK",
        },
        {
          id: "plan-day",
          icon: "📚",
          category: "study",
          title: "Review Today's Study & Tasks",
          durationMinutes: 10,
          actionUrl: "/tasks",
          actionLabel: "Plan",
          type: "DAILY_PLAN",
        },
      ];

      return {
        id: "morning-barakah",
        type: "DAILY_PLAN",
        planLayer: "integrated",
        contextTitle: "🌅 Morning Barakah Routine",
        contextSubtitle:
          "The hours after Fajr hold blessed productivity. Fit in worship before worldly tasks.",
        urgency: "opportunity",
        items,
      };
    }

    // Case 3: Overdue task needing gentle attention (and plenty of time before prayer)
    if (overdueTask && minutesLeft > 35) {
      const duration = Math.min(25, minutesLeft - 10);
      return {
        id: `overdue-${overdueTask.id ?? "task"}`,
        type: "OVERDUE_TASK",
        planLayer: "productivity",
        contextTitle: `Gentle Reminder: ${overdueTask.title}`,
        contextSubtitle: `You have an unfinished task. A calm ${duration}-min session fits well before ${nextPrayer}.`,
        urgency: "opportunity",
        nextPrayerName: nextPrayer,
        remainingMinutes: minutesLeft,
        items: [
          {
            id: `focus-overdue-${overdueTask.id ?? "1"}`,
            icon: "⏱",
            category: "study",
            title: `${overdueTask.title} — ${duration} min`,
            durationMinutes: duration,
            actionUrl: `/focus?task=${encodeURIComponent(overdueTask.title)}`,
            actionLabel: "Start Focus",
            type: "FOCUS_SESSION",
          },
          {
            id: "short-dhikr",
            icon: "🤲",
            category: "worship",
            title: "Pre-prayer Istighfar — 5 min",
            durationMinutes: 5,
            actionUrl: "/dhikr",
            actionLabel: "Dhikr",
            type: "POST_PRAYER_TASK",
          },
        ],
      };
    }

    // Case 4: Task due today (Upcoming Deadline)
    if (dueTodayTask && minutesLeft >= 30) {
      const focusMins = Math.min(25, minutesLeft - 10);
      return {
        id: `due-today-${dueTodayTask.id ?? "task"}`,
        type: "UPCOMING_DEADLINE",
        planLayer: "productivity",
        contextTitle: `Due Today: ${dueTodayTask.title}`,
        contextSubtitle: `A focused ${focusMins}-minute session would fit comfortably before ${nextPrayer}.`,
        urgency: "opportunity",
        nextPrayerName: nextPrayer,
        remainingMinutes: minutesLeft,
        items: [
          {
            id: `focus-deadline-${dueTodayTask.id ?? "1"}`,
            icon: "⏱",
            category: "study",
            title: `${dueTodayTask.title} — ${focusMins} min`,
            durationMinutes: focusMins,
            actionUrl: `/focus?task=${encodeURIComponent(dueTodayTask.title)}`,
            actionLabel: "Focus",
            type: "FOCUS_SESSION",
          },
          {
            id: "prayer-prep",
            icon: "💧",
            category: "prayer",
            title: "Wudu & Prayer Preparation",
            durationMinutes: 5,
            actionUrl: "/prayer",
            actionLabel: "Prayer",
            type: "POST_PRAYER_TASK",
          },
        ],
      };
    }

    // Case 4.5: Post-Dhuhr Focus Block (12 PM - 3 PM with ample time before Asr)
    if (hour >= 12 && hour < 15 && minutesLeft >= 90) {
      const topTask = pendingTasks[0];
      const taskTitle = topTask?.title ?? "Machine Learning Study";
      return {
        id: "post-dhuhr-focus",
        type: "POST_PRAYER_TASK",
        planLayer: "integrated",
        contextTitle: "Post-Dhuhr Focus Block",
        contextSubtitle: `After Dhuhr, you have ${minutesLeft} minutes available. A balanced study sprint fits comfortably.`,
        urgency: "opportunity",
        nextPrayerName: nextPrayer,
        remainingMinutes: minutesLeft,
        items: [
          {
            id: "post-dhuhr-task",
            icon: "📚",
            category: "study",
            title: `${taskTitle} — 40 min`,
            durationMinutes: 40,
            actionUrl: `/focus?task=${encodeURIComponent(taskTitle)}`,
            actionLabel: "Start Focus",
            type: "TASK_RECOMMENDATION",
          },
          {
            id: "post-dhuhr-break",
            icon: "☕",
            category: "reflection",
            title: "Hydrate & Mindful Break — 10 min",
            durationMinutes: 10,
            actionUrl: "/focus",
            actionLabel: "Break",
            type: "STUDY_WINDOW",
          },
          {
            id: "post-dhuhr-secondary",
            icon: "🔬",
            category: "study",
            title: "Research & Writing — 30 min",
            durationMinutes: 30,
            actionUrl: "/focus?subject=Research",
            actionLabel: "Focus",
            type: "TASK_RECOMMENDATION",
          },
          {
            id: "post-dhuhr-dhikr",
            icon: "🤲",
            category: "worship",
            title: "Mid-day Dhikr & Tasbeeh — 5 min",
            durationMinutes: 5,
            actionUrl: "/dhikr",
            actionLabel: "Dhikr",
            type: "POST_PRAYER_TASK",
          },
        ],
      };
    }

    // Case 5: Approaching Prayer (< 25 minutes)
    if (minutesLeft < 25 && minutesLeft > 0) {
      return {
        id: `approaching-${nextPrayer.toLowerCase()}`,
        type: "POST_PRAYER_TASK",
        planLayer: "spiritual",
        contextTitle: `🕌 ${nextPrayer} is approaching in ${minutesLeft}m`,
        contextSubtitle:
          "Wind down active tasks, perform fresh Wudu, and prepare for prayer with presence of mind.",
        urgency: "gentle",
        nextPrayerName: nextPrayer,
        remainingMinutes: minutesLeft,
        items: [
          {
            id: "wudu-prep",
            icon: "💧",
            category: "prayer",
            title: "Perform Wudu & Sunnah Prep",
            durationMinutes: 5,
            actionUrl: "/prayer",
            actionLabel: "View",
            type: "POST_PRAYER_TASK",
          },
          {
            id: "istighfar",
            icon: "🤲",
            category: "worship",
            title: "Pre-Salah Istighfar & Dua",
            durationMinutes: 5,
            actionUrl: "/dhikr",
            actionLabel: "Dhikr",
            type: "POST_PRAYER_TASK",
          },
        ],
      };
    }

    // Case 6: Prayer window with 25-90 minutes remaining (e.g. before Asr or Dhuhr)
    if (minutesLeft >= 25) {
      const topTask = pendingTasks[0];
      const taskTitle = topTask?.title ?? "Compiler Design Study";
      const studyDuration = Math.min(30, Math.max(15, minutesLeft - 15));
      const breakDuration = Math.max(5, Math.min(15, minutesLeft - studyDuration - 10));

      const items: SuggestionItem[] = [
        {
          id: "study-sprint",
          icon: "📚",
          category: "study",
          title: `${taskTitle} — ${studyDuration} min`,
          durationMinutes: studyDuration,
          actionUrl: `/focus?task=${encodeURIComponent(taskTitle)}`,
          actionLabel: "Focus",
          type: "TASK_RECOMMENDATION",
        },
        {
          id: "quran-window",
          icon: "📖",
          category: "worship",
          title: nextAnchorHabit ? nextAnchorHabit.name : "Dhikr & Tasbeeh — 5 min",
          durationMinutes: 5,
          actionUrl: "/dhikr",
          actionLabel: "Dhikr",
          type: "POST_PRAYER_TASK",
        },
        {
          id: "break-window",
          icon: "☕",
          category: "reflection",
          title: `Rest & Transition Break — ${breakDuration} min`,
          durationMinutes: breakDuration,
          actionUrl: "/focus",
          actionLabel: "Break",
          type: "STUDY_WINDOW",
        },
      ];

      return {
        id: `window-before-${nextPrayer.toLowerCase()}`,
        type: "STUDY_WINDOW",
        planLayer: "integrated",
        contextTitle: `You have ${minutesLeft} minutes before ${nextPrayer}.`,
        contextSubtitle:
          "A balanced window to pair productive work with gentle worship and a break.",
        urgency: "gentle",
        nextPrayerName: nextPrayer,
        remainingMinutes: minutesLeft,
        items,
      };
    }

    // Default Mid-day Focus
    return {
      id: "midday-focus",
      type: "DAILY_PLAN",
      planLayer: "integrated",
      contextTitle: "⚡ Afternoon Deep Work Window",
      contextSubtitle:
        "Align your study and habit goals with calm focus.",
      urgency: "opportunity",
      items: [
        {
          id: "focus-block",
          icon: "⏱",
          category: "study",
          title: "25-Minute Focus Block (Pomodoro)",
          durationMinutes: 25,
          actionUrl: "/focus",
          actionLabel: "Start",
          type: "FOCUS_SESSION",
        },
        {
          id: "habit-check",
          icon: "✅",
          category: "habit",
          title: "Complete Afternoon Habits",
          durationMinutes: 10,
          actionUrl: "/habits",
          actionLabel: "Check",
          type: "DAILY_PLAN",
        },
      ],
    };
  }
}

// Singleton suggestion engine instance
export const suggestionEngine: SuggestionEngine = new RuleBasedSuggestionEngine();
