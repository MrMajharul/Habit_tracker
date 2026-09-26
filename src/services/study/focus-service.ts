import { isSameDay, startOfWeek, subDays } from "date-fns";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import { subjectService } from "./subject-service";
import { taskService } from "./task-service";
import type {
  FocusSession,
  FocusSessionStatus,
  ProductivityAnalytics,
} from "./types";

export const FOCUS_SESSIONS_STORE_KEY = "istiqamaah_focus_sessions_data";

export const INITIAL_FOCUS_SESSIONS: FocusSession[] = [
  {
    id: "foc-1",
    userId: "dev-user",
    taskId: "task-1",
    subjectId: "sub-2",
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 3 + 25 * 60000).toISOString(),
    plannedMinutes: 25,
    actualMinutes: 25,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    taskTitle: "Implement FIRST & FOLLOW Sets parser phase",
    subjectName: "Compiler Design",
  },
  {
    id: "foc-2",
    userId: "dev-user",
    taskId: "task-4",
    subjectId: "sub-4",
    startedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 6 + 45 * 60000).toISOString(),
    plannedMinutes: 50,
    actualMinutes: 45,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    taskTitle: "Literature review: Quranic Arabic morphological taggers",
    subjectName: "Research & Writing",
  },
  {
    id: "foc-3",
    userId: "dev-user",
    taskId: "task-2",
    subjectId: "sub-1",
    startedAt: subDays(new Date(), 1).toISOString(),
    endedAt: new Date(subDays(new Date(), 1).getTime() + 25 * 60000).toISOString(),
    plannedMinutes: 25,
    actualMinutes: 25,
    status: "COMPLETED",
    createdAt: subDays(new Date(), 1).toISOString(),
    taskTitle: "Gradient Descent and Backpropagation derivation",
    subjectName: "Machine Learning",
  },
];

export class FocusService {
  private getLocalSessions(): FocusSession[] {
    if (typeof window === "undefined") return INITIAL_FOCUS_SESSIONS;
    try {
      const raw = localStorage.getItem(FOCUS_SESSIONS_STORE_KEY);
      if (!raw) {
        localStorage.setItem(
          FOCUS_SESSIONS_STORE_KEY,
          JSON.stringify(INITIAL_FOCUS_SESSIONS),
        );
        return INITIAL_FOCUS_SESSIONS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_FOCUS_SESSIONS;
    }
  }

  private saveLocalSessions(sessions: FocusSession[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(FOCUS_SESSIONS_STORE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn("Could not save focus sessions locally:", e);
    }
  }

  async getSessions(options?: {
    since?: Date;
    subjectId?: string;
    taskId?: string;
  }): Promise<FocusSession[]> {
    let sessions: FocusSession[] = [];

    if (!isSupabaseConfigured || isDevAuthBypass || typeof window === "undefined") {
      sessions = this.getLocalSessions();
    } else {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          sessions = this.getLocalSessions();
        } else {
          let query = supabase
            .from("focus_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("started_at", { ascending: false });

          if (options?.since) {
            query = query.gte("started_at", options.since.toISOString());
          }
          if (options?.subjectId) {
            query = query.eq("subject_id", options.subjectId);
          }
          if (options?.taskId) {
            query = query.eq("task_id", options.taskId);
          }

          const { data, error } = await query;
          if (error || !data || data.length === 0) {
            sessions = this.getLocalSessions();
          } else {
            sessions = data.map((d) => ({
              id: d.id,
              userId: d.user_id,
              taskId: d.task_id,
              subjectId: d.subject_id,
              startedAt: d.started_at,
              endedAt: d.ended_at,
              plannedMinutes: d.planned_minutes,
              actualMinutes: d.actual_minutes,
              status: (d.status as FocusSessionStatus) || "COMPLETED",
              createdAt: d.created_at,
            }));
            this.saveLocalSessions(sessions);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch focus sessions from Supabase, returning local:", err);
        sessions = this.getLocalSessions();
      }
    }

    if (options?.since) {
      const sinceTime = options.since.getTime();
      sessions = sessions.filter((s) => new Date(s.startedAt).getTime() >= sinceTime);
    }
    if (options?.subjectId) {
      sessions = sessions.filter((s) => s.subjectId === options.subjectId);
    }
    if (options?.taskId) {
      sessions = sessions.filter((s) => s.taskId === options.taskId);
    }

    return sessions;
  }

  async getTodaySessions(): Promise<FocusSession[]> {
    const today = new Date();
    const all = await this.getSessions();
    return all.filter((s) => isSameDay(new Date(s.startedAt), today));
  }

  async recordSession(params: {
    taskId?: string | null;
    subjectId?: string | null;
    startedAt: string;
    endedAt?: string | null;
    plannedMinutes: number;
    actualMinutes: number;
    status: FocusSessionStatus;
    taskTitle?: string;
    subjectName?: string;
  }): Promise<FocusSession> {
    const newSession: FocusSession = {
      id: crypto.randomUUID(),
      userId: "user",
      taskId: params.taskId || null,
      subjectId: params.subjectId || null,
      startedAt: params.startedAt,
      endedAt: params.endedAt || new Date().toISOString(),
      plannedMinutes: Math.max(1, params.plannedMinutes),
      actualMinutes: Math.max(0, params.actualMinutes),
      status: params.status,
      createdAt: new Date().toISOString(),
      taskTitle: params.taskTitle,
      subjectName: params.subjectName,
    };

    const current = this.getLocalSessions();
    const updated = [newSession, ...current];
    this.saveLocalSessions(updated);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          newSession.userId = user.id;
          if (navigator.onLine) {
            await supabase.from("focus_sessions").insert({
              id: newSession.id,
              user_id: user.id,
              task_id: newSession.taskId,
              subject_id: newSession.subjectId,
              started_at: newSession.startedAt,
              ended_at: newSession.endedAt,
              planned_minutes: newSession.plannedMinutes,
              actual_minutes: newSession.actualMinutes,
              status: newSession.status,
            });
          } else {
            enqueueOfflineAction({
              type: "save_focus_session",
              payload: newSession,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to save focus session in Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "save_focus_session",
          payload: newSession,
        });
      }
    }

    return newSession;
  }

  async getProductivityAnalytics(): Promise<ProductivityAnalytics> {
    const [allTasks, allSessions, allSubjects] = await Promise.all([
      taskService.getTasks(),
      this.getSessions(),
      subjectService.getSubjects(),
    ]);

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    const todaySessions = allSessions.filter((s) => isSameDay(new Date(s.startedAt), now));
    const weekSessions = allSessions.filter(
      (s) => new Date(s.startedAt).getTime() >= weekStart.getTime(),
    );

    const focusMinutesToday = todaySessions
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + s.actualMinutes, 0);

    const focusMinutesThisWeek = weekSessions
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + s.actualMinutes, 0);

    const completedSessionsToday = todaySessions.filter(
      (s) => s.status === "COMPLETED",
    ).length;

    const tasksCompletedToday = allTasks.filter(
      (t) => t.status === "COMPLETED" && t.completedAt && isSameDay(new Date(t.completedAt), now),
    ).length;

    const tasksCompletedThisWeek = allTasks.filter(
      (t) =>
        t.status === "COMPLETED" &&
        t.completedAt &&
        new Date(t.completedAt).getTime() >= weekStart.getTime(),
    ).length;

    const overdueTaskCount = allTasks.filter((t) => taskService.isOverdue(t)).length;

    const activeTasksCount = allTasks.filter((t) => t.status !== "CANCELLED").length;
    const completedTasksCount = allTasks.filter((t) => t.status === "COMPLETED").length;
    const taskCompletionRate =
      activeTasksCount > 0 ? Math.round((completedTasksCount / activeTasksCount) * 100) : 0;

    // Subject-wise focus minutes this week
    const subjectWiseFocusMinutes: ProductivityAnalytics["subjectWiseFocusMinutes"] = {};
    for (const sub of allSubjects) {
      const minutesThisWeek = weekSessions
        .filter((s) => s.subjectId === sub.id && s.status === "COMPLETED")
        .reduce((sum, s) => sum + s.actualMinutes, 0);

      subjectWiseFocusMinutes[sub.id] = {
        name: sub.name,
        minutes: minutesThisWeek,
        color: sub.color,
        targetMinutes: sub.weeklyTargetMinutes,
      };
    }

    // Total weekly target minutes across all subjects
    const totalWeeklyTarget = allSubjects.reduce((sum, s) => sum + s.weeklyTargetMinutes, 0);
    const weeklyTargetProgress =
      totalWeeklyTarget > 0
        ? Math.min(100, Math.round((focusMinutesThisWeek / totalWeeklyTarget) * 100))
        : 0;

    return {
      tasksCompletedToday,
      tasksCompletedThisWeek,
      focusMinutesToday,
      focusMinutesThisWeek,
      completedSessionsToday,
      subjectWiseFocusMinutes,
      taskCompletionRate,
      overdueTaskCount,
      weeklyTargetProgress,
    };
  }
}

export const focusService = new FocusService();
