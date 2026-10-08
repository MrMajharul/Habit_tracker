import type { Metadata } from "next";
import { MoneyDashboard } from "@/components/money/money-dashboard";

export const metadata: Metadata = {
  title: "Money — Istiqamaah",
  description: "Track your income, expenses, and savings. Personal money management.",
};

export default function MoneyPage() {
  return <MoneyDashboard />;
}
