import {
  Bell,
  BookOpen,
  ChevronRight,
  Globe,
  Info,
  Lock,
  Moon,
  Sparkles,
  User,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Settings" };

interface SettingsItem {
  icon: typeof User;
  label: string;
  description?: string;
  value?: string;
  href?: string;
}

const SETTINGS_GROUPS: Array<{
  title: string;
  items: SettingsItem[];
}> = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", description: "Name, email, country, city", href: "#" },
      { icon: Lock, label: "Privacy", description: "Your data is private and encrypted", href: "#" },
    ],
  },
  {
    title: "Appearance",
    items: [
      { icon: Moon, label: "Theme", description: "Light, dark, or system default", value: "System", href: "#" },
    ],
  },
  {
    title: "Prayer",
    items: [
      { icon: Sparkles, label: "Calculation Method", description: "University of Islamic Sciences, Karachi", value: "Karachi", href: "#" },
      { icon: Sparkles, label: "Asr Calculation", description: "Standard (Shafi'i, Maliki, Hanbali)", value: "Standard", href: "#" },
      { icon: Globe, label: "Location", description: "Dhaka, Bangladesh", href: "#" },
    ],
  },
  {
    title: "Language",
    items: [
      { icon: Globe, label: "App Language", value: "English", href: "#" },
      { icon: BookOpen, label: "Qur'an Language", description: "Arabic + English translation", href: "#" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { icon: Bell, label: "Prayer Reminders", value: "On", href: "#" },
      { icon: Bell, label: "Habit Reminders", value: "On", href: "#" },
      { icon: Bell, label: "Quiet Hours", description: "11:00 PM — 5:00 AM", href: "#" },
    ],
  },
  {
    title: "About",
    items: [
      { icon: Info, label: "NoorPath", description: "Version 0.1.0 — Phase 1", href: "#" },
      { icon: Info, label: "Open Source", description: "Built with ❤️ for the Ummah", href: "#" },
    ],
  },
];

function SettingsRow({ item }: { item: SettingsItem }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href ?? "#"}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
      onClick={(e) => e.preventDefault()}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon className="size-4 text-foreground/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.label}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.value && (
          <span className="text-xs font-medium text-primary">{item.value}</span>
        )}
        <ChevronRight className="size-4 text-muted-foreground/50" />
      </div>
    </a>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customise NoorPath to match your needs.
        </p>
      </div>

      <div className="space-y-4">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {group.items.map((item, i) => (
                  <div key={item.label}>
                    <SettingsRow item={item} />
                    {i < group.items.length - 1 && (
                      <Separator className="ml-[60px]" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Full settings configuration coming in Phase 2. Prayer settings are already available on the Prayer page.
      </p>
    </div>
  );
}
