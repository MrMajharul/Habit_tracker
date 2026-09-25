import { HabitsPageClient } from "@/components/habits/habits-page-client";
import { INITIAL_HABITS } from "@/services/habits/habit-service";

export const metadata = {
  title: "Habits — Istiqamah",
  description: "Build steady consistency around Salah, one day at a time.",
};

export default function HabitsPage() {
  return <HabitsPageClient initialHabits={INITIAL_HABITS} />;
}
