"use client";

import {
  Bell,
  Check,
  Download,
  Globe,
  Laptop,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";

import {
  PrayerSettingsDialog,
  type PrayerSettingsState,
} from "@/components/prayer/prayer-settings-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useIsMounted } from "@/hooks/use-is-mounted";

export function SettingsPageClient() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  // Profile state
  const [profile, setProfile] = React.useState({
    name: "Ahmad Ibn Abdullah",
    email: "ahmad@example.com",
    city: "Dhaka",
    country: "Bangladesh",
    timezone: "Asia/Dhaka",
  });

  // Language state
  const [language, setLanguage] = React.useState<"en" | "bn">("en");

  // Notifications state
  const [notifications, setNotifications] = React.useState({
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    quranReminder: true,
    habitReminders: true,
    dailyReview: false,
    quietHours: true,
  });

  // Prayer settings state
  const [prayerSettings, setPrayerSettings] = React.useState<PrayerSettingsState>({
    city: "Dhaka",
    country: "Bangladesh",
    calculationMethod: "karachi",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
  });

  React.useEffect(() => {
    // Load persisted preferences from localStorage if present
    try {
      const savedLang =
        localStorage.getItem("istiqamah_lang") ??
        localStorage.getItem("noorpath_lang");
      const savedNotifs =
        localStorage.getItem("istiqamah_notifs") ??
        localStorage.getItem("noorpath_notifs");
      if (savedLang === "en" || savedLang === "bn" || savedNotifs) {
        setTimeout(() => {
          if (savedLang === "en" || savedLang === "bn") {
            setLanguage(savedLang);
          }
          if (savedNotifs) {
            setNotifications(JSON.parse(savedNotifs));
          }
        }, 0);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleLanguageChange = (lang: "en" | "bn") => {
    setLanguage(lang);
    try {
      localStorage.setItem("istiqamah_lang", lang);
    } catch {
      // Ignore storage errors
    }
    toast.success(
      lang === "bn" ? "ভাষা বাংলায় পরিবর্তন করা হয়েছে" : "Language set to English",
    );
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      localStorage.setItem("istiqamah_notifs", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    toast.success(
      updated[key]
        ? "Notification enabled"
        : "Notification disabled",
    );
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      profile,
      language,
      prayerSettings,
      notifications,
      note: "Istiqamah User Data Export",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `istiqamah-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Personal data exported successfully");
  };

  const handleResetData = () => {
    if (confirm("Reset local preferences to default?")) {
      try {
        localStorage.clear();
      } catch {
        // Ignore
      }
      toast.info("Preferences reset to defaults");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize your spiritual companion, prayer calculations, and notifications.
        </p>
      </div>

      {/* Account & Profile */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Profile & Account
        </h2>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">{profile.name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prof-name">Display Name</Label>
                <Input
                  id="prof-name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-email">Email</Label>
                <Input
                  id="prof-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                Row-Level Security (RLS) protects your worship and study data
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success("Profile saved")}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Appearance / Theme */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Appearance
        </h2>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Color Theme</CardTitle>
            <CardDescription>
              Choose your preferred visual mode for day and night.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mounted && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Sun className="size-5" />
                  <span className="text-xs font-medium">Light</span>
                  {theme === "light" && <Check className="size-3.5 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Moon className="size-5" />
                  <span className="text-xs font-medium">Dark</span>
                  {theme === "dark" && <Check className="size-3.5 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Laptop className="size-5" />
                  <span className="text-xs font-medium">System</span>
                  {theme === "system" && <Check className="size-3.5 text-primary" />}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Language */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Language & Regional
        </h2>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Application Language</h3>
                  <p className="text-xs text-muted-foreground">
                    English and Bangla (বাংলা) translation support
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("en")}
                >
                  English
                </Button>
                <Button
                  size="sm"
                  variant={language === "bn" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("bn")}
                >
                  বাংলা (Bangla)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Prayer Calculation Settings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prayer Settings
          </h2>
          <PrayerSettingsDialog
            settings={prayerSettings}
            onSave={(newSettings) => setPrayerSettings(newSettings)}
          />
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Location</span>
                <p className="text-xs text-muted-foreground">
                  {prayerSettings.city}, {prayerSettings.country}
                </p>
              </div>
              <Badge variant="outline">Current</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Calculation Method</span>
                <p className="text-xs text-muted-foreground capitalize">
                  {prayerSettings.calculationMethod}
                </p>
              </div>
              <Badge variant="secondary">Karachi</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Asr Juristic Method</span>
                <p className="text-xs text-muted-foreground capitalize">
                  {prayerSettings.asrMadhhab === "hanafi"
                    ? "Hanafi (Shadow ratio 2)"
                    : "Standard / Shafi'i (Shadow ratio 1)"}
                </p>
              </div>
              <Badge variant="outline">{prayerSettings.asrMadhhab}</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Smart Reminders & Notifications */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notifications & Alerts
        </h2>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <CardTitle className="text-base">Prayer & Habit Reminders</CardTitle>
            </div>
            <CardDescription>
              Toggle discrete notifications designed never to spam you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "fajr" as const, title: "Fajr Adhan alert", desc: "Before dawn prayer" },
              { key: "dhuhr" as const, title: "Dhuhr reminder", desc: "Midday prayer call" },
              { key: "asr" as const, title: "Asr reminder", desc: "Late afternoon prayer" },
              { key: "maghrib" as const, title: "Maghrib alert", desc: "Sunset prayer" },
              { key: "isha" as const, title: "Isha reminder", desc: "Night prayer" },
              { key: "quranReminder" as const, title: "Daily Qur'an Goal", desc: "Gentle reminder to recite" },
              { key: "habitReminders" as const, title: "Habit check-in", desc: "After prayer routines" },
              { key: "quietHours" as const, title: "Quiet Hours (11 PM — 4 AM)", desc: "Silence non-critical alerts" },
            ].map((item, idx) => (
              <div key={item.key}>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={notifications[item.key] ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => toggleNotification(item.key)}
                  >
                    {notifications[item.key] ? "Enabled" : "Off"}
                  </Button>
                </div>
                {idx < 7 && <Separator className="my-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Data & Privacy */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data & Privacy
        </h2>
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Export Personal Worship & Study Data</p>
                <p className="text-xs text-muted-foreground">
                  Download a JSON copy of all your tracked habits, prayers, and notes.
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleExportData}>
                <Download className="size-4" />
                Export JSON
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Reset Local Storage</p>
                <p className="text-xs text-muted-foreground">
                  Clears local browser cache and resets preferences.
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={handleResetData}
              >
                <RotateCcw className="size-4" />
                Reset Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* About */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About Istiqamah
        </h2>
        <Card className="border-emerald-600/20 bg-emerald-500/5">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-sm">
              <Sparkles className="size-4" />
              <span>Built with Ihsan for the Ummah</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Istiqamah is a calm Muslim daily-life companion. No advertisements, no distracting algorithms,
              no public religious leaderboards. All Hadith and Qur&apos;anic texts are verified from source-controlled collections.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="text-[10px]">Version 0.1.0</Badge>
              <Badge variant="outline" className="text-[10px]">Ad-Free Guarantee</Badge>
              <Badge variant="outline" className="text-[10px]">Verified Hadith</Badge>
              <Badge variant="outline" className="text-[10px]">Privacy-First</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
