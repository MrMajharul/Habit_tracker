export type SuggestionCategory =
  | "prayer"
  | "worship"
  | "study"
  | "habit"
  | "reflection";

export interface SuggestionItem {
  id: string;
  icon: string;
  category: SuggestionCategory;
  title: string;
  durationMinutes: number;
  actionUrl: string;
  actionLabel?: string;
}

export interface SmartSuggestion {
  id: string;
  contextTitle: string;
  contextSubtitle: string;
  urgency: "calm" | "gentle" | "opportunity";
  nextPrayerName?: string;
  remainingMinutes?: number;
  items: SuggestionItem[];
  reflectionPrompt?: string;
}

export interface SuggestionContext {
  currentTime?: Date;
  nextPrayerName?: string;
  nextPrayerTime?: Date;
  minutesUntilNextPrayer?: number;
  currentPrayerName?: string;
  uncompletedHabits?: string[];
  pendingTasks?: Array<{
    title: string;
    subject?: string;
    estimatedMinutes?: number;
  }>;
}

export interface SuggestionEngine {
  generateSuggestions(context: SuggestionContext): Promise<SmartSuggestion>;
}
