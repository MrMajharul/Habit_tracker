"use client";

import React, { useState } from "react";
import { Bell, Volume2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { alarmService } from "@/services/audio/alarm-service";
import { notificationService } from "@/services/notifications/notification-service";

const DISMISS_KEY = "istiqamaah_notif_banner_dismissed_v1";

function getInitialPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

function getInitialDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export function MobileNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getInitialPermission);
  const [dismissed, setDismissed] = useState<boolean>(getInitialDismissed);

  if (permission === "granted" || permission === "unsupported" || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    // 1. Prime mobile Web Audio hardware during user touch gesture
    alarmService.unlockMobileAudio();

    try {
      const status = await notificationService.requestPermission();
      setPermission(status as NotificationPermission);

      if (status === "granted") {
        // Play gentle chime to confirm audio channel is active
        alarmService.playReminderAlarm();
        toast.success("Alhamdulillah! Alarms & notifications are now enabled on this device.");
      } else if (status === "denied") {
        toast.error(
          "Notifications blocked. In Chrome: Tap the 🔒 icon in the address bar > Permissions > Notifications > Allow.",
          { duration: 8000 }
        );
      }
    } catch {
      toast.error("Could not request notification permissions.");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Ignore
    }
  };

  return (
    <aside aria-label="Mobile notifications prompt" className="relative z-40 bg-linear-to-r from-primary/10 via-primary/15 to-emerald-500/10 border-b border-primary/20 px-4 py-2.5 shadow-2xs backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Bell className="size-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate sm:text-xs">
              Enable Mobile Alarms &amp; Notifications
            </p>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Allow background audio for Salah times, focus timer alarms, and task reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleEnable}
            className="h-7 px-3 text-xs gap-1.5 font-medium shadow-2xs"
          >
            <Volume2 className="size-3.5" />
            <span>Enable Now</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss banner"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
