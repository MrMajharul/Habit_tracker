export type SuggestionCategory =
  | "prayer"
  | "worship"
  | "study"
  | "habit"
  | "reflection"
  | "quran";

export type SuggestionType =
  | "DEFAULT"
  | "TASK_RECOMMENDATION"
  | "STUDY_WINDOW"
  | "FOCUS_SESSION"
  | "UPCOMING_DEADLINE"
  | "OVERDUE_TASK"
  | "POST_PRAYER_TASK"
  | "DAILY_PLAN"
  | "QURAN_READING"
  | "QURAN_TARGET"
  | "QURAN_CONTINUE"
  | "POST_FAJR_QURAN"
  | "POST_MAGHRIB_QURAN";

export interface SuggestionItem {
  id: string;
  icon: string;
  category: SuggestionCategory;
  title: string;
  durationMinutes: number;
  actionUrl: string;
  actionLabel?: string;
  type?: SuggestionType;
}

export interface SmartSuggestion {
  id: string;
  type?: SuggestionType;
  contextTitle: string;
  contextSubtitle: string;
  urgency: "calm" | "gentle" | "opportunity";
  nextPrayerName?: string;
  remainingMinutes?: number;
  items: SuggestionItem[];
  reflectionPrompt?: string;
  planLayer?: "spiritual" | "personal" | "productivity" | "integrated";
}

export interface SuggestionContext {
  currentTime?: Date;
  nextPrayerName?: string;
  nextPrayerTime?: Date;
  minutesUntilNextPrayer?: number;
  currentPrayerName?: string;
  uncompletedHabits?: string[];
  userHabits?: Array<{
    name: string;
    prayerAnchor?: string;
    completed?: boolean;
    icon?: string;
  }>;
  pendingTasks?: Array<{
    id?: string;
    title: string;
    subject?: string;
    estimatedMinutes?: number;
    dueDate?: string | null;
    status?: string;
    priority?: string;
    isOverdue?: boolean;
    isDueToday?: boolean;
  }>;
  focusMinutesToday?: number;
  completedSessionsToday?: number;
  // Phase 4: Qur'an context
  quranMinutesToday?: number;
  quranAyahsToday?: number;
  quranTargetMet?: boolean;
  quranTargetType?: "minutes" | "ayahs";
  quranTargetValue?: number;
  quranLastSurah?: string;
  quranLastAyah?: number;
}

export interface SuggestionEngine {
  generateSuggestions(context: SuggestionContext): Promise<SmartSuggestion>;
}
