export type HabitCategory =
  | "islamic"
  | "health"
  | "study"
  | "work"
  | "personal"
  | "family"
  | "other";

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
