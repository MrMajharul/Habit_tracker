import { format, subDays, addDays } from "date-fns";
import { beforeEach, describe, expect, it } from "vitest";

import { TaskService } from "@/services/study/task-service";

// Polyfill localStorage & window for Node environment in tests
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe("Task Management System", () => {
  let service: TaskService;
  const storage = createLocalStorageMock();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  beforeEach(() => {
    storage.clear();
    storage.setItem("istiqamaah_tasks_data", "[]");
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis;
    // @ts-expect-error polyfill for test
    globalThis.localStorage = storage;

    service = new TaskService();
  });

  it("creates a new task with title, status TODO, priority and estimation", async () => {
    const task = await service.createTask({
      title: "Write Parser Grammar",
      description: "Define LR(1) syntax grammar rules",
      subjectId: "sub-compiler",
      priority: "HIGH",
      dueDate: todayStr,
      estimatedMinutes: 45,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Write Parser Grammar");
    expect(task.description).toBe("Define LR(1) syntax grammar rules");
    expect(task.subjectId).toBe("sub-compiler");
    expect(task.priority).toBe("HIGH");
    expect(task.status).toBe("TODO");
    expect(task.dueDate).toBe(todayStr);
    expect(task.estimatedMinutes).toBe(45);
    expect(task.completedAt).toBeNull();
    expect(task.createdAt).toBeDefined();
  });

  it("completes and uncompletes a task (toggle completion)", async () => {
    const task = await service.createTask({
      title: "Setup CI pipeline",
      priority: "MEDIUM",
    });
    expect(task.status).toBe("TODO");
    expect(task.completedAt).toBeNull();

    // Toggle complete
    const completed = await service.toggleTaskComplete(task.id);
    expect(completed?.status).toBe("COMPLETED");
    expect(completed?.completedAt).not.toBeNull();

    // Toggle uncomplete
    const uncompleted = await service.toggleTaskComplete(task.id);
    expect(uncompleted?.status).toBe("TODO");
    expect(uncompleted?.completedAt).toBeNull();
  });

  it("updates task priority, status, and due dates", async () => {
    const task = await service.createTask({
      title: "Study Neural Attention",
      priority: "LOW",
    });

    const updated = await service.updateTask(task.id, {
      priority: "URGENT",
      status: "IN_PROGRESS",
      dueDate: tomorrowStr,
      estimatedMinutes: 60,
    });

    expect(updated?.priority).toBe("URGENT");
    expect(updated?.status).toBe("IN_PROGRESS");
    expect(updated?.dueDate).toBe(tomorrowStr);
    expect(updated?.estimatedMinutes).toBe(60);
  });

  it("deletes a task successfully", async () => {
    const task = await service.createTask({
      title: "Discardable Scratch Task",
    });

    const deleted = await service.deleteTask(task.id);
    expect(deleted).toBe(true);

    const found = await service.getTaskById(task.id);
    expect(found).toBeNull();
  });

  it("correctly identifies overdue tasks vs completed tasks", async () => {
    const overdueTask = await service.createTask({
      title: "Overdue Lab Report",
      dueDate: yesterdayStr,
      status: "TODO",
    });

    const completedPastTask = await service.createTask({
      title: "Completed Old Task",
      dueDate: yesterdayStr,
      status: "COMPLETED",
    });

    const futureTask = await service.createTask({
      title: "Future Milestone",
      dueDate: tomorrowStr,
      status: "TODO",
    });

    expect(service.isOverdue(overdueTask)).toBe(true);
    expect(service.isOverdue(completedPastTask)).toBe(false);
    expect(service.isOverdue(futureTask)).toBe(false);
  });

  it("correctly identifies tasks due today", async () => {
    const todayTask = await service.createTask({
      title: "Today's Deliverable",
      dueDate: todayStr,
    });

    const tomorrowTask = await service.createTask({
      title: "Tomorrow's Deliverable",
      dueDate: tomorrowStr,
    });

    expect(service.isDueToday(todayTask)).toBe(true);
    expect(service.isDueToday(tomorrowTask)).toBe(false);
  });

  it("filters tasks by status, subject, priority, and search query", async () => {
    await service.createTask({
      title: "Build Lexer in Rust",
      subjectId: "sub-1",
      priority: "HIGH",
      status: "TODO",
    });
    await service.createTask({
      title: "Read Transformer Paper",
      subjectId: "sub-2",
      priority: "MEDIUM",
      status: "TODO",
    });
    await service.createTask({
      title: "Fix Next.js Build Hydration",
      subjectId: "sub-1",
      priority: "LOW",
      status: "COMPLETED",
    });

    // Filter by subject
    const sub1Tasks = await service.getTasks({ subjectId: "sub-1" });
    expect(sub1Tasks.length).toBe(2);

    // Filter by priority
    const highTasks = await service.getTasks({ priority: "HIGH" });
    expect(highTasks.length).toBe(1);
    expect(highTasks[0].title).toBe("Build Lexer in Rust");

    // Filter by status
    const completedTasks = await service.getTasks({ status: "COMPLETED" });
    expect(completedTasks.length).toBe(1);
    expect(completedTasks[0].title).toBe("Fix Next.js Build Hydration");

    // Search query
    const searched = await service.getTasks({ search: "Transformer" });
    expect(searched.length).toBe(1);
    expect(searched[0].title).toBe("Read Transformer Paper");
  });
});
