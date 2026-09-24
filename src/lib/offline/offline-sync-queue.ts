import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export type OfflineActionType = "LOG_HABIT" | "LOG_PRAYER" | "CREATE_HABIT";

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = "noorpath_offline_sync_queue";

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
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
