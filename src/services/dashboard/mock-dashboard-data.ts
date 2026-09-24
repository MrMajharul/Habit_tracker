import type {
  DashboardHabit,
  DashboardTask,
  ProgressOverview,
  UserProfile,
} from "@/types";

export const MOCK_PROFILE: UserProfile = {
  id: "dev-user",
  name: "Ahmad",
  email: "ahmad@example.com",
  city: "Dhaka",
  country: "Bangladesh",
  timezone: "Asia/Dhaka",
  preferredLanguage: "en",
};

export const MOCK_HABITS: DashboardHabit[] = [
  {
    id: "habit-1",
    name: "Read Qur'an",
    icon: "book-open",
    category: "islamic",
    completed: true,
    target: "5 pages",
    color: "emerald",
  },
  {
    id: "habit-2",
    name: "Morning Dhikr",
    icon: "heart-handshake",
    category: "islamic",
    completed: true,
    color: "emerald",
  },
  {
    id: "habit-3",
    name: "Exercise",
    icon: "dumbbell",
    category: "health",
    completed: false,
    target: "30 min",
    color: "blue",
  },
  {
    id: "habit-4",
    name: "Study 2 hours",
    icon: "graduation-cap",
    category: "study",
    completed: true,
    target: "2h",
    color: "violet",
  },
  {
    id: "habit-5",
    name: "Read 10 pages",
    icon: "book-marked",
    category: "personal",
    completed: false,
    target: "10 pages",
    color: "amber",
  },
];

export const MOCK_TASKS: DashboardTask[] = [
  {
    id: "task-1",
    title: "Finish assignment",
    subject: "Compiler",
    priority: "high",
    status: "in_progress",
    estimatedMinutes: 90,
  },
  {
    id: "task-2",
    title: "Read chapter 4",
    subject: "Database",
    priority: "medium",
    status: "todo",
    estimatedMinutes: 45,
  },
  {
    id: "task-3",
    title: "Solve 20 problems",
    subject: "Programming",
    priority: "medium",
    status: "completed",
    estimatedMinutes: 60,
  },
  {
    id: "task-4",
    title: "Prepare presentation",
    subject: "Machine Learning",
    priority: "low",
    status: "todo",
    estimatedMinutes: 30,
  },
];

export const MOCK_PROGRESS: ProgressOverview = {
  habitsCompleted: MOCK_HABITS.filter((h) => h.completed).length,
  habitsTotal: MOCK_HABITS.length,
  tasksCompleted: MOCK_TASKS.filter((t) => t.status === "completed").length,
  tasksTotal: MOCK_TASKS.length,
  prayersCompleted: 2,
  prayersTotal: 5,
  focusMinutesToday: 75,
};
