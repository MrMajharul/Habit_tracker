"use client";

import { BookMarked, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { focusService } from "@/services/study/focus-service";
import { subjectService } from "@/services/study/subject-service";
import { taskService } from "@/services/study/task-service";
import type {
  FocusSession,
  Subject,
  Task,
} from "@/services/study/types";
import { SubjectCard } from "./subject-card";
import { SubjectDetail } from "./subject-detail";
import { SubjectDialog } from "./subject-dialog";

export function SubjectsPageClient() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const loadData = useCallback(async () => {
    const [fetchedSubs, fetchedTasks, fetchedSessions] = await Promise.all([
      subjectService.getSubjects(),
      taskService.getTasks(),
      focusService.getSessions(),
    ]);

    // Calculate completed minutes and active task counts for each subject
    const enriched = fetchedSubs.map((sub) => {
      const subTasks = fetchedTasks.filter((t) => t.subjectId === sub.id);
      const subSessions = fetchedSessions.filter(
        (s) => s.subjectId === sub.id && s.status === "COMPLETED",
      );
      const completedMinutes = subSessions.reduce(
        (sum, s) => sum + s.actualMinutes,
        0,
      );
      const activeTaskCount = subTasks.filter(
        (t) => t.status !== "COMPLETED",
      ).length;
      const target = sub.weeklyTargetMinutes || 120;
      const progressPercentage = Math.min(
        100,
        Math.round((completedMinutes / target) * 100),
      );

      return {
        ...sub,
        completedMinutes,
        activeTaskCount,
        progressPercentage,
      };
    });

    setSubjects(enriched);
    setTasks(fetchedTasks);
    setSessions(fetchedSessions);

    // If a subject is currently selected in detail view, update its reference
    if (selectedSubject) {
      const fresh = enriched.find((s) => s.id === selectedSubject.id);
      if (fresh) setSelectedSubject(fresh);
    }
  }, [selectedSubject]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      subjectService.getSubjects(),
      taskService.getTasks(),
      focusService.getSessions(),
    ]).then(([fetchedSubs, fetchedTasks, fetchedSessions]) => {
      if (!mounted) return;
      const enriched = fetchedSubs.map((sub) => {
        const subTasks = fetchedTasks.filter((t) => t.subjectId === sub.id);
        const subSessions = fetchedSessions.filter(
          (s) => s.subjectId === sub.id && s.status === "COMPLETED",
        );
        const completedMinutes = subSessions.reduce(
          (sum, s) => sum + s.actualMinutes,
          0,
        );
        const activeTaskCount = subTasks.filter(
          (t) => t.status !== "COMPLETED",
        ).length;
        const target = sub.weeklyTargetMinutes || 120;
        const progressPercentage = Math.min(
          100,
          Math.round((completedMinutes / target) * 100),
        );

        return {
          ...sub,
          completedMinutes,
          activeTaskCount,
          progressPercentage,
        };
      });

      setSubjects(enriched);
      setTasks(fetchedTasks);
      setSessions(fetchedSessions);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateNew = () => {
    setSubjectToEdit(null);
    setDialogOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSubjectToEdit(subject);
    setDialogOpen(true);
  };

  const handleArchiveSubject = async (id: string, isArchived: boolean) => {
    await subjectService.archiveSubject(id, isArchived);
    toast.success(isArchived ? "Subject archived" : "Subject unarchived");
    loadData();
  };

  const handleDeleteSubject = async (id: string) => {
    await subjectService.deleteSubject(id);
    toast.success("Subject deleted");
    if (selectedSubject?.id === id) {
      setSelectedSubject(null);
    }
    loadData();
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    await taskService.toggleTask(task.id, nextStatus);
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    await taskService.deleteTask(id);
    toast.success("Task deleted");
    loadData();
  };

  // If a subject is selected, show detail view
  if (selectedSubject) {
    return (
      <div className="space-y-6">
        <SubjectDetail
          subject={selectedSubject}
          tasks={tasks}
          sessions={sessions.filter((s) => s.subjectId === selectedSubject.id)}
          onBack={() => setSelectedSubject(null)}
          onEditSubject={handleEditSubject}
          onDeleteSubject={handleDeleteSubject}
          onToggleTask={handleToggleTask}
          onEditTask={() => {}}
          onDeleteTask={handleDeleteTask}
          onTaskCreated={() => loadData()}
          createTaskFn={(p) => taskService.createTask(p)}
        />

        <SubjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          subjectToEdit={subjectToEdit}
          onSave={() => loadData()}
          createSubjectFn={(p) => subjectService.createSubject(p)}
          updateSubjectFn={(id, u) => subjectService.updateSubject(id, u)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Subjects &amp; Work Areas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize study domains, courses, and projects with weekly targets.
          </p>
        </div>

        <Button onClick={handleCreateNew} className="gap-2 shadow-xs">
          <Plus className="size-4" />
          <span>New Subject</span>
        </Button>
      </div>

      {/* Grid of subjects */}
      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <BookMarked className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No subjects yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first subject or work area to begin tracking.
          </p>
          <Button onClick={handleCreateNew} className="mt-4 gap-2">
            <Plus className="size-4" />
            <span>Create Subject</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onClick={(sub) => setSelectedSubject(sub)}
              onEdit={handleEditSubject}
              onArchive={handleArchiveSubject}
              onDelete={handleDeleteSubject}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <SubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subjectToEdit={subjectToEdit}
        onSave={() => loadData()}
        createSubjectFn={(p) => subjectService.createSubject(p)}
        updateSubjectFn={(id, u) => subjectService.updateSubject(id, u)}
      />
    </div>
  );
}
