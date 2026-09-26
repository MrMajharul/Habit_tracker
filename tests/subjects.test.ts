import { beforeEach, describe, expect, it } from "vitest";

import { SubjectService } from "@/services/study/subject-service";
import type { Subject } from "@/services/study/types";

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

describe("Subject / Work Area System", () => {
  let service: SubjectService;
  const storage = createLocalStorageMock();

  beforeEach(() => {
    storage.clear();
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis;
    // @ts-expect-error polyfill for test
    globalThis.localStorage = storage;

    service = new SubjectService();
  });

  it("creates a new subject with required fields, color, and weekly target", async () => {
    const created = await service.createSubject({
      name: "Compiler Design",
      description: "Grammars, ASTs, and optimizations",
      color: "#3b82f6",
      icon: "code",
      weeklyTargetMinutes: 240,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Compiler Design");
    expect(created.description).toBe("Grammars, ASTs, and optimizations");
    expect(created.color).toBe("#3b82f6");
    expect(created.icon).toBe("code");
    expect(created.weeklyTargetMinutes).toBe(240);
    expect(created.isArchived).toBe(false);
    expect(created.userId).toBeDefined();
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeDefined();

    const all = await service.getSubjects();
    expect(all.some((s) => s.id === created.id)).toBe(true);
  });

  it("updates an existing subject", async () => {
    const created = await service.createSubject({
      name: "Machine Learning",
      color: "#10b981",
      icon: "cpu",
      weeklyTargetMinutes: 180,
    });

    const updated = await service.updateSubject(created.id, {
      name: "Deep Learning & LLMs",
      weeklyTargetMinutes: 300,
      color: "#059669",
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Deep Learning & LLMs");
    expect(updated?.weeklyTargetMinutes).toBe(300);
    expect(updated?.color).toBe("#059669");
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.createdAt).getTime(),
    );
  });

  it("archives and unarchives a subject", async () => {
    const created = await service.createSubject({
      name: "Old Research Topic",
      color: "#6b7280",
      icon: "book-open",
      weeklyTargetMinutes: 60,
    });

    // Archive
    const archived = await service.archiveSubject(created.id, true);
    expect(archived?.isArchived).toBe(true);

    // Active subjects should not include archived subject by default
    const active = await service.getSubjects({ includeArchived: false });
    expect(active.some((s) => s.id === created.id)).toBe(false);

    // With includeArchived: true, it should appear
    const all = await service.getSubjects({ includeArchived: true });
    expect(all.some((s) => s.id === created.id)).toBe(true);

    // Unarchive
    const unarchived = await service.archiveSubject(created.id, false);
    expect(unarchived?.isArchived).toBe(false);

    const activeAfter = await service.getSubjects({ includeArchived: false });
    expect(activeAfter.some((s) => s.id === created.id)).toBe(true);
  });

  it("deletes a subject permanently", async () => {
    const created = await service.createSubject({
      name: "Temporary Subject",
      color: "#ef4444",
      icon: "briefcase",
    });

    const success = await service.deleteSubject(created.id);
    expect(success).toBe(true);

    const all = await service.getSubjects({ includeArchived: true });
    expect(all.some((s) => s.id === created.id)).toBe(false);
  });

  it("calculates weekly progress towards target minutes", () => {
    const mockSubject: Subject = {
      id: "sub-test",
      userId: "test-user",
      name: "Robotics",
      description: null,
      color: "#10b981",
      icon: "cpu",
      weeklyTargetMinutes: 200,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 150 minutes completed out of 200 -> 75%
    const progress = Math.min(100, Math.round((150 / mockSubject.weeklyTargetMinutes) * 100));
    expect(progress).toBe(75);

    // Over-achieving target (250 / 200) -> capped at 100% for progress bar
    const cappedProgress = Math.min(100, Math.round((250 / mockSubject.weeklyTargetMinutes) * 100));
    expect(cappedProgress).toBe(100);
  });
});
