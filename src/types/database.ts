export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Profile ────────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  preferred_language: string | null;
  prayer_calculation_method: string | null;
  asr_madhhab: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileInsert = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
  prayer_calculation_method?: string | null;
  asr_madhhab?: string | null;
  avatar_url?: string | null;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

// ─── Prayer Settings ────────────────────────────────────────────────────────
type PrayerSettingsRow = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: string;
  calculation_method: string;
  madhhab: string;
  fajr_adjustment: number;
  sunrise_adjustment: number;
  dhuhr_adjustment: number;
  asr_adjustment: number;
  maghrib_adjustment: number;
  isha_adjustment: number;
  manual_offset_minutes: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type PrayerSettingsInsert = {
  id?: string;
  user_id: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  timezone?: string;
  calculation_method?: string;
  madhhab?: string;
  fajr_adjustment?: number;
  sunrise_adjustment?: number;
  dhuhr_adjustment?: number;
  asr_adjustment?: number;
  maghrib_adjustment?: number;
  isha_adjustment?: number;
  manual_offset_minutes?: number;
  notifications_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
};

// ─── Prayer Logs ────────────────────────────────────────────────────────────
type PrayerLogRow = {
  id: string;
  user_id: string;
  prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  date: string;
  status: "completed" | "missed" | "late";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type PrayerLogInsert = {
  id?: string;
  user_id: string;
  prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  date: string;
  status?: "completed" | "missed" | "late";
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Habits ─────────────────────────────────────────────────────────────────

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  frequency: string; // 'daily' | 'weekly' | 'custom'
  target_value: number;
  target_unit: string | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  prayer_anchor: string | null; // 'none' | 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
  start_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type HabitInsert = {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  icon?: string;
  category?: string;
  frequency?: string;
  target_value?: number;
  target_unit?: string | null;
  reminder_enabled?: boolean;
  reminder_time?: string | null;
  prayer_anchor?: string | null;
  start_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

// ─── Habit Logs ─────────────────────────────────────────────────────────────

type HabitLogRow = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  value: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type HabitLogInsert = {
  id?: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed?: boolean;
  value?: number;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Subjects ────────────────────────────────────────────────────────────────

type SubjectRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
};

type SubjectInsert = {
  id?: string;
  user_id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  created_at?: string;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

type TaskRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  priority: string; // 'low' | 'medium' | 'high'
  status: string; // 'todo' | 'in_progress' | 'completed'
  deadline: string | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
};

type TaskInsert = {
  id?: string;
  user_id: string;
  subject_id?: string | null;
  title: string;
  description?: string | null;
  priority?: string;
  status?: string;
  deadline?: string | null;
  estimated_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Goals ───────────────────────────────────────────────────────────────────

type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string; // 'daily' | 'weekly' | 'long_term'
  target_value: number;
  current_value: number;
  unit: string | null;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

type GoalInsert = {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  category?: string;
  target_value?: number;
  current_value?: number;
  unit?: string | null;
  deadline?: string | null;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

// ─── Focus Sessions ──────────────────────────────────────────────────────────

type FocusSessionRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  mode: string; // 'pomodoro' | 'custom'
  completed: boolean;
  note: string | null;
  started_at: string;
  ended_at: string | null;
};

type FocusSessionInsert = {
  id?: string;
  user_id: string;
  subject_id?: string | null;
  duration_minutes: number;
  mode?: string;
  completed?: boolean;
  note?: string | null;
  started_at?: string;
  ended_at?: string | null;
};

// ─── Quran Progress ──────────────────────────────────────────────────────────

type QuranProgressRow = {
  id: string;
  user_id: string;
  log_date: string;
  pages_read: number;
  juz_reached: number | null;
  reading_minutes: number;
  note: string | null;
  created_at: string;
};

type QuranProgressInsert = {
  id?: string;
  user_id: string;
  log_date: string;
  pages_read?: number;
  juz_reached?: number | null;
  reading_minutes?: number;
  note?: string | null;
  created_at?: string;
};

// ─── Dhikr Logs ──────────────────────────────────────────────────────────────

type DhikrLogRow = {
  id: string;
  user_id: string;
  dhikr_name: string;
  count: number;
  category: string; // 'morning' | 'evening' | 'after_prayer' | 'sleep' | 'custom'
  log_date: string;
  created_at: string;
};

type DhikrLogInsert = {
  id?: string;
  user_id: string;
  dhikr_name: string;
  count?: number;
  category?: string;
  log_date?: string;
  created_at?: string;
};

// ─── Hadiths ─────────────────────────────────────────────────────────────────

type HadithRow = {
  id: string;
  arabic_text: string;
  english_translation: string;
  bangla_translation: string | null;
  source: string;
  book: string;
  hadith_number: string;
  grade: string | null;
  topic: string | null;
  is_verified: boolean;
  created_at: string;
};

// ─── Daily Reflections ───────────────────────────────────────────────────────

type DailyReflectionRow = {
  id: string;
  user_id: string;
  reflection_date: string;
  achievements: string | null;
  improvements: string | null;
  tomorrow_priority: string | null;
  mood_rating: number | null;
  created_at: string;
};

type DailyReflectionInsert = {
  id?: string;
  user_id: string;
  reflection_date: string;
  achievements?: string | null;
  improvements?: string | null;
  tomorrow_priority?: string | null;
  mood_rating?: number | null;
  created_at?: string;
};

// ─── Database ─────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      prayer_settings: {
        Row: PrayerSettingsRow;
        Insert: PrayerSettingsInsert;
        Update: Partial<PrayerSettingsInsert>;
        Relationships: [];
      };
      prayer_logs: {
        Row: PrayerLogRow;
        Insert: PrayerLogInsert;
        Update: Partial<PrayerLogInsert>;
        Relationships: [];
      };
      habits: {
        Row: HabitRow;
        Insert: HabitInsert;
        Update: Partial<HabitInsert>;
        Relationships: [];
      };
      habit_logs: {
        Row: HabitLogRow;
        Insert: HabitLogInsert;
        Update: Partial<HabitLogInsert>;
        Relationships: [];
      };
      subjects: {
        Row: SubjectRow;
        Insert: SubjectInsert;
        Update: Partial<SubjectInsert>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: TaskInsert;
        Update: Partial<TaskInsert>;
        Relationships: [];
      };
      goals: {
        Row: GoalRow;
        Insert: GoalInsert;
        Update: Partial<GoalInsert>;
        Relationships: [];
      };
      focus_sessions: {
        Row: FocusSessionRow;
        Insert: FocusSessionInsert;
        Update: Partial<FocusSessionInsert>;
        Relationships: [];
      };
      quran_progress: {
        Row: QuranProgressRow;
        Insert: QuranProgressInsert;
        Update: Partial<QuranProgressInsert>;
        Relationships: [];
      };
      dhikr_logs: {
        Row: DhikrLogRow;
        Insert: DhikrLogInsert;
        Update: Partial<DhikrLogInsert>;
        Relationships: [];
      };
      hadiths: {
        Row: HadithRow;
        Insert: Omit<HadithRow, "created_at"> & { created_at?: string };
        Update: Partial<HadithRow>;
        Relationships: [];
      };
      daily_reflections: {
        Row: DailyReflectionRow;
        Insert: DailyReflectionInsert;
        Update: Partial<DailyReflectionInsert>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
