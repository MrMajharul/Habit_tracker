// ============================================================================
// Qur'an Types — Phase 4
// ============================================================================

// ─── Content Types (from provider) ──────────────────────────────────────────

export type RevelationType = "meccan" | "medinan";

export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  arabicName: string;
  ayahCount: number;
  revelationType: RevelationType;
  juz: number[];
}

export interface Ayah {
  number: number;        // ayah number within the surah
  numberInQuran: number; // global ayah number (1–6236)
  text: string;          // Arabic text from verified source
  juz: number;
  page: number;
}

export interface AyahWithTranslation extends Ayah {
  translation?: string;
  translationEdition?: string;
}

export interface JuzInfo {
  number: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

// ─── Provider interface ─────────────────────────────────────────────────────

export interface QuranContentProvider {
  listSurahs(): Promise<SurahInfo[]>;
  getSurah(surahNumber: number): Promise<SurahInfo | null>;
  getAyahs(surahNumber: number): Promise<AyahWithTranslation[]>;
  getJuzInfo?(juzNumber: number): Promise<JuzInfo | null>;
  searchContent?(query: string): Promise<AyahWithTranslation[]>;
  getProviderName(): string;
}

// ─── User Progress Types ────────────────────────────────────────────────────

export interface QuranReadingSession {
  id: string;
  userId: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  minutesRead: number;
  readingDate: string;
  note?: string;
  createdAt: string;
}

export interface QuranBookmark {
  id: string;
  userId: string;
  surahNumber: number;
  ayahNumber: number;
  note?: string;
  createdAt: string;
}

export type QuranTargetType = "minutes" | "ayahs";

export interface QuranGoalSettings {
  id: string;
  userId: string;
  targetType: QuranTargetType;
  targetValue: number;
  isEnabled: boolean;
  prayerAnchor: string;
  createdAt: string;
  updatedAt: string;
}

export type SpiritualGoalType =
  | "quran"
  | "prayer"
  | "dhikr"
  | "fasting"
  | "charity"
  | "custom";

export interface SpiritualGoal {
  id: string;
  userId: string;
  type: SpiritualGoalType;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Progress / Analytics ───────────────────────────────────────────────────

export interface QuranDailyProgress {
  minutesRead: number;
  ayahsRead: number;
  sessionsCount: number;
  targetMet: boolean;
}

export interface QuranWeeklyProgress {
  minutesRead: number;
  ayahsRead: number;
  sessionsCount: number;
  daysRead: number;
}

export interface QuranStreakInfo {
  currentStreak: number;
  longestStreak: number;
  daysReadThisWeek: number;
  daysReadThisMonth: number;
}

export interface QuranReadingPosition {
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  updatedAt: string;
}

export interface QuranProgressSummary {
  daily: QuranDailyProgress;
  weekly: QuranWeeklyProgress;
  streak: QuranStreakInfo;
  totalSessions: number;
  totalMinutes: number;
  totalAyahsRead: number;
  lastPosition?: QuranReadingPosition;
}
