import type { Metadata } from "next";

import { CalendarPageClient } from "@/components/calendar/calendar-page-client";

export const metadata: Metadata = {
  title: "Calendar & Schedule — Istiqamaah",
  description:
    "Unified prayer-aware calendar for organizing study sessions, tasks, and daily Salah routines seamlessly.",
};

export default function CalendarPage() {
  return <CalendarPageClient />;
}
