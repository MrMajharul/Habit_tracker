import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "./types";

export const SUBJECTS_STORE_KEY = "istiqamaah_subjects_data";

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "sub-1",
    userId: "dev-user",
    name: "Machine Learning",
    description: "Neural networks, optimization & research papers",
    color: "#10b981",
    icon: "cpu",
    weeklyTargetMinutes: 300,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-2",
    userId: "dev-user",
    name: "Compiler Design",
    description: "Lexical analysis, parsing & code generation",
    color: "#3b82f6",
    icon: "code",
    weeklyTargetMinutes: 240,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-3",
    userId: "dev-user",
    name: "Web Development",
    description: "Next.js, TypeScript, responsive UI & APIs",
    color: "#8b5cf6",
    icon: "laptop",
    weeklyTargetMinutes: 360,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-4",
    userId: "dev-user",
    name: "Research & Writing",
    description: "Academic literature review & paper drafts",
    color: "#f59e0b",
    icon: "microscope",
    weeklyTargetMinutes: 180,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-5",
    userId: "dev-user",
    name: "Personal Projects",
    description: "Open-source work & life organization",
    color: "#06b6d4",
    icon: "book-open",
    weeklyTargetMinutes: 120,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SubjectService {
  private getLocalSubjects(): Subject[] {
    if (typeof window === "undefined") return INITIAL_SUBJECTS;
    try {
      const raw = localStorage.getItem(SUBJECTS_STORE_KEY);
      if (!raw) {
        localStorage.setItem(SUBJECTS_STORE_KEY, JSON.stringify(INITIAL_SUBJECTS));
        return INITIAL_SUBJECTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUBJECTS;
    }
  }

  private saveLocalSubjects(subjects: Subject[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SUBJECTS_STORE_KEY, JSON.stringify(subjects));
    } catch (e) {
      console.warn("Could not save subjects locally:", e);
    }
  }

  async getSubjects(options?: { includeArchived?: boolean }): Promise<Subject[]> {
    if (!isSupabaseConfigured || isDevAuthBypass || typeof window === "undefined") {
      const local = this.getLocalSubjects();
      return options?.includeArchived ? local : local.filter((s) => !s.isArchived);
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const local = this.getLocalSubjects();
        return options?.includeArchived ? local : local.filter((s) => !s.isArchived);
      }

      let query = supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!options?.includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.getLocalSubjects();
      }

      const mapped: Subject[] = data.map((d) => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        description: d.description,
        color: d.color ?? "#10b981",
        icon: d.icon ?? "book-open",
        weeklyTargetMinutes: d.weekly_target_minutes ?? 0,
        isArchived: d.is_archived ?? false,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      this.saveLocalSubjects(mapped);
      return mapped;
    } catch (err) {
      console.warn("Failed to fetch subjects from Supabase, returning local:", err);
      const local = this.getLocalSubjects();
      return options?.includeArchived ? local : local.filter((s) => !s.isArchived);
    }
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    const all = await this.getSubjects({ includeArchived: true });
    return all.find((s) => s.id === id) ?? null;
  }

  async createSubject(params: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    weeklyTargetMinutes?: number;
  }): Promise<Subject> {
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      userId: "user",
      name: params.name.trim(),
      description: params.description?.trim() || null,
      color: params.color || "#10b981",
      icon: params.icon || "book-open",
      weeklyTargetMinutes: Math.max(0, params.weeklyTargetMinutes ?? 120),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately
    const current = this.getLocalSubjects();
    const updated = [...current, newSubject];
    this.saveLocalSubjects(updated);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          newSubject.userId = user.id;
          if (navigator.onLine) {
            await supabase.from("subjects").insert({
              id: newSubject.id,
              user_id: user.id,
              name: newSubject.name,
              description: newSubject.description,
              color: newSubject.color,
              icon: newSubject.icon,
              weekly_target_minutes: newSubject.weeklyTargetMinutes,
              is_archived: newSubject.isArchived,
            });
          } else {
            enqueueOfflineAction({
              type: "create_subject",
              payload: {
                id: newSubject.id,
                name: newSubject.name,
                description: newSubject.description,
                color: newSubject.color,
                icon: newSubject.icon,
                weekly_target_minutes: newSubject.weeklyTargetMinutes,
                is_archived: newSubject.isArchived,
              },
            });
          }
        }
      } catch (err) {
        console.warn("Failed to create subject in Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "create_subject",
          payload: newSubject,
        });
      }
    }

    return newSubject;
  }

  async updateSubject(
    id: string,
    updates: Partial<Omit<Subject, "id" | "userId" | "createdAt">>,
  ): Promise<Subject | null> {
    const current = this.getLocalSubjects();
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const existing = current[index]!;
    const updated: Subject = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    current[index] = updated;
    this.saveLocalSubjects(current);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (navigator.onLine) {
            await supabase
              .from("subjects")
              .update({
                name: updated.name,
                description: updated.description,
                color: updated.color,
                icon: updated.icon,
                weekly_target_minutes: updated.weeklyTargetMinutes,
                is_archived: updated.isArchived,
                updated_at: updated.updatedAt,
              })
              .eq("id", id)
              .eq("user_id", user.id);
          } else {
            enqueueOfflineAction({
              type: "update_subject",
              payload: {
                id,
                updates: {
                  name: updated.name,
                  description: updated.description,
                  color: updated.color,
                  icon: updated.icon,
                  weekly_target_minutes: updated.weeklyTargetMinutes,
                  is_archived: updated.isArchived,
                },
              },
            });
          }
        }
      } catch (err) {
        console.warn("Failed to update subject in Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "update_subject",
          payload: { id, updates },
        });
      }
    }

    return updated;
  }

  async archiveSubject(id: string, isArchived = true): Promise<Subject | null> {
    return this.updateSubject(id, { isArchived });
  }

  async deleteSubject(id: string): Promise<boolean> {
    const current = this.getLocalSubjects();
    const filtered = current.filter((s) => s.id !== id);
    if (filtered.length === current.length) return false;

    this.saveLocalSubjects(filtered);

    if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (navigator.onLine) {
            await supabase.from("subjects").delete().eq("id", id).eq("user_id", user.id);
          } else {
            enqueueOfflineAction({
              type: "delete_subject",
              payload: { id },
            });
          }
        }
      } catch (err) {
        console.warn("Failed to delete subject from Supabase, enqueued:", err);
        enqueueOfflineAction({
          type: "delete_subject",
          payload: { id },
        });
      }
    }

    return true;
  }
}

export const subjectService = new SubjectService();
