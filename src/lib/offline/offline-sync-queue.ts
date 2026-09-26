import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export type OfflineActionType =
  | "LOG_HABIT"
  | "LOG_PRAYER"
  | "CREATE_HABIT"
  | "delete_habit"
  | "create_task"
  | "update_task"
  | "delete_task"
  | "toggle_task"
  | "create_subject"
  | "update_subject"
  | "delete_subject"
  | "save_focus_session"
  | "create_quran_reading_session"
  | "update_quran_goal"
  | "create_quran_bookmark"
  | "delete_quran_bookmark"
  | "update_quran_reading_position";

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = "istiqamaah_offline_sync_queue";
const LEGACY_QUEUE_KEY = "noorpath_offline_sync_queue";

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(QUEUE_KEY) ??
      localStorage.getItem(LEGACY_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage quota
  }
}

export function enqueueOfflineAction(action: Omit<OfflineAction, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };

  // Deduplicate: If an action for the exact same target already exists, replace it with the latest
  let filtered = queue;
  if (action.type === "LOG_HABIT") {
    filtered = queue.filter(
      (a) =>
        !(
          a.type === "LOG_HABIT" &&
          a.payload.habitId === action.payload.habitId &&
          a.payload.date === action.payload.date
        ),
    );
  } else if (action.type === "LOG_PRAYER") {
    filtered = queue.filter(
      (a) =>
        !(
          a.type === "LOG_PRAYER" &&
          a.payload.prayer === action.payload.prayer &&
          a.payload.dateStr === action.payload.dateStr
        ),
    );
  } else if (action.type === "delete_task") {
    filtered = queue.filter((a) => a.payload?.id !== action.payload?.id);
  } else if (action.type === "delete_subject") {
    filtered = queue.filter((a) => a.payload?.id !== action.payload?.id);
  } else if (action.type === "delete_habit") {
    filtered = queue.filter(
      (a) =>
        a.payload?.id !== action.payload?.id &&
        !(a.type === "CREATE_HABIT" && a.payload?.id === action.payload?.id),
    );
  }

  filtered.push(newAction);
  saveOfflineQueue(filtered);
}

export async function flushOfflineQueue(): Promise<{
  successCount: number;
  failedCount: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { successCount: 0, failedCount: 0 };
  }

  if (!isSupabaseConfigured || isDevAuthBypass) {
    // If running in mock/dev mode, clear the queue as locally persisted
    saveOfflineQueue([]);
    return { successCount: 0, failedCount: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { successCount: 0, failedCount: 0 };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { successCount: 0, failedCount: 0 };

  const remaining: OfflineAction[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      if (item.type === "LOG_HABIT") {
        const { habitId, date, completed, value } = item.payload;
        await supabase.from("habit_logs").upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            date,
            completed,
            value: value ?? 1,
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "habit_id,date" },
        );
        successCount++;
      } else if (item.type === "CREATE_HABIT") {
        const h = item.payload;
        await supabase.from("habits").upsert({
          id: h.id,
          user_id: user.id,
          name: h.name,
          description: h.description || null,
          icon: h.icon,
          category: h.category,
          frequency: h.frequency,
          target_value: h.targetValue ?? 1,
          target_unit: h.targetUnit || null,
          reminder_enabled: h.reminderEnabled ?? false,
          reminder_time: h.reminderTime || null,
          prayer_anchor: h.prayerAnchor || "none",
          start_date: h.startDate || new Date().toISOString().split("T")[0],
          is_active: h.isActive ?? true,
          created_at: h.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        successCount++;
      } else if (item.type === "delete_habit") {
        await supabase
          .from("habits")
          .delete()
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "LOG_PRAYER") {
        const { prayer, completed, dateStr } = item.payload;
        if (completed) {
          await supabase.from("prayer_logs").upsert(
            {
              user_id: user.id,
              prayer,
              date: dateStr,
              status: "completed",
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,prayer,date" },
          );
        } else {
          await supabase
            .from("prayer_logs")
            .delete()
            .eq("user_id", user.id)
            .eq("prayer", prayer)
            .eq("date", dateStr);
        }
        successCount++;
      } else if (item.type === "create_task") {
        await supabase.from("tasks").upsert({
          ...item.payload,
          user_id: user.id,
        });
        successCount++;
      } else if (item.type === "update_task") {
        await supabase
          .from("tasks")
          .update({
            ...item.payload.updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "delete_task") {
        await supabase
          .from("tasks")
          .delete()
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "toggle_task") {
        await supabase
          .from("tasks")
          .update({
            status: item.payload.status,
            completed_at:
              item.payload.status === "COMPLETED"
                ? new Date().toISOString()
                : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "create_subject") {
        await supabase.from("subjects").upsert({
          ...item.payload,
          user_id: user.id,
        });
        successCount++;
      } else if (item.type === "update_subject") {
        await supabase
          .from("subjects")
          .update({
            ...item.payload.updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "delete_subject") {
        await supabase
          .from("subjects")
          .delete()
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "save_focus_session") {
        await supabase.from("focus_sessions").upsert({
          ...item.payload,
          user_id: user.id,
        });
        successCount++;
      } else if (item.type === "create_quran_reading_session") {
        await supabase.from("quran_reading_sessions").upsert({
          ...item.payload,
          user_id: user.id,
        });
        successCount++;
      } else if (item.type === "update_quran_goal") {
        const { action, ...payload } = item.payload;
        if (action === "create_spiritual_goal") {
          await supabase.from("spiritual_goals").upsert({
            ...payload,
            user_id: user.id,
          });
        } else if (action === "update_spiritual_goal") {
          const { id: goalId, ...updates } = payload;
          await supabase
            .from("spiritual_goals")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", goalId)
            .eq("user_id", user.id);
        } else {
          // Default: upsert goal settings
          await supabase.from("quran_goal_settings").upsert({
            ...payload,
            user_id: user.id,
            updated_at: new Date().toISOString(),
          });
        }
        successCount++;
      } else if (item.type === "create_quran_bookmark") {
        await supabase.from("quran_bookmarks").upsert({
          ...item.payload,
          user_id: user.id,
        });
        successCount++;
      } else if (item.type === "delete_quran_bookmark") {
        await supabase
          .from("quran_bookmarks")
          .delete()
          .eq("id", item.payload.id)
          .eq("user_id", user.id);
        successCount++;
      } else if (item.type === "update_quran_reading_position") {
        // Reading position is stored as part of user preferences / last session
        // The position is synced through the latest reading session
        successCount++;
      }
    } catch (err) {
      console.warn("Offline action sync failed, will retry:", err);
      failedCount++;
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return { successCount, failedCount };
}

// Auto-register online listener on client side
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Online connection restored, flushing offline queue...");
    flushOfflineQueue().catch(console.warn);
  });
}
