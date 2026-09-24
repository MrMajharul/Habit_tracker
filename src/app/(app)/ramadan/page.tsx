import { Moon, Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ramadan" };

const RAMADAN_FEATURES = [
  { icon: "🌙", title: "Fasting Tracker", description: "Log daily fast — suhoor and iftar times" },
  { icon: "⏰", title: "Suhoor Reminder", description: "Wake-up alert before Fajr" },
  { icon: "🌅", title: "Iftar Countdown", description: "Real-time countdown to Maghrib" },
  { icon: "🕌", title: "Taraweeh Tracker", description: "Log nightly Taraweeh completion" },
  { icon: "📖", title: "Qur'an Khatm Goal", description: "Complete the Qur'an during Ramadan" },
  { icon: "💝", title: "Sadaqah Log", description: "Track your charity and giving" },
  { icon: "🤲", title: "Ramadan Dhikr", description: "Special adhkar for the blessed month" },
  { icon: "🎯", title: "Daily Ramadan Goals", description: "Custom goals for each day of Ramadan" },
];

export default function RamadanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ramadan Mode</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A dedicated companion for the blessed month.
        </p>
      </div>

      <Card className="border-gold/20 bg-gradient-to-br from-card to-gold/5">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <Moon className="size-10 text-gold" />
            <Star className="size-6 text-gold/60" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Coming in Phase 6</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ramadan Mode is designed but kept modular — activates automatically when Ramadan begins.
            The architecture is in place and all features will be ready before Ramadan 1447.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Planned Features</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {RAMADAN_FEATURES.map((feature) => (
            <Card key={feature.title} className="border-border/60">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span>{feature.icon}</span>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
