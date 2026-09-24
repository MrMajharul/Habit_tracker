export type HabitCategory =
  | "islamic"
  | "health"
  | "study"
  | "work"
  | "personal"
  | "family"
  | "other";

export type PrayerAnchor =
  | "none"
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

export type TaskStatus = "todo" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  country?: string;
  city?: string;
  timezone: string;
  preferredLanguage: "en" | "bn";
}

export interface DashboardHabit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  completed: boolean;
  target?: string;
  color?: string;
  streak?: number;
  prayerAnchor?: PrayerAnchor;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  category: HabitCategory;
  frequency: "daily" | "weekly";
  targetValue?: number;
  targetUnit?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  prayerAnchor?: PrayerAnchor;
  startDate?: string;
  isActive: boolean;
  streak?: number;
  completedToday?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  value?: number;
  completedAt?: string;
}

export interface PrayerLog {
  id: string;
  userId: string;
  prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  date: string;
  status: "completed" | "missed" | "late";
  completedAt?: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  subject?: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedMinutes?: number;
}

export interface ProgressOverview {
  habitsCompleted: number;
  habitsTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  prayersCompleted: number;
  prayersTotal: number;
  focusMinutesToday: number;
}
