export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Profile ────────────────────────────────────────────────────────────────

interface ProfileRow {
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
}

interface ProfileInsert {
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
}

// ─── Habits ─────────────────────────────────────────────────────────────────

interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: string;
  frequency: string; // 'daily' | 'weekly' | 'custom'
  target_count: number;
  color: string | null;
  notes: string | null;
  start_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HabitInsert {
  id?: string;
  user_id: string;
  name: string;
  icon?: string;
  category?: string;
  frequency?: string;
  target_count?: number;
  color?: string | null;
  notes?: string | null;
  start_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Habit Logs ─────────────────────────────────────────────────────────────

interface HabitLogRow {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed_count: number;
  note: string | null;
  created_at: string;
}

interface HabitLogInsert {
  id?: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed_count?: number;
  note?: string | null;
  created_at?: string;
}

// ─── Subjects ────────────────────────────────────────────────────────────────

interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

interface SubjectInsert {
  id?: string;
  user_id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  created_at?: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

interface TaskRow {
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
}

interface TaskInsert {
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
}

// ─── Goals ───────────────────────────────────────────────────────────────────

interface GoalRow {
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
}

interface GoalInsert {
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
}

// ─── Focus Sessions ──────────────────────────────────────────────────────────

interface FocusSessionRow {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  mode: string; // 'pomodoro' | 'custom'
  completed: boolean;
  note: string | null;
  started_at: string;
  ended_at: string | null;
}

interface FocusSessionInsert {
  id?: string;
  user_id: string;
  subject_id?: string | null;
  duration_minutes: number;
  mode?: string;
  completed?: boolean;
  note?: string | null;
  started_at?: string;
  ended_at?: string | null;
}

// ─── Quran Progress ──────────────────────────────────────────────────────────

interface QuranProgressRow {
  id: string;
  user_id: string;
  log_date: string;
  pages_read: number;
  juz_reached: number | null;
  reading_minutes: number;
  note: string | null;
  created_at: string;
}

interface QuranProgressInsert {
  id?: string;
  user_id: string;
  log_date: string;
  pages_read?: number;
  juz_reached?: number | null;
  reading_minutes?: number;
  note?: string | null;
  created_at?: string;
}

// ─── Dhikr Logs ──────────────────────────────────────────────────────────────

interface DhikrLogRow {
  id: string;
  user_id: string;
  dhikr_name: string;
  count: number;
  category: string; // 'morning' | 'evening' | 'after_prayer' | 'sleep' | 'custom'
  log_date: string;
  created_at: string;
}

interface DhikrLogInsert {
  id?: string;
  user_id: string;
  dhikr_name: string;
  count?: number;
  category?: string;
  log_date?: string;
  created_at?: string;
}

// ─── Hadiths ─────────────────────────────────────────────────────────────────

interface HadithRow {
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
}

// ─── Daily Reflections ───────────────────────────────────────────────────────

interface DailyReflectionRow {
  id: string;
  user_id: string;
  reflection_date: string;
  achievements: string | null;
  improvements: string | null;
  tomorrow_priority: string | null;
  mood_rating: number | null;
  created_at: string;
}

interface DailyReflectionInsert {
  id?: string;
  user_id: string;
  reflection_date: string;
  achievements?: string | null;
  improvements?: string | null;
  tomorrow_priority?: string | null;
  mood_rating?: number | null;
  created_at?: string;
}

// ─── Database ─────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
      };
      habits: {
        Row: HabitRow;
        Insert: HabitInsert;
        Update: Partial<HabitInsert>;
      };
      habit_logs: {
        Row: HabitLogRow;
        Insert: HabitLogInsert;
        Update: Partial<HabitLogInsert>;
      };
      subjects: {
        Row: SubjectRow;
        Insert: SubjectInsert;
        Update: Partial<SubjectInsert>;
      };
      tasks: {
        Row: TaskRow;
        Insert: TaskInsert;
        Update: Partial<TaskInsert>;
      };
      goals: {
        Row: GoalRow;
        Insert: GoalInsert;
        Update: Partial<GoalInsert>;
      };
      focus_sessions: {
        Row: FocusSessionRow;
        Insert: FocusSessionInsert;
        Update: Partial<FocusSessionInsert>;
      };
      quran_progress: {
        Row: QuranProgressRow;
        Insert: QuranProgressInsert;
        Update: Partial<QuranProgressInsert>;
      };
      dhikr_logs: {
        Row: DhikrLogRow;
        Insert: DhikrLogInsert;
        Update: Partial<DhikrLogInsert>;
      };
      hadiths: {
        Row: HadithRow;
        Insert: Omit<HadithRow, "created_at"> & { created_at?: string };
        Update: Partial<HadithRow>;
      };
      daily_reflections: {
        Row: DailyReflectionRow;
        Insert: DailyReflectionInsert;
        Update: Partial<DailyReflectionInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
