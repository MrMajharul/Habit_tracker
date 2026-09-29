"use client";

import {
  Bell,
  Check,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Laptop,
  LogOut,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";
import { clearOfflineQueue } from "@/lib/offline/offline-sync-queue";
import { clearUserLocalData } from "@/lib/cache/user-cache";

import {
  CALCULATION_METHODS,
  PrayerSettingsDialog,
  type PrayerSettingsState,
} from "@/components/prayer/prayer-settings-dialog";
import {
  fetchUserPrayerSettings,
  getLocalPrayerSettings,
  saveLocalPrayerSettings,
} from "@/services/prayer/prayer-settings-service";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SettingsProfile {
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
}

interface SettingsNotifications {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  quranReminder: boolean;
  habitReminders: boolean;
  dailyReview: boolean;
  quietHours: boolean;
}

export function SettingsPageClient() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  // Profile state
  const [profile, setProfile] = React.useState<SettingsProfile>(() => {
    const fallback: SettingsProfile = {
      name: "Muslim",
      email: "",
      city: "Dhaka",
      country: "Bangladesh",
      timezone: "Asia/Dhaka",
    };
    if (typeof window === "undefined") return fallback;
    try {
      const localSaved =
        localStorage.getItem("istiqamaah_local_profile") ??
        localStorage.getItem("noorpath_local_profile");
      if (localSaved) {
        return { ...fallback, ...JSON.parse(localSaved) };
      }
    } catch {
      // Ignore
    }
    return fallback;
  });
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Language state
  const [language, setLanguage] = React.useState<"en" | "bn">(() => {
    if (typeof window === "undefined") return "en";
    try {
      const savedLang =
        localStorage.getItem("istiqamaah_lang") ??
        localStorage.getItem("noorpath_lang");
      if (savedLang === "en" || savedLang === "bn") return savedLang;
    } catch {
      // Ignore
    }
    return "en";
  });

  // Notifications state
  const [notifications, setNotifications] = React.useState<SettingsNotifications>(() => {
    const fallback: SettingsNotifications = {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      quranReminder: true,
      habitReminders: true,
      dailyReview: false,
      quietHours: true,
    };
    if (typeof window === "undefined") return fallback;
    try {
      const savedNotifs =
        localStorage.getItem("istiqamaah_notifs") ??
        localStorage.getItem("noorpath_notifs");
      if (savedNotifs) {
        return { ...fallback, ...JSON.parse(savedNotifs) };
      }
    } catch {
      // Ignore
    }
    return fallback;
  });

  // Prayer settings state
  const [prayerSettings, setPrayerSettings] = React.useState<PrayerSettingsState>(() => {
    const local = getLocalPrayerSettings();
    return {
      ...local,
      city: local.city || "Dhaka",
      country: local.country || "Bangladesh",
    };
  });

  React.useEffect(() => {
    let active = true;

    // Fetch user profile from Supabase and prayer settings
    async function loadUserProfile() {
      try {
        const remoteSettings = await fetchUserPrayerSettings();
        if (active && remoteSettings) {
          setPrayerSettings((prev) => ({
            ...prev,
            ...remoteSettings,
            city: remoteSettings.city || prev.city,
            country: remoteSettings.country || prev.country,
          }));
        }
      } catch {
        // Ignore settings fetch error
      }

      if (!isSupabaseConfigured || isDevAuthBypass) {
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && active) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!active) return;

          const userName =
            dbProfile?.name ||
            (user.user_metadata?.name as string) ||
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "Muslim";

          setProfile((prev) => ({
            ...prev,
            name: userName,
            email: user.email || dbProfile?.email || prev.email,
            city: dbProfile?.city || prev.city,
            country: dbProfile?.country || prev.country,
            timezone: dbProfile?.timezone || prev.timezone,
          }));
        }
      } catch (err) {
        console.warn("Failed to load user profile in settings:", err);
      }
    }

    void loadUserProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleLanguageChange = (lang: "en" | "bn") => {
    setLanguage(lang);
    try {
      localStorage.setItem("istiqamaah_lang", lang);
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
      localStorage.setItem("istiqamaah_notifs", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    toast.success(
      updated[key]
        ? "Notification enabled"
        : "Notification disabled",
    );
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      try {
        localStorage.setItem(
          "istiqamaah_local_profile",
          JSON.stringify({
            name: profile.name.trim(),
            city: profile.city.trim(),
            country: profile.country.trim(),
            timezone: profile.timezone,
          }),
        );
        window.dispatchEvent(new Event("istiqamaah_profile_updated"));
      } catch {
        // Ignore storage errors
      }

      if (isSupabaseConfigured && !isDevAuthBypass) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            name: profile.name.trim(),
            city: profile.city.trim(),
            country: profile.country.trim(),
            timezone: profile.timezone,
            updated_at: new Date().toISOString(),
          });

          await supabase.auth.updateUser({
            data: { name: profile.name.trim() },
          });
        }
      }
      toast.success("Profile saved successfully");
    } catch (err) {
      console.warn("Failed to save profile:", err);
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const router = useRouter();

  const handleSignOut = async () => {
    try {
      clearOfflineQueue();
      clearUserLocalData();
      if (isSupabaseConfigured) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.warn("Sign out error:", err);
      router.push("/login");
    }
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      profile,
      language,
      prayerSettings,
      notifications,
      note: "Istiqamaah User Data Export",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `istiqamaah-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Personal data exported successfully");
  };

  const handleResetData = () => {
    if (confirm("Reset local preferences to default?")) {
      try {
        const preferenceKeys = [
          "istiqamaah_lang",
          "noorpath_lang",
          "istiqamaah_notifs",
          "noorpath_notifs",
          "istiqamaah_prayer_settings",
          "noorpath_prayer_settings",
          "istiqamaah_notification_prefs",
          "noorpath_notification_prefs",
        ];
        for (const key of preferenceKeys) {
          localStorage.removeItem(key);
        }
        setLanguage("en");
        setNotifications({
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
              <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg border border-primary/20">
                {profile.name ? profile.name.trim().charAt(0).toUpperCase() : <User className="size-5" />}
              </div>
              <div>
                <CardTitle className="text-base">{profile.name || "My Account"}</CardTitle>
                <CardDescription>{profile.email || "Signed in"}</CardDescription>
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
                  placeholder="Enter your name"
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-email">Email</Label>
                <Input
                  id="prof-email"
                  type="email"
                  value={profile.email}
                  placeholder="your.email@example.com"
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-city">City</Label>
                <Input
                  id="prof-city"
                  value={profile.city}
                  placeholder="e.g. Dhaka, London, Istanbul"
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-country">Country</Label>
                <Input
                  id="prof-country"
                  value={profile.country}
                  placeholder="e.g. Bangladesh, UK, Turkey"
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
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
                disabled={savingProfile}
                onClick={handleSaveProfile}
              >
                {savingProfile ? "Saving..." : "Save Profile"}
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
            onSave={(newSettings) => {
              setPrayerSettings(newSettings);
              saveLocalPrayerSettings(newSettings);
            }}
          />
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Your Location</span>
                <p className="text-xs text-muted-foreground">
                  {prayerSettings.city}, {prayerSettings.country}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {prayerSettings.latitude.toFixed(2)}°, {prayerSettings.longitude.toFixed(2)}° ({prayerSettings.timezone})
                </p>
              </div>
              <Badge variant="outline">Current</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Calculation Method</span>
                <p className="text-xs text-muted-foreground">
                  {CALCULATION_METHODS.find((m) => m.value === prayerSettings.calculationMethod)?.label ||
                    prayerSettings.calculationMethod}
                </p>
              </div>
              <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                {prayerSettings.calculationMethod}
              </Badge>
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
          Data &amp; Privacy
        </h2>
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Advanced Data Export</p>
                <p className="text-xs text-muted-foreground">
                  Export complete CSV datasets, PDF weekly summaries, or structured JSON.
                </p>
              </div>
              <Link
                href="/analytics/export"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                <ExternalLink className="size-4" />
                Analytics Export
              </Link>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Export Settings Backup (JSON)</p>
                <p className="text-xs text-muted-foreground">
                  Download a quick JSON snapshot of your profile, preferences, and prayer settings.
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleExportData}>
                <Download className="size-4" />
                Export Settings
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Privacy Policy &amp; Terms</p>
                <p className="text-xs text-muted-foreground">
                  Review our transparent data collection, RLS security, and Islamic source attribution.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/privacy"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")}
                >
                  <FileText className="size-3.5" />
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")}
                >
                  <FileText className="size-3.5" />
                  Terms of Use
                </Link>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Reset Local Storage</p>
                <p className="text-xs text-muted-foreground">
                  Clears local browser cache and resets preferences to default.
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
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Account Session</p>
                <p className="text-xs text-muted-foreground">
                  Safely sign out and clear your offline synchronization queue.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* About */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About Istiqamaah
        </h2>
        <Card className="border-emerald-600/20 bg-emerald-500/5">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-sm">
              <Sparkles className="size-4" />
              <span>Built with Ihsan for the Ummah</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Istiqamaah is a calm Muslim daily-life companion. Balance your Deen. Organize your life.
              No advertisements, no distracting algorithms, no public religious leaderboards.
              All Hadith and Qur&apos;anic texts are verified from source-controlled collections.
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
