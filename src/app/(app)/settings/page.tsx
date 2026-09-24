import { SettingsPageClient } from "@/components/settings/settings-page-client";

export const metadata = {
  title: "Settings — NoorPath",
  description: "Customize your prayer calculation, reminders, theme, and profile.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
