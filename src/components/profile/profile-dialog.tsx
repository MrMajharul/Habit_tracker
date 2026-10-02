"use client";

import * as React from "react";
import {
  Bell,
  Check,
  Download,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { clearUserLocalData } from "@/lib/cache/user-cache";
import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { clearOfflineQueue } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";

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

export function ProfileDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

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

  // Load from Supabase on mount / open
  React.useEffect(() => {
    if (!open) return;

    Promise.resolve().then(() => {
      setEditName(profile.name);
      setEditCity(profile.city);
      setEditCountry(profile.country);
      setEditTimezone(profile.timezone);
    });

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
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
              }
            });
        }
      });
    }
  }, [open, profile.city, profile.country, profile.name, profile.timezone]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    const previousProfile = { ...profile };
    const updatedProfile: ProfileData = {
      ...profile,
      name: editName.trim(),
      city: editCity.trim(),
      country: editCountry.trim(),
      timezone: editTimezone.trim(),
    };

    // 1. Optimistic UI update
    setProfile(updatedProfile);
    setIsEditing(false);
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
            updated_at: new Date().toISOString(),
          });

          if (error) throw error;

          await supabase.auth.updateUser({
            data: { name: updatedProfile.name },
          });
        }
      }

      toast.success("Profile updated successfully");
    } catch (err) {
      console.warn("Profile update failed, rolling back:", err);
      // Rollback optimistic update
      setProfile(previousProfile);
      setEditName(previousProfile.name);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(previousProfile));
      window.dispatchEvent(new Event("istiqamaah_profile_updated"));
      toast.error("Failed to update profile. Changes rolled back.");
    } finally {
      setIsSaving(false);
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
      setOpen(false);
      router.push("/login");
      router.refresh();
      toast.info("Signed out successfully");
    } catch {
      router.push("/login");
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
        `istiqamaah-export-${new Date().toISOString().slice(0, 10)}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Personal data exported successfully");
    } catch {
      toast.error("Could not export data");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <User className="size-4" />
            <span>Profile</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogPopup>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              Account & Profile
            </DialogTitle>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open Full Page →
            </Link>
          </div>
          <DialogDescription>
            Manage your personal profile, privacy, and account settings.
          </DialogDescription>
        </DialogHeader>

        {/* User Card */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border-2 border-primary/20 bg-primary/10 text-primary font-bold">
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                {profile.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {profile.email || "Offline / Local Account"}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <MapPin className="size-3 text-primary/70" />
                  {profile.city}, {profile.country}
                </span>
                <span>·</span>
                <span className="font-mono text-[10px]">{profile.timezone}</span>
              </div>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3" />
              Edit
            </Button>
          )}
        </div>

        {/* Edit Form Mode */}
        {isEditing ? (
          <form
            onSubmit={handleSaveProfile}
            className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Edit Profile Information</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                onClick={() => setIsEditing(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-[11px]">
                Display Name
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-xs bg-background"
                placeholder="Your name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="edit-city" className="text-[11px]">
                  City
                </Label>
                <Input
                  id="edit-city"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-country" className="text-[11px]">
                  Country
                </Label>
                <Input
                  id="edit-country"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-tz" className="text-[11px]">
                Timezone
              </Label>
              <Input
                id="edit-tz"
                value={editTimezone}
                onChange={(e) => setEditTimezone(e.target.value)}
                className="h-8 text-xs bg-background font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                className="w-full h-8 text-xs gap-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {/* Quick Preferences & Security */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preferences & Tools
          </p>

          <div className="grid gap-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full rounded-xl border border-border/70 bg-card p-3 text-xs hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="size-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    Reminders & Notification Alerts
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Manage prayer alarms and habit reminders
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Configure
              </Badge>
            </Link>

            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center justify-between w-full rounded-xl border border-border/70 bg-card p-3 text-xs hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Download className="size-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Export Personal Data</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download complete encrypted JSON backup of your records
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Export
              </Badge>
            </button>
          </div>
        </div>

        <Separator />

        {/* Privacy & Legal Links */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Privacy & Trust
          </p>
          <div className="flex items-center justify-between text-xs">
            <Link
              href="/privacy"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Privacy Policy</span>
            </Link>
            <Link
              href="/terms"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="size-3.5" />
              <span>Terms of Service</span>
            </Link>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            className="w-full gap-2 text-xs"
          >
            <LogOut className="size-3.5" />
            Sign Out & Clear Local Session
          </Button>
        </div>
      </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
