import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Istiqamaah — Balance your Deen. Organize your life.",
  description:
    "Plan your day around Salah, build better habits, and make time for what matters. A calm Muslim daily-life companion.",
};

export default function HomePage() {
  // Dev shortcut: bypass landing → go straight to dashboard
  if (!isSupabaseConfigured && isDevAuthBypass) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
