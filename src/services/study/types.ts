export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type FocusSessionStatus = "COMPLETED" | "INTERRUPTED" | "CANCELLED";

export interface Subject {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  weeklyTargetMinutes: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;

  // Computed helper fields for UI
  completedMinutes?: number;
  activeTaskCount?: number;
  progressPercentage?: number;
}

export interface Task {
  id: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined/denormalized subject info for display
  subject?: Subject | null;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string | null;
  subjectId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  plannedMinutes: number;
  actualMinutes: number;
  status: FocusSessionStatus;
  createdAt: string;

  // Joined info
  taskTitle?: string;
  subjectName?: string;
}

export interface PlanningWindow {
  currentPrayer?: string;
  nextPrayer: string;
  nextPrayerTime: Date;
  availableMinutes: number;
  recommendedTasks: Array<{
    task: Task;
    allocatedMinutes: number;
  }>;
  recommendedFocusDuration?: number;
  fitsBeforePrayer: boolean;
  shortSessionRecommendation?: number;
}

export interface ProductivityAnalytics {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  focusMinutesToday: number;
  focusMinutesThisWeek: number;
  completedSessionsToday: number;
  subjectWiseFocusMinutes: Record<
    string,
    { name: string; minutes: number; color: string; targetMinutes: number }
  >;
  taskCompletionRate: number;
  overdueTaskCount: number;
  weeklyTargetProgress: number;
}
