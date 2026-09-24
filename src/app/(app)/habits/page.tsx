import { HabitsPageClient } from "@/components/habits/habits-page-client";
import type { DashboardHabit } from "@/types";

export const metadata = { title: "Habits" };

// Seed mock data — real habits will come from Supabase in Phase 2 backend integration
const SEED_HABITS = [
  { id: "1", name: "Morning Qur'an", icon: "book-open", category: "islamic" as const, completed: true, target: "20 pages", streak: 7, frequency: "daily" as const },
  { id: "2", name: "Morning Adhkar", icon: "heart-handshake", category: "islamic" as const, completed: true, target: "Complete set", streak: 12, frequency: "daily" as const },
  { id: "3", name: "Exercise", icon: "dumbbell", category: "health" as const, completed: false, target: "30 minutes", streak: 3, frequency: "daily" as const },
  { id: "4", name: "Study Session", icon: "graduation-cap", category: "study" as const, completed: false, target: "2 hours", streak: 5, frequency: "daily" as const },
  { id: "5", name: "Read Book", icon: "book-marked", category: "personal" as const, completed: false, target: "10 pages", streak: 1, frequency: "daily" as const },
];

export default function HabitsPage() {
  return <HabitsPageClient initialHabits={SEED_HABITS} />;
}
