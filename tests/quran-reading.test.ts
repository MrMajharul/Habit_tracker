import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock localStorage & crypto ─────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", globalThis);
// @ts-expect-error polyfill for test
globalThis.localStorage = localStorageMock;
vi.stubGlobal("crypto", { randomUUID: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}` });

// Mock offline sync to avoid side effects
vi.mock("@/lib/offline/offline-sync-queue", () => ({
  enqueueOfflineAction: vi.fn(),
}));

// ─── Imports ────────────────────────────────────────────────────────────────

import { quranService } from "@/services/quran/quran-service";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Qur'an Reading Service", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("should create a reading session", () => {
    const session = quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 2,
      startAyah: 1,
      endAyah: 10,
      minutesRead: 15,
      readingDate: "2026-09-26",
    });

    expect(session.id).toBeDefined();
    expect(session.surahNumber).toBe(2);
    expect(session.startAyah).toBe(1);
    expect(session.endAyah).toBe(10);
    expect(session.minutesRead).toBe(15);
  });

  it("should persist sessions to localStorage", () => {
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      minutesRead: 5,
      readingDate: "2026-09-26",
    });

    const sessions = quranService.getReadingSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].surahNumber).toBe(1);
  });

  it("should retrieve sessions by date", () => {
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      minutesRead: 5,
      readingDate: "2026-09-25",
    });
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 2,
      startAyah: 1,
      endAyah: 20,
      minutesRead: 15,
      readingDate: "2026-09-26",
    });

    const today = quranService.getSessionsByDate("2026-09-26");
    expect(today.length).toBe(1);
    expect(today[0].surahNumber).toBe(2);
  });

  it("should retrieve sessions in range", () => {
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      minutesRead: 5,
      readingDate: "2026-09-24",
    });
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 2,
      startAyah: 1,
      endAyah: 20,
      minutesRead: 15,
      readingDate: "2026-09-26",
    });
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 3,
      startAyah: 1,
      endAyah: 10,
      minutesRead: 10,
      readingDate: "2026-09-28",
    });

    const range = quranService.getSessionsInRange("2026-09-25", "2026-09-27");
    expect(range.length).toBe(1);
    expect(range[0].surahNumber).toBe(2);
  });

  it("should delete a reading session", () => {
    const session = quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      minutesRead: 5,
      readingDate: "2026-09-26",
    });

    quranService.deleteReadingSession(session.id);
    expect(quranService.getReadingSessions().length).toBe(0);
  });

  it("should update reading position when session is created", () => {
    quranService.createReadingSession({
      userId: "user-1",
      surahNumber: 18,
      startAyah: 1,
      endAyah: 42,
      minutesRead: 20,
      readingDate: "2026-09-26",
    });

    const position = quranService.getReadingPosition();
    expect(position).not.toBeNull();
    expect(position!.surahNumber).toBe(18);
    expect(position!.ayahNumber).toBe(42);
  });
});
