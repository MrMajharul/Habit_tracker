"use client";

import * as React from "react";
import {
  Bell,
  Compass,
  Download,
  FileText,
  Globe,
  HardDrive,
  Languages,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Moon,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearUserLocalData } from "@/lib/cache/user-cache";
import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { clearOfflineQueue, getOfflineQueue } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  NotificationService,
  type NotificationPermissionState,
} from "@/services/notifications/notification-service";
import { ReminderSettingsDialog } from "@/components/settings/reminder-settings-dialog";

export interface ProfileData {
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  language: string;
}

const PROFILE_STORAGE_KEY = "istiqamaah_local_profile";
const LEGACY_STORAGE_KEY = "noorpath_local_profile";

type ProfileTab = "identity" | "preferences" | "data" | "security";

interface TabDefinition {
  id: ProfileTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDefinition[] = [
  {
    id: "identity",
    label: "Identity & Location",
    description: "Display name and prayer timing coordinates",
    icon: User,
  },
  {
    id: "preferences",
    label: "Worship & Routine",
    description: "Prayer calculation, adhan alarms, and themes",
    icon: Compass,
  },
  {
    id: "data",
    label: "Privacy & Backup",
    description: "Offline cache, data ownership, and export",
    icon: HardDrive,
  },
  {
    id: "security",
    label: "Account & Session",
    description: "Cloud sync status and sign out",
    icon: ShieldCheck,
  },
];

export function ProfilePageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<ProfileTab>("identity");
  const [isSaving, setIsSaving] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0);
  const [localStorageItemCount, setLocalStorageItemCount] = React.useState(0);
  const [permission, setPermission] =
    React.useState<NotificationPermissionState>("default");
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("dark");

  const [profile, setProfile] = React.useState<ProfileData>(() => {
    const fallback: ProfileData = {
      name: "Muslim",
      email: "",
      city: "Dhaka",
      country: "Bangladesh",
      timezone: "Asia/Dhaka",
      language: "en",
    };

    if (typeof window === "undefined") return fallback;

    try {
      const saved =
        localStorage.getItem(PROFILE_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        return { ...fallback, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore
    }
    return fallback;
  });

  const [editName, setEditName] = React.useState(profile.name);
  const [editCity, setEditCity] = React.useState(profile.city);
  const [editCountry, setEditCountry] = React.useState(profile.country);
  const [editTimezone, setEditTimezone] = React.useState(profile.timezone);
  const [editLanguage, setEditLanguage] = React.useState(profile.language || "en");

  // Load profile & initial stats on mount
  React.useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      const notif = new NotificationService();
      setPermission(notif.getPermission());

      // Count local items
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("istiqamaah_") || key?.startsWith("noorpath_")) {
          count++;
        }
      }
      setLocalStorageItemCount(count);
      setPendingSyncCount(getOfflineQueue().length);

      // Read current theme class
      if (document.documentElement.classList.contains("dark")) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    });

    // Load from Supabase if online
    if (isSupabaseConfigured && !isDevAuthBypass) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("profiles")
            .select("name, email, city, country, timezone, preferred_language")
            .eq("id", user.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                const updated: ProfileData = {
                  name: data.name || user.user_metadata?.name || user.email?.split("@")[0] || "Muslim",
                  email: user.email || data.email || "",
                  city: data.city || "Dhaka",
                  country: data.country || "Bangladesh",
                  timezone: data.timezone || "Asia/Dhaka",
                  language: data.preferred_language || "en",
                };
                setProfile(updated);
                setEditName(updated.name);
                setEditCity(updated.city);
                setEditCountry(updated.country);
                setEditTimezone(updated.timezone);
                setEditLanguage(updated.language);
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
              }
            });
        }
      });
    }
  }, []);

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setEditTimezone(detected);
        toast.success(`Timezone set to ${detected}`);
      }
    } catch {
      toast.error("Could not auto-detect timezone");
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
      localStorage.removeItem("theme");
    } else {
      root.classList.toggle("dark", newTheme === "dark");
      localStorage.setItem("theme", newTheme);
    }
    toast.success(`Theme switched to ${newTheme}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    const previousProfile = { ...profile };
    const updatedProfile: ProfileData = {
      ...profile,
      name: editName.trim(),
      city: editCity.trim(),
      country: editCountry.trim(),
      timezone: editTimezone.trim(),
      language: editLanguage,
    };

    // Optimistic UI update
    setProfile(updatedProfile);
    setIsSaving(true);

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      window.dispatchEvent(new Event("istiqamaah_profile_updated"));

      if (isSupabaseConfigured && !isDevAuthBypass) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            name: updatedProfile.name,
            city: updatedProfile.city,
            country: updatedProfile.country,
            timezone: updatedProfile.timezone,
            preferred_language: updatedProfile.language,
            updated_at: new Date().toISOString(),
          });

          if (error) throw error;

          await supabase.auth.updateUser({
            data: { name: updatedProfile.name },
          });
        }
      }

      toast.success("Profile saved successfully");
    } catch (err) {
      console.warn("Profile update failed, rolling back:", err);
      setProfile(previousProfile);
      setEditName(previousProfile.name);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(previousProfile));
      window.dispatchEvent(new Event("istiqamaah_profile_updated"));
      toast.error("Failed to save profile. Changes reverted.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    try {
      const keys = Object.keys(localStorage);
      const exportObject: Record<string, unknown> = {};

      keys.forEach((key) => {
        if (key.startsWith("istiqamaah_") || key.startsWith("noorpath_")) {
          try {
            exportObject[key] = JSON.parse(localStorage.getItem(key) || "");
          } catch {
            exportObject[key] = localStorage.getItem(key);
          }
        }
      });

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `istiqamaah-backup-${new Date().toISOString().slice(0, 10)}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Personal backup JSON exported successfully");
    } catch {
      toast.error("Could not export personal data");
    }
  };

  const handleSignOut = async () => {
    try {
      clearOfflineQueue();
      clearUserLocalData();
      if (isSupabaseConfigured && !isDevAuthBypass) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      router.push("/login");
      router.refresh();
      toast.info("Signed out safely");
    } catch {
      router.push("/login");
    }
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "M";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Manage Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Personal identity, prayer timing coordinates, worship preferences, and local data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportData}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            <span>Export Backup</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleSignOut}
            className="h-8 gap-1.5 text-xs"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Hero Profile Overview Card */}
      <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-card via-card to-primary/5 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2 border-primary/30 bg-primary/10 text-primary font-bold shadow-xs">
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">
                    {profile.name}
                  </h2>
                  <Badge variant="secondary" className="gap-1 text-[11px] font-medium bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="size-3" />
                    <span>{isSupabaseConfigured && !isDevAuthBypass ? "Cloud Synced" : "Privacy Mode"}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.email || "Local Offline Account"}
                </p>
                <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary/70" />
                    {profile.city}, {profile.country}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Globe className="size-3 text-primary/70" />
                    {profile.timezone}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 items-start sm:items-end justify-between border-t border-border/40 pt-3 sm:border-0 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Local Cache
                </p>
                <p className="text-xs font-medium text-foreground">
                  {localStorageItemCount} items stored locally
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                <ShieldCheck className="size-3" />
                <span>RLS Protected</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar min-w-0 max-w-full" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm whitespace-nowrap border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card/70 text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Identity & Location */}
      {activeTab === "identity" && (
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <CardTitle className="text-base font-bold">Personal Information</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Update your display name and geographical coordinates. Prayer calculations use your city and country to compute precise astronomical prayer times.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name" className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    Display Name
                  </Label>
                  <Input
                    id="prof-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Majharul Islam"
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used for daily greetings and personal reflections.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-email" className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="size-3.5 text-muted-foreground" />
                    Account Email (Protected)
                  </Label>
                  <Input
                    id="prof-email"
                    value={profile.email || "Offline / Local Guest"}
                    disabled
                    className="h-9 text-xs bg-muted/40 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Managed by your authentication provider.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-city" className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    City
                  </Label>
                  <Input
                    id="prof-city"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Dhaka, London, Istanbul"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-country" className="text-xs font-semibold flex items-center gap-1.5">
                    <Globe className="size-3.5 text-primary" />
                    Country
                  </Label>
                  <Input
                    id="prof-country"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="e.g. Bangladesh, UK, Turkey"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prof-tz" className="text-xs font-semibold flex items-center gap-1.5">
                      <Globe className="size-3.5 text-primary" />
                      Timezone
                    </Label>
                    <button
                      type="button"
                      onClick={handleAutoDetectTimezone}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" />
                      Detect Current Timezone
                    </button>
                  </div>
                  <Input
                    id="prof-tz"
                    value={editTimezone}
                    onChange={(e) => setEditTimezone(e.target.value)}
                    placeholder="e.g. Asia/Dhaka"
                    className="h-9 text-xs font-mono"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ensures your prayer calculations and midnight streak rollovers align with your clock.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="prof-lang" className="text-xs font-semibold flex items-center gap-1.5">
                    <Languages className="size-3.5 text-primary" />
                    Preferred Language
                  </Label>
                  <select
                    id="prof-lang"
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="en">English (Default)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-border/60">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="gap-2 text-xs h-9 px-4 font-semibold"
                >
                  {isSaving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Worship & Preferences */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Prayer Calculation Card */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="size-5 text-primary" />
                  <CardTitle className="text-sm font-bold">Prayer Calculations</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Coordinates configured for {profile.city}, {profile.country} ({profile.timezone}).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculation Engine:</span>
                    <span className="font-semibold text-foreground">Astronomical (Adhan)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jurisprudence:</span>
                    <span className="font-semibold text-foreground">Standard / Hanafi (configurable)</span>
                  </div>
                </div>

                <Link href="/prayer" className="block w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                    <Compass className="size-3.5" />
                    Open Prayer Schedule & Times
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Reminders & Adhan Alarms Card */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="size-5 text-primary" />
                  <CardTitle className="text-sm font-bold">Reminders & Notification Alerts</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Manage prayer alarms, Qur&apos;an recitation reminders, and habit alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-muted/40 p-3 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Browser Permission:</span>
                  <Badge
                    variant={permission === "granted" ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] capitalize",
                      permission === "granted" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                    )}
                  >
                    {permission}
                  </Badge>
                </div>

                <ReminderSettingsDialog />
              </CardContent>
            </Card>
          </div>

          {/* Theme & Visual Appearance */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Theme & Appearance</CardTitle>
              <CardDescription className="text-xs">
                Select your preferred visual theme for reading and worship.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mounted && (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all",
                      theme === "light"
                        ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                        : "border-border/80 hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <Sun className="size-5" />
                    <span className="text-xs">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all",
                      theme === "dark"
                        ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                        : "border-border/80 hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <Moon className="size-5" />
                    <span className="text-xs">Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("system")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all",
                      theme === "system"
                        ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                        : "border-border/80 hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <RefreshCw className="size-5" />
                    <span className="text-xs">System</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Privacy & Data Backup */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="size-5 text-primary" />
                <CardTitle className="text-sm font-bold">Data Ownership & Local Storage</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Istiqamah operates with a strict privacy-first architecture. Your worship records are never sold, analyzed for advertising, or synthesized with AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-foreground">Local Offline Cache</p>
                  <p className="text-[11px] text-muted-foreground">
                    {localStorageItemCount} data collections stored in your browser storage.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-foreground">Offline Sync Queue</p>
                  <p className="text-[11px] text-muted-foreground">
                    {pendingSyncCount === 0
                      ? "All recent records are synchronized."
                      : `${pendingSyncCount} action(s) pending sync.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Full JSON Backup</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download an encrypted export of your personal habits, prayer history, and reflections.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleExportData}
                  className="gap-1.5 text-xs h-8 shrink-0"
                >
                  <Download className="size-3.5" />
                  Download Backup (JSON)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Legal links card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-bold">Privacy & Legal Trust</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Clear policies governing how your data is handled.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/privacy"
                className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-semibold text-foreground">Privacy Policy</p>
                    <p className="text-[11px] text-muted-foreground">No tracking, no data monetization</p>
                  </div>
                </div>
                <FileText className="size-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/terms"
                className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Terms of Service</p>
                    <p className="text-[11px] text-muted-foreground">Transparent usage conditions</p>
                  </div>
                </div>
                <FileText className="size-3.5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Account Security & Session */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle className="text-sm font-bold">Account Session & Authentication</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Manage your active login session and offline client device cache.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Authentication Status:</span>
                  <span className="font-semibold text-foreground">
                    {profile.email ? `Signed in (${profile.email})` : "Guest / Local Mode"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Database Protection:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Row-Level Security (RLS) Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <LogOut className="size-5" />
                <CardTitle className="text-sm font-bold">Sign Out & Cache Purge</CardTitle>
              </div>
              <CardDescription className="text-xs text-destructive/80">
                Signing out purges your user-scoped offline cache and sync queue from this browser to preserve your privacy on shared devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-xs h-9 px-4 font-semibold"
              >
                <LogOut className="size-3.5" />
                Sign Out & Clear Local Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
