import { beforeEach, describe, expect, it } from "vitest";

import {
  enqueueOfflineAction,
  getOfflineQueue,
  saveOfflineQueue,
} from "@/lib/offline/offline-sync-queue";

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

describe("Offline Sync Queue Extension (Phase 3)", () => {
  const storage = createLocalStorageMock();

  beforeEach(() => {
    storage.clear();
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis;
    // @ts-expect-error polyfill for test
    globalThis.localStorage = storage;
  });

  it("enqueues task operations when offline", () => {
    enqueueOfflineAction({
      type: "create_task",
      payload: { id: "t-1", title: "Offline Task", priority: "HIGH" },
    });

    enqueueOfflineAction({
      type: "update_task",
      payload: { id: "t-1", title: "Updated Offline Task" },
    });

    enqueueOfflineAction({
      type: "toggle_task",
      payload: { id: "t-1", completed: true },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(3);
    expect(queue[0].type).toBe("create_task");
    expect(queue[1].type).toBe("update_task");
    expect(queue[2].type).toBe("toggle_task");
  });

  it("enqueues subject operations when offline", () => {
    enqueueOfflineAction({
      type: "create_subject",
      payload: { id: "s-1", name: "Distributed Systems" },
    });

    enqueueOfflineAction({
      type: "update_subject",
      payload: { id: "s-2", weeklyTargetMinutes: 300 },
    });

    enqueueOfflineAction({
      type: "delete_subject",
      payload: { id: "s-3" },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(3);
    expect(queue[0].type).toBe("create_subject");
    expect(queue[1].type).toBe("update_subject");
    expect(queue[2].type).toBe("delete_subject");
  });

  it("deduplicates prior pending actions when an item is deleted offline", () => {
    enqueueOfflineAction({
      type: "create_subject",
      payload: { id: "s-temp", name: "Temporary" },
    });

    enqueueOfflineAction({
      type: "update_subject",
      payload: { id: "s-temp", weeklyTargetMinutes: 60 },
    });

    // Enqueue delete for the same ID
    enqueueOfflineAction({
      type: "delete_subject",
      payload: { id: "s-temp" },
    });

    const queue = getOfflineQueue();
    // Prior pending create/update actions for s-temp are superseded by delete
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("delete_subject");
    expect(queue[0].payload.id).toBe("s-temp");
  });

  it("enqueues focus session recordings when offline", () => {
    enqueueOfflineAction({
      type: "save_focus_session",
      payload: {
        id: "f-101",
        taskId: "t-1",
        subjectId: "s-1",
        plannedMinutes: 25,
        actualMinutes: 25,
        status: "COMPLETED",
      },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("save_focus_session");
    expect(queue[0].payload.id).toBe("f-101");
    expect(queue[0].payload.actualMinutes).toBe(25);
  });

  it("clears processed items from the queue correctly", () => {
    enqueueOfflineAction({
      type: "create_task",
      payload: { id: "t-2", title: "Synced Task" },
    });

    expect(getOfflineQueue().length).toBe(1);

    // Simulate clearing after successful sync
    saveOfflineQueue([]);
    expect(getOfflineQueue().length).toBe(0);
  });
});
