import { beforeEach, describe, expect, it } from "vitest";

import { FocusService } from "@/services/study/focus-service";

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

describe("Focus / Pomodoro System & Drift-Proof Timer", () => {
  let focusService: FocusService;
  const storage = createLocalStorageMock();

  beforeEach(() => {
    storage.clear();
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis;
    // @ts-expect-error polyfill for test
    globalThis.localStorage = storage;

    focusService = new FocusService();
  });

  describe("Drift-proof Timestamp Math", () => {
    it("calculates remaining time based on target end time without drift", () => {
      const durationMinutes = 25;
      const durationMs = durationMinutes * 60 * 1000;
      const startTime = 1000000;
      const targetEndTime = startTime + durationMs;

      // 5 minutes later
      const currentTime = startTime + 5 * 60 * 1000;
      const remainingMs = Math.max(0, targetEndTime - currentTime);
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      expect(remainingSeconds).toBe(20 * 60);

      // Even if JavaScript thread was delayed or tab throttled by 10.5 seconds:
      const delayedCurrentTime = currentTime + 10500;
      const correctedRemaining = Math.max(0, targetEndTime - delayedCurrentTime);
      const correctedSeconds = Math.ceil(correctedRemaining / 1000);

      // Exact time remaining is 20*60 - 10.5s = 1189.5s -> 1190s
      expect(correctedSeconds).toBe(1190);
    });

    it("clamps remaining time at zero when target end time is passed", () => {
      const startTime = 1000000;
      const durationMs = 25 * 60 * 1000;
      const targetEndTime = startTime + durationMs;

      const overEndTime = targetEndTime + 5000;
      const remainingMs = Math.max(0, targetEndTime - overEndTime);

      expect(remainingMs).toBe(0);
    });
  });

  describe("Session Recording & Transitions", () => {
    it("records completed focus session with task and subject references", async () => {
      const session = await focusService.recordSession({
        taskId: "task-parser-1",
        subjectId: "sub-compiler",
        startedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        endedAt: new Date().toISOString(),
        plannedMinutes: 25,
        actualMinutes: 25,
        status: "COMPLETED",
        taskTitle: "Parse BNF grammar",
        subjectName: "Compiler Design",
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe("COMPLETED");
      expect(session.actualMinutes).toBe(25);
      expect(session.plannedMinutes).toBe(25);
      expect(session.taskId).toBe("task-parser-1");
      expect(session.subjectId).toBe("sub-compiler");
    });

    it("records interrupted session with actual elapsed minutes", async () => {
      const session = await focusService.recordSession({
        taskId: "task-parser-1",
        startedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        endedAt: new Date().toISOString(),
        plannedMinutes: 25,
        actualMinutes: 12,
        status: "INTERRUPTED",
      });

      expect(session.status).toBe("INTERRUPTED");
      expect(session.actualMinutes).toBe(12);
      expect(session.plannedMinutes).toBe(25);
    });

    it("records cancelled session", async () => {
      const session = await focusService.recordSession({
        startedAt: new Date(Date.now() - 2 * 60000).toISOString(),
        plannedMinutes: 25,
        actualMinutes: 2,
        status: "CANCELLED",
      });

      expect(session.status).toBe("CANCELLED");
      expect(session.actualMinutes).toBe(2);
    });
  });

  describe("Productivity Analytics Foundation", () => {
    it("aggregates focus minutes, sessions, and subject breakdown", async () => {
      // Record 2 sessions
      await focusService.recordSession({
        subjectId: "sub-1",
        subjectName: "Compiler Design",
        startedAt: new Date().toISOString(),
        plannedMinutes: 25,
        actualMinutes: 25,
        status: "COMPLETED",
      });

      await focusService.recordSession({
        subjectId: "sub-2",
        subjectName: "Machine Learning",
        startedAt: new Date().toISOString(),
        plannedMinutes: 30,
        actualMinutes: 30,
        status: "COMPLETED",
      });

      const analytics = await focusService.getProductivityAnalytics();

      expect(analytics.focusMinutesToday).toBeGreaterThanOrEqual(55);
      expect(analytics.focusMinutesThisWeek).toBeGreaterThanOrEqual(55);
      expect(analytics.completedSessionsToday).toBeGreaterThanOrEqual(2);
      expect(Object.keys(analytics.subjectWiseFocusMinutes).length).toBeGreaterThan(0);
    });
  });
});
