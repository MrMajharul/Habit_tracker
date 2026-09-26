import { format } from "date-fns";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import { subjectService } from "./subject-service";
import type { Subject, Task, TaskPriority, TaskStatus } from "./types";

export const TASKS_STORE_KEY = "istiqamaah_tasks_data";

export interface TaskFilterOptions {
  status?: TaskStatus | "ALL";
  priority?: TaskPriority | "ALL";
  subjectId?: string | "ALL";
  timeframe?: "ALL" | "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED";
  search?: string;
  sortBy?: "dueDate" | "priority" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
}

const todayStr = format(new Date(), "yyyy-MM-dd");

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    userId: "dev-user",
    subjectId: "sub-2",
    title: "Implement FIRST & FOLLOW Sets parser phase",
    description: "Write recursive computation for grammar analysis",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: `${todayStr}T17:00:00.000Z`,
    estimatedMinutes: 45,
    completedAt: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    userId: "dev-user",
    subjectId: "sub-1",
    title: "Gradient Descent and Backpropagation derivation",
    description: "Derive matrix weight updates for multi-layer perceptron",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: `${todayStr}T19:30:00.000Z`,
    estimatedMinutes: 30,
    completedAt: null,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    userId: "dev-user",
    subjectId: "sub-3",
    title: "Service Worker cache strategy for offline prayers",
    description: "Ensure stale-while-revalidate handles asset fetching",
    status: "TODO",
    priority: "URGENT",
    dueDate: `${todayStr}T21:00:00.000Z`,
    estimatedMinutes: 25,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-4",
    userId: "dev-user",
    subjectId: "sub-4",
    title: "Literature review: Quranic Arabic morphological taggers",
    description: "Survey 3 recent papers on dependency parsing",
    status: "COMPLETED",
    priority: "LOW",
    dueDate: `${todayStr}T12:00:00.000Z`,
    estimatedMinutes: 60,
    completedAt: `${todayStr}T11:45:00.000Z`,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-5",
    userId: "dev-user",
    subjectId: "sub-1",
    title: "Complete PyTorch tutorial on Convolutional Networks",
    description: "Build simple MNIST classifier with 99% accuracy",
    status: "TODO",
    priority: "LOW",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    estimatedMinutes: 60,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class TaskService {
  private getLocalTasks(): Task[] {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const raw = localStorage.getItem(TASKS_STORE_KEY);
      if (!raw) {
        localStorage.setItem(TASKS_STORE_KEY, JSON.stringify(INITIAL_TASKS));
        return INITIAL_TASKS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_TASKS;
    }
  }

  private saveLocalTasks(tasks: Task[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(TASKS_STORE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn("Could not save tasks locally:", e);
    }
  }

  isOverdue(task: Task): boolean {
    if (task.status === "COMPLETED" || task.status === "CANCELLED" || !task.dueDate) {
      return false;
    }
    const due = new Date(task.dueDate).getTime();
    const todayEnd = new Date().setHours(0, 0, 0, 0);
    return due < todayEnd;
  }

  isDueToday(task: Task): boolean {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    return (
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate()
    );
  }

  isUpcoming(task: Task): boolean {
    if (task.status === "COMPLETED" || task.status === "CANCELLED" || !task.dueDate) {
      return false;
    }
    const due = new Date(task.dueDate);
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    return due.getTime() >= tomorrowStart.getTime();
  }

  async getTasks(filters?: TaskFilterOptions): Promise<Task[]> {
    let tasks: Task[] = [];

    if (!isSupabaseConfigured || isDevAuthBypass || typeof window === "undefined") {
      tasks = this.getLocalTasks();
    } else {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          tasks = this.getLocalTasks();
        } else {
          const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error || !data || data.length === 0) {
            tasks = this.getLocalTasks();
          } else {
            tasks = data.map((d) => ({
              id: d.id,
              userId: d.user_id,
              subjectId: d.subject_id,
              title: d.title,
              description: d.description,
              status: (d.status?.toUpperCase() as TaskStatus) || "TODO",
              priority: (d.priority?.toUpperCase() as TaskPriority) || "MEDIUM",
              dueDate: d.due_date || (d as { deadline?: string }).deadline || null,
              estimatedMinutes: d.estimated_minutes,
              completedAt: d.completed_at,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }));
            this.saveLocalTasks(tasks);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch tasks from Supabase, returning local:", err);
        tasks = this.getLocalTasks();
      }
    }

    // Attach subject info
    const subjects = await subjectService.getSubjects({ includeArchived: true });
    const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

    tasks = tasks.map((t) => ({
      ...t,
      subject: t.subjectId ? subjectMap.get(t.subjectId) ?? null : null,
    }));

    if (!filters) return tasks;

    // Apply filters
    const result = tasks.filter((t) => {
      // Status filter
      if (filters.status && filters.status !== "ALL") {
        if (t.status !== filters.status) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== "ALL") {
        if (t.priority !== filters.priority) return false;
      }

      // Subject filter
      if (filters.subjectId && filters.subjectId !== "ALL") {
        if (t.subjectId !== filters.subjectId) return false;
      }

      // Search filter
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesSubject = t.subject?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSubject) return false;
      }

      // Timeframe filter
      if (filters.timeframe && filters.timeframe !== "ALL") {
        if (filters.timeframe === "COMPLETED") {
          return t.status === "COMPLETED";
        }
        if (filters.timeframe === "OVERDUE") {
          return this.isOverdue(t);
        }
        if (filters.timeframe === "TODAY") {
          return this.isDueToday(t) || (!t.dueDate && t.status !== "COMPLETED");
        }
        if (filters.timeframe === "UPCOMING") {
          return this.isUpcoming(t);
        }
      }

      return true;
    });

    // Sort
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "dueDate") {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = timeA - timeB;
      } else if (sortBy === "priority") {
        const pOrder: Record<TaskPriority, number> = {
          URGENT: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        cmp = pOrder[b.priority] - pOrder[a.priority];
      } else if (sortBy === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const all = await this.getTasks();
    return all.find((t) => t.id === id) ?? null;
  }

  async createTask(params: {
    title: string;
    subjectId?: string | null;
    description?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string | null;
    estimatedMinutes?: number | null;
  }): Promise<Task> {
    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: "user",
      subjectId: params.subjectId || null,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      priority: params.priority || "MEDIUM",
      status: params.status || "TODO",
      dueDate: params.dueDate || null,
      estimatedMinutes: params.estimatedMinutes || 25,
      completedAt: params.status === "COMPLETED" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = this.getLocalTasks();
    const updated = [newTask, ...current];
    this.saveLocalTasks(updated);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          newTask.userId = user.id;
          if (navigator.onLine) {
            await supabase.from("tasks").insert({
              id: newTask.id,
              user_id: user.id,
              subject_id: newTask.subjectId,
              title: newTask.title,
              description: newTask.description,
              priority: newTask.priority,
              status: newTask.status,
              due_date: newTask.dueDate,
              estimated_minutes: newTask.estimatedMinutes,
              completed_at: newTask.completedAt,
            });
          } else {
            enqueueOfflineAction({
              type: "create_task",
              payload: newTask,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to create task in Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "create_task",
          payload: newTask,
        });
      }
    }

    return newTask;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<Task, "id" | "userId" | "createdAt">>,
  ): Promise<Task | null> {
    const current = this.getLocalTasks();
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = current[index]!;
    const updated: Task = {
      ...existing,
      ...updates,
      completedAt:
        updates.status === "COMPLETED" && !existing.completedAt
          ? new Date().toISOString()
          : updates.status && updates.status !== "COMPLETED"
            ? null
            : existing.completedAt,
      updatedAt: new Date().toISOString(),
    };

    current[index] = updated;
    this.saveLocalTasks(current);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (navigator.onLine) {
            await supabase
              .from("tasks")
              .update({
                subject_id: updated.subjectId,
                title: updated.title,
                description: updated.description,
                priority: updated.priority,
                status: updated.status,
                due_date: updated.dueDate,
                estimated_minutes: updated.estimatedMinutes,
                completed_at: updated.completedAt,
                updated_at: updated.updatedAt,
              })
              .eq("id", id)
              .eq("user_id", user.id);
          } else {
            enqueueOfflineAction({
              type: "update_task",
              payload: {
                id,
                updates: {
                  subject_id: updated.subjectId,
                  title: updated.title,
                  description: updated.description,
                  priority: updated.priority,
                  status: updated.status,
                  due_date: updated.dueDate,
                  estimated_minutes: updated.estimatedMinutes,
                  completed_at: updated.completedAt,
                },
              },
            });
          }
        }
      } catch (err) {
        console.warn("Failed to update task in Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "update_task",
          payload: { id, updates },
        });
      }
    }

    return updated;
  }

  async toggleTask(id: string, forceStatus?: TaskStatus): Promise<Task | null> {
    const current = this.getLocalTasks();
    const existing = current.find((t) => t.id === id);
    if (!existing) return null;

    const nextStatus: TaskStatus =
      forceStatus || (existing.status === "COMPLETED" ? "TODO" : "COMPLETED");

    return this.updateTask(id, {
      status: nextStatus,
    });
  }

  async toggleTaskComplete(id: string): Promise<Task | null> {
    return this.toggleTask(id);
  }

  async deleteTask(id: string): Promise<boolean> {
    const current = this.getLocalTasks();
    const filtered = current.filter((t) => t.id !== id);
    if (filtered.length === current.length) return false;

    this.saveLocalTasks(filtered);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (navigator.onLine) {
            await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
          } else {
            enqueueOfflineAction({
              type: "delete_task",
              payload: { id },
            });
          }
        }
      } catch (err) {
        console.warn("Failed to delete task from Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "delete_task",
          payload: { id },
        });
      }
    }

    return true;
  }
}

export const taskService = new TaskService();
