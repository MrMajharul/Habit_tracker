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

    // Case 1: Night / Evening (After 9 PM or after Isha)
    if (hour >= 21 || hour < 4) {
      return {
        id: "evening-wind-down",
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
          },
          {
            id: "night-reflection",
            icon: "🌙",
            category: "reflection",
            title: "Daily Self-Reflection",
            durationMinutes: 5,
            actionUrl: "#daily-reflection",
            actionLabel: "Reflect",
          },
          {
            id: "sleep-adhkar",
            icon: "🤲",
            category: "worship",
            title: "Bedtime Adhkar & Tasbeeh",
            durationMinutes: 5,
            actionUrl: "/dhikr",
            actionLabel: "Dhikr",
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
        },
        {
          id: "morning-adhkar",
          icon: "🤲",
          category: "worship",
          title: "Morning Adhkar",
          durationMinutes: 10,
          actionUrl: "/dhikr",
          actionLabel: "Adhkar",
        },
        {
          id: "plan-day",
          icon: "📚",
          category: "study",
          title: "Review Today's Study & Tasks",
          durationMinutes: 10,
          actionUrl: "/study",
          actionLabel: "Plan",
        },
      ];

      return {
        id: "morning-barakah",
        contextTitle: "🌅 Morning Barakah Routine",
        contextSubtitle:
          "The hours after Fajr hold blessed productivity. Fit in worship before worldly tasks.",
        urgency: "opportunity",
        items,
      };
    }

    // Case 3: Prayer window with 30-65 minutes remaining (e.g. before Asr or Dhuhr)
    if (minutesLeft >= 25 && minutesLeft <= 75) {
      const topTask = context.pendingTasks?.[0];
      const taskTitle = topTask?.title ?? "Compiler Design Study";
      const studyDuration = Math.min(30, Math.max(15, minutesLeft - 15));

      const items: SuggestionItem[] = [
        {
          id: "study-sprint",
          icon: "📚",
          category: "study",
          title: `${taskTitle} — ${studyDuration} min`,
          durationMinutes: studyDuration,
          actionUrl: "/focus",
          actionLabel: "Focus",
        },
        {
          id: "quran-window",
          icon: "📖",
          category: "worship",
          title: nextAnchorHabit ? nextAnchorHabit.name : "Qur'an — 10 min",
          durationMinutes: 10,
          actionUrl: "/quran",
          actionLabel: "Read",
        },
        {
          id: "dhikr-prep",
          icon: "🤲",
          category: "worship",
          title: "Dhikr & Wudu Prep — 5 min",
          durationMinutes: 5,
          actionUrl: "/dhikr",
          actionLabel: "Dhikr",
        },
      ];

      return {
        id: `window-before-${nextPrayer.toLowerCase()}`,
        contextTitle: `You have ${minutesLeft} minutes before ${nextPrayer}.`,
        contextSubtitle:
          "A balanced window to pair productive work with gentle worship.",
        urgency: "gentle",
        nextPrayerName: nextPrayer,
        remainingMinutes: minutesLeft,
        items,
      };
    }

    // Case 4: Approaching Prayer (< 25 minutes)
    if (minutesLeft < 25 && minutesLeft > 0) {
      return {
        id: `approaching-${nextPrayer.toLowerCase()}`,
        contextTitle: `🕌 ${nextPrayer} is approaching in ${minutesLeft}m`,
        contextSubtitle:
          "Wind down active tasks, perform fresh Wudu, and prepare for congregational prayer.",
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
          },
          {
            id: "istighfar",
            icon: "🤲",
            category: "worship",
            title: "Pre-Salah Istighfar & Dua",
            durationMinutes: 5,
            actionUrl: "/dhikr",
            actionLabel: "Dhikr",
          },
        ],
      };
    }

    // Default Mid-day Focus
    return {
      id: "midday-focus",
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
        },
        {
          id: "habit-check",
          icon: "✅",
          category: "habit",
          title: "Complete Afternoon Habits",
          durationMinutes: 10,
          actionUrl: "/habits",
          actionLabel: "Check",
        },
      ],
    };
  }
}

// Singleton suggestion engine instance
export const suggestionEngine: SuggestionEngine = new RuleBasedSuggestionEngine();
