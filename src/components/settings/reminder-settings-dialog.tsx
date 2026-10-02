"use client";

import * as React from "react";
import {
  Bell,
  BellOff,
  Check,
  Clock,
  Info,
  Loader2,
  Play,
  Plus,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { alarmService } from "@/services/audio/alarm-service";

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
import { cn } from "@/lib/utils";
import {
  NotificationService,
  type NotificationPermissionState,
} from "@/services/notifications/notification-service";
import {
  reminderService,
  type ReminderType,
  type RepeatType,
  type UserReminder,
} from "@/services/reminders/reminder-service";

const notifService = new NotificationService();

const REMINDER_TYPE_LABELS: Record<ReminderType, { label: string; url: string }> = {
  salah: { label: "Salah", url: "/prayer" },
  quran: { label: "Qur'an", url: "/quran" },
  dhikr: { label: "Dhikr", url: "/dhikr" },
  habit: { label: "Habit", url: "/habits" },
  study: { label: "Study & Work", url: "/study" },
  custom: { label: "Custom", url: "/dashboard" },
};

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function ReminderSettingsDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [reminders, setReminders] = React.useState<UserReminder[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermissionState>("default");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(() => alarmService.isSoundEnabled());

  // New reminder form fields
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState<ReminderType>("salah");
  const [newTime, setNewTime] = React.useState("05:30");
  const [newRepeat, setNewRepeat] = React.useState<RepeatType>("daily");
  const [newSound, setNewSound] = React.useState(true);

  const handleToggleGlobalSound = () => {
    const next = !soundEnabled;
    alarmService.setSoundEnabled(next);
    setSoundEnabled(next);
    toast.info(next ? "Alarm audio enabled" : "Alarm audio muted");
  };

  const loadReminders = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await reminderService.getReminders();
      setReminders(data);
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      loadReminders();
      setPermission(notifService.getPermission());
      setSoundEnabled(alarmService.isSoundEnabled());
    });
  }, [open, loadReminders]);

  const handleRequestPermission = async () => {
    try {
      const status = await notifService.requestPermission();
      setPermission(status);
      if (status === "granted") {
        toast.success("Notification permissions enabled");
      } else if (status === "denied") {
        toast.error("Notifications blocked by browser settings");
      }
    } catch {
      toast.error("Could not request notification permissions");
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      const next = !currentState;
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isEnabled: next } : r)),
      );
      await reminderService.toggleReminder(id, next);
      toast.success(`Reminder ${next ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update reminder");
      loadReminders();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      await reminderService.deleteReminder(id);
      toast.info("Reminder removed");
    } catch {
      toast.error("Failed to delete reminder");
      loadReminders();
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a reminder title");
      return;
    }

    try {
      const targetUrl = REMINDER_TYPE_LABELS[newType].url;
      const created = await reminderService.createReminder({
        userId: "dev-user-local",
        title: newTitle.trim(),
        description: null,
        reminderType: newType,
        time: newTime,
        repeatType: newRepeat,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        soundEnabled: newSound,
        vibrationEnabled: newSound,
        targetUrl,
      });

      setReminders((prev) => [...prev, created]);
      setShowAddForm(false);
      setNewTitle("");
      toast.success("Reminder created successfully");
    } catch {
      toast.error("Failed to create reminder");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="size-4" />
            Reminders & Alarms
          </Button>
        )}
      </DialogTrigger>

      <DialogPopup>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Reminders & Alarms
          </DialogTitle>
          <DialogDescription>
            Manage prayer alarms, Qur&apos;an reminders, and habit alerts.
          </DialogDescription>
        </DialogHeader>

        {/* Permission status card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {permission === "granted" ? (
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-4" />
                </div>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <BellOff className="size-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Browser Notifications:{" "}
                  <span className="capitalize">{permission}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {permission === "granted"
                    ? "Alarms will notify you via service worker."
                    : "Permission needed for background notification alerts."}
                </p>
              </div>
            </div>

            {permission !== "granted" && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={handleRequestPermission}
              >
                Enable
              </Button>
            )}
          </div>
        </div>

        {/* Audio & Alarm Tone Preview card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="size-4 text-primary" />
              ) : (
                <VolumeX className="size-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Alarm Sounds ({soundEnabled ? "Enabled" : "Muted"})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Synthesized offline Web Audio alarms
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={soundEnabled}
              onChange={handleToggleGlobalSound}
              ariaLabel="Toggle alarm audio"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5 gap-1.5"
              onClick={() => {
                alarmService.testSound("focus");
                toast.info("Playing Focus Session alarm...");
              }}
            >
              <Play className="size-3 text-primary" />
              Focus Alarm
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5 gap-1.5"
              onClick={() => {
                alarmService.testSound("prayer");
                toast.info("Playing Prayer Adhan chime...");
              }}
            >
              <Play className="size-3 text-emerald-600 dark:text-emerald-400" />
              Salah Alarm
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5 gap-1.5"
              onClick={() => {
                alarmService.testSound("reminder");
                toast.info("Playing Task Reminder chime...");
              }}
            >
              <Play className="size-3 text-blue-600 dark:text-blue-400" />
              Task Chime
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                alarmService.stopAlarm();
                toast.info("Alarm stopped");
              }}
            >
              <Square className="size-3" />
              Stop
            </Button>
          </div>
        </div>

        {/* List of Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Scheduled Reminders ({reminders.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="size-3.5" />
              {showAddForm ? "Cancel" : "Add Alarm"}
            </Button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateReminder}
              className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs"
            >
              <p className="font-semibold text-foreground">Create New Reminder</p>
              <div className="space-y-1">
                <Label htmlFor="title" className="text-[11px]">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Tahajjud or Morning Adhkar"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Type</Label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ReminderType)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="salah">Salah</option>
                    <option value="quran">Qur&apos;an</option>
                    <option value="dhikr">Dhikr</option>
                    <option value="habit">Habit</option>
                    <option value="study">Study & Work</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Time</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Repeat</Label>
                <select
                  value={newRepeat}
                  onChange={(e) => setNewRepeat(e.target.value as RepeatType)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="once">Once</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Sound & Vibration</span>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={newSound}
                    onChange={() => setNewSound(!newSound)}
                    ariaLabel="Toggle sound"
                  />
                </div>
              </div>

              <Button type="submit" size="sm" className="w-full h-8 text-xs mt-2">
                Save Reminder
              </Button>
            </form>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No reminders configured. Tap &ldquo;Add Alarm&rdquo; to create one.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 shadow-2xs transition-colors hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold font-mono">
                          {r.time}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
                          {r.reminderType}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        {r.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {r.repeatType === "daily" ? "Daily" : r.repeatType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ToggleSwitch
                      checked={r.isEnabled}
                      onChange={() => handleToggle(r.id, r.isEnabled)}
                      ariaLabel={`Toggle ${r.title}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(r.id)}
                      title="Delete reminder"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform limitations notice */}
        <div className="flex items-start gap-2 rounded-xl bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
          <Info className="size-4 shrink-0 mt-0.5 text-primary/70" />
          <p>
            Browser alarms rely on the PWA Service Worker. Ensure notifications
            and background sync are allowed in your browser or device settings.
          </p>
        </div>
      </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
