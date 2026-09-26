import { TasksPageClient } from "@/components/tasks/tasks-page-client";

export const metadata = {
  title: "Tasks & Planning — Istiqamaah",
  description:
    "Organize your daily study and work tasks around your Salah routine.",
};

export default function TasksPage() {
  return <TasksPageClient />;
}
