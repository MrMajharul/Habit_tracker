export const PRAYER_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export type AnalyticsPeriodPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_30_days"
  | "custom";

export type HeatmapFilter = "all" | "quran" | "habits" | "focus" | "reflections";

export type ExportCategory =
  | "prayer"
  | "habits"
  | "tasks"
  | "focus"
  | "quran"
  | "dhikr"
  | "goals"
  | "reflections"
  | "summaries";

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  preset: AnalyticsPeriodPreset;
  timezone: string;
  today: string;
  dayCount: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  value: number;
}

export interface SubjectAnalytics {
  subjectId: string;
  name: string;
  minutes: number;
  color: string;
  weeklyTargetMinutes: number;
}

export interface PrayerPerName {
  prayer: PrayerName;
  completed: number;
  possible: number;
}

export interface PrayerAnalytics {
  completed: number;
  possible: number;
  completionRate: number;
  dailyCompletion: TrendPoint[];
  weeklyTrend: TrendPoint[];
  perPrayer: PrayerPerName[];
}

export interface HabitByHabitAnalytics {
  habitId: string;
  name: string;
  completedDays: number;
  possibleDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  isActive: boolean;
}

export interface HabitAnalytics {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  completedLogs: number;
  habits: HabitByHabitAnalytics[];
  weeklyTrend: TrendPoint[];
}

export interface QuranAnalytics {
  minutesRead: number;
  ayahsRead: number;
  sessionsCount: number;
  readingDays: number;
  possibleDays: number;
  currentStreak: number;
  longestStreak: number;
  currentPosition?: {
    surahNumber: number;
    ayahNumber: number;
    surahName?: string;
  };
  weeklyTrend: TrendPoint[];
  goalProgressPercent?: number;
}

export interface DhikrAnalytics {
  sessions: number;
  completedSessions: number;
  interruptedSessions: number;
  cancelledSessions: number;
  totalCounts: number;
  morningSessions: number;
  eveningSessions: number;
  postSalahSessions: number;
  weeklyTrend: TrendPoint[];
}

export interface TaskAnalytics {
  created: number;
  completed: number;
  completionRate: number;
  overdue: number;
  cancelled: number;
  weeklyTrend: TrendPoint[];
}

export interface FocusAnalytics {
  totalMinutes: number;
  completedSessions: number;
  interruptedSessions: number;
  cancelledSessions: number;
  averageSessionMinutes: number;
  longestSessionMinutes: number;
  bySubject: SubjectAnalytics[];
  byDay: TrendPoint[];
  weeklyTrend: TrendPoint[];
}

export interface GoalItemAnalytics {
  id: string;
  title: string;
  kind: "spiritual" | "productivity";
  progressPercent: number;
  isCompleted: boolean;
  isOverdue: boolean;
}

export interface GoalAnalytics {
  spiritualActive: number;
  spiritualCompleted: number;
  productivityActive: number;
  productivityCompleted: number;
  overdue: number;
  items: GoalItemAnalytics[];
}

export interface ReflectionAnalytics {
  reflectionDays: number;
  possibleDays: number;
  moodDistribution: Array<{ mood: string; count: number }>;
  recentThemes: string[];
}

export interface HeatmapCell {
  date: string;
  value: number;
}

export interface AnalyticsOverview {
  salahCompleted: number;
  salahPossible: number;
  habitsCompleted: number;
  habitsPossible: number;
  quranMinutes: number;
  dhikrSessions: number;
  tasksCompleted: number;
  focusMinutes: number;
  activeGoals: number;
  habitCompletionRate: number;
}

export interface WeeklyReview {
  periodLabel: string;
  focusSessions: number;
  quranReadingDays: number;
  tasksCompleted: number;
  habitCompletionRate: number;
  topFocusSubject?: { name: string; minutes: number };
  quranMinutes: number;
  reflectionPrompt: string;
}

export interface MonthlyReview {
  periodLabel: string;
  narrative: string;
  focusMinutes: number;
  tasksCompleted: number;
  habitCompletionRate: number;
  quranMinutes: number;
  dhikrSessions: number;
  goalsCompleted: number;
}

export interface PersonalInsight {
  id: string;
  text: string;
}

export interface AnalyticsSummary {
  range: AnalyticsDateRange;
  generatedAt: string;
  isStale: boolean;
  lastUpdatedAt: string;
  overview: AnalyticsOverview;
  prayer: PrayerAnalytics;
  habits: HabitAnalytics;
  quran: QuranAnalytics;
  dhikr: DhikrAnalytics;
  tasks: TaskAnalytics;
  focus: FocusAnalytics;
  goals: GoalAnalytics;
  reflections: ReflectionAnalytics;
  trends: {
    dailyActivity: TrendPoint[];
    focus: TrendPoint[];
    quran: TrendPoint[];
    habits: TrendPoint[];
    tasks: TrendPoint[];
    prayer: TrendPoint[];
    dhikr: TrendPoint[];
  };
  heatmap: Record<HeatmapFilter, HeatmapCell[]>;
  weeklyReview: WeeklyReview;
  monthlyReview: MonthlyReview;
  insights: PersonalInsight[];
}

export interface AnalyticsPrayerLog {
  prayer: PrayerName;
  date: string;
  status: "completed" | "missed" | "late";
}

export interface AnalyticsHabit {
  id: string;
  name: string;
  isActive: boolean;
  startDate?: string;
  frequency: string;
}

export interface AnalyticsHabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface AnalyticsTask {
  id: string;
  title: string;
  status: string;
  subjectId?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  estimatedMinutes?: number | null;
}

export interface AnalyticsSubject {
  id: string;
  name: string;
  color: string;
  weeklyTargetMinutes: number;
  isArchived: boolean;
}

export interface AnalyticsFocusSession {
  id: string;
  startedAt: string;
  actualMinutes: number;
  plannedMinutes: number;
  status: string;
  subjectId?: string | null;
  subjectName?: string;
}

export interface AnalyticsQuranSession {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  minutesRead: number;
  readingDate: string;
}

export interface AnalyticsDhikrSession {
  dhikrId: string;
  completedCount: number;
  targetCount: number;
  startedAt: string;
  status: string;
}

export interface AnalyticsGoal {
  id: string;
  title: string;
  category?: string;
  type?: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  deadline?: string | null;
}

export interface AnalyticsReflection {
  reflectionDate: string;
  mood?: string | null;
  moodRating?: number | null;
  tomorrowPriority?: string | null;
  achievements?: string | null;
  improvements?: string | null;
}

export interface AnalyticsSnapshot {
  userId: string;
  timezone: string;
  generatedAt: string;
  prayerLogs: AnalyticsPrayerLog[];
  habits: AnalyticsHabit[];
  habitLogs: AnalyticsHabitLog[];
  tasks: AnalyticsTask[];
  subjects: AnalyticsSubject[];
  focusSessions: AnalyticsFocusSession[];
  quranSessions: AnalyticsQuranSession[];
  quranPosition?: {
    surahNumber: number;
    ayahNumber: number;
    surahName?: string;
  };
  quranGoal?: {
    targetType: "minutes" | "ayahs";
    targetValue: number;
    isEnabled: boolean;
  };
  dhikrSessions: AnalyticsDhikrSession[];
  dhikrCatalog: Array<{ id: string; category: string }>;
  productivityGoals: AnalyticsGoal[];
  spiritualGoals: AnalyticsGoal[];
  reflections: AnalyticsReflection[];
}

export interface ExportSelection {
  categories: ExportCategory[];
  range: AnalyticsDateRange;
}

export interface JsonExportDocument {
  metadata: {
    product: "Istiqamaah" | "Istiqamah";
    tagline: "Balance your Deen. Organize your life.";
    exportedAt: string;
    timezone: string;
    dateRange: { startDate: string; endDate: string; preset: AnalyticsPeriodPreset };
    privacyNotice: string;
  };
  summaries: AnalyticsSummary;
  records: {
    prayerLogs?: AnalyticsPrayerLog[];
    habitLogs?: AnalyticsHabitLog[];
    tasks?: AnalyticsTask[];
    focusSessions?: AnalyticsFocusSession[];
    quranSessions?: AnalyticsQuranSession[];
    dhikrSessions?: AnalyticsDhikrSession[];
    goals?: AnalyticsGoal[];
    reflections?: Array<
      Omit<AnalyticsReflection, "achievements" | "improvements"> & {
        hasAchievements: boolean;
        hasImprovements: boolean;
        achievements?: string;
        improvements?: string;
      }
    >;
  };
}

export const ANALYTICS_PRIVACY_NOTICE =
  "Your export contains private activity data. Keep the file secure.";
