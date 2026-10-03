"use client";

import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { alarmService } from "@/services/audio/alarm-service";
import { formatLocalDateKey, isDateOnlyDueDate } from "@/services/calendar/calendar-service";
import { notificationService } from "@/services/notifications/notification-service";
import { getPrayerDaySummary } from "@/services/prayer";
import { getLocalPrayerSettings } from "@/services/prayer/prayer-settings-service";
import { reminderService, type UserReminder } from "@/services/reminders/reminder-service";
import { taskService } from "@/services/study/task-service";
import type { Task } from "@/services/study/types";
import { MobileNotificationBanner } from "@/components/notifications/mobile-notification-banner";

/**
 * AlarmSchedulerProvider
 *
 * Runs continuously in the background across the entire application:
 * 1. Monitored Prayer Times: Triggers audible alarm chime & notification when Salah time arrives.
 * 2. Monitored Tasks: Triggers reminder alarm & notification when a task deadline arrives.
 * 3. User Reminders: Triggers user reminders (Adhkar, Qur'an, custom) at their scheduled times.
 *
 * Tracks dispatches in sessionStorage to prevent duplicate alarms on the same day.
 */
export function AlarmSchedulerProvider({ children }: { children: React.ReactNode }) {
  const isCheckingRef = useRef(false);

  useEffect(() => {

    const checkSchedules = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const now = new Date();
        const todayKey = formatLocalDateKey(now);
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;
        const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat

        // ==========================================
        // 1. PRAYER TIME ALARM CHECK
        // ==========================================
        try {
          const prayerSettings = getLocalPrayerSettings();
          const summary = await getPrayerDaySummary(prayerSettings, now);

          for (const prayer of summary.prayers) {
            const prayerName = prayer.name.toLowerCase();
            // Only alert for the 5 obligatory prayers
            if (!["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(prayerName)) {
              continue;
            }

            const pTime = prayer.time instanceof Date ? prayer.time : new Date(prayer.time);
            const diffMs = now.getTime() - pTime.getTime();
            const diffMinutes = diffMs / 60000;

            // Trigger if within 0 to 4 minutes after the prayer time (to catch interval ticks reliably)
            if (diffMinutes >= 0 && diffMinutes < 4) {
              const notifKey = `notified_prayer_${prayerName}_${todayKey}`;
              if (!sessionStorage.getItem(notifKey)) {
                sessionStorage.setItem(notifKey, "true");

                // Play Audio Alarm Chime
                alarmService.playPrayerAlarm();

                // Send browser system notification
                const timeFormatted = format(pTime, "h:mm a");
                notificationService.triggerPrayerNotification(prayer.label, timeFormatted);

                // Show interactive in-app toast with stop button
                toast.success(`Salah Time: ${prayer.label} (${timeFormatted})`, {
                  description: "Hayya 'ala-s-Salah — Time for prayer. Take a moment for Allah.",
                  duration: 15000,
                  action: {
                    label: "Stop Sound",
                    onClick: () => alarmService.stopAlarm(),
                  },
                });
              }
            }
          }
        } catch (err) {
          console.warn("Prayer schedule check error:", err);
        }

        // ==========================================
        // 2. TASK REMINDER ALARM CHECK
        // ==========================================
        try {
          const tasks: Task[] = await taskService.getTasks();
          for (const task of tasks) {
            if (task.status === "COMPLETED" || !task.dueDate) continue;

            const isAllDay = isDateOnlyDueDate(task.dueDate);
            if (!isAllDay) {
              // Timed task
              const due = new Date(task.dueDate);
              if (isNaN(due.getTime())) continue;

              const diffMs = now.getTime() - due.getTime();
              const diffMinutes = diffMs / 60000;

              // If due right now (within 0 to 4 minutes)
              if (diffMinutes >= 0 && diffMinutes < 4) {
                const notifKey = `notified_task_${task.id}_${todayKey}_${due.getHours()}_${due.getMinutes()}`;
                if (!sessionStorage.getItem(notifKey)) {
                  sessionStorage.setItem(notifKey, "true");

                  alarmService.playReminderAlarm();
                  const timeFormatted = format(due, "h:mm a");
                  notificationService.triggerTaskReminderNotification(task.title, timeFormatted);

                  toast.info(`Task Due: "${task.title}"`, {
                    description: `Scheduled for ${timeFormatted}.`,
                    duration: 12000,
                    action: {
                      label: "Stop Sound",
                      onClick: () => alarmService.stopAlarm(),
                    },
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn("Task reminder check error:", err);
        }

        // ==========================================
        // 3. USER SCHEDULED REMINDERS CHECK
        // ==========================================
        try {
          const reminders: UserReminder[] = await reminderService.getReminders();
          for (const reminder of reminders) {
            if (!reminder.isEnabled) continue;

            // Check day match
            let isDayMatch = false;
            if (reminder.repeatType === "daily") isDayMatch = true;
            else if (reminder.repeatType === "weekdays") isDayMatch = dayOfWeek >= 1 && dayOfWeek <= 5;
            else if (reminder.daysOfWeek && reminder.daysOfWeek.includes(dayOfWeek)) isDayMatch = true;

            if (!isDayMatch) continue;

            // Check time match (within current minute)
            if (reminder.time === currentTimeStr) {
              const notifKey = `notified_reminder_${reminder.id}_${todayKey}_${reminder.time}`;
              if (!sessionStorage.getItem(notifKey)) {
                sessionStorage.setItem(notifKey, "true");

                if (reminder.soundEnabled) {
                  alarmService.playReminderAlarm();
                }

                notificationService.triggerUserReminderNotification(
                  reminder.title,
                  reminder.description,
                );

                toast.info(`Reminder: ${reminder.title}`, {
                  description: reminder.description || "Scheduled reminder.",
                  duration: 12000,
                  action: {
                    label: "Dismiss",
                    onClick: () => alarmService.stopAlarm(),
                  },
                });
              }
            }
          }
        } catch (err) {
          console.warn("User reminder check error:", err);
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Run immediately on mount
    checkSchedules();

    // Check periodically every 15 seconds
    const interval = setInterval(checkSchedules, 15000);

    // Re-check immediately whenever the mobile user unlocks their phone or focuses the browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSchedules();
      }
    };
    const handleFocus = () => {
      checkSchedules();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <>
      <MobileNotificationBanner />
      {children}
    </>
  );
}
