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

vi.mock("@/lib/offline/offline-sync-queue", () => ({
  enqueueOfflineAction: vi.fn(),
}));

// ─── Imports ────────────────────────────────────────────────────────────────

import { quranBookmarkService } from "@/services/quran/quran-bookmark-service";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Qur'an Bookmarks", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("should add a bookmark", () => {
    const bm = quranBookmarkService.addBookmark({
      userId: "user-1",
      surahNumber: 2,
      ayahNumber: 255,
    });

    expect(bm).not.toBeNull();
    expect(bm!.surahNumber).toBe(2);
    expect(bm!.ayahNumber).toBe(255);
  });

  it("should prevent duplicate bookmarks", () => {
    quranBookmarkService.addBookmark({
      userId: "user-1",
      surahNumber: 2,
      ayahNumber: 255,
    });

    const dup = quranBookmarkService.addBookmark({
      userId: "user-1",
      surahNumber: 2,
      ayahNumber: 255,
    });

    expect(dup).toBeNull();
    expect(quranBookmarkService.getAllBookmarks().length).toBe(1);
  });

  it("should check if an ayah is bookmarked", () => {
    quranBookmarkService.addBookmark({
      userId: "user-1",
      surahNumber: 36,
      ayahNumber: 1,
    });

    expect(quranBookmarkService.isBookmarked(36, 1)).toBe(true);
    expect(quranBookmarkService.isBookmarked(36, 2)).toBe(false);
  });

  it("should remove a bookmark", () => {
    quranBookmarkService.addBookmark({
      userId: "user-1",
      surahNumber: 55,
      ayahNumber: 13,
    });

    quranBookmarkService.removeBookmark(55, 13);
    expect(quranBookmarkService.isBookmarked(55, 13)).toBe(false);
    expect(quranBookmarkService.getAllBookmarks().length).toBe(0);
  });

  it("should get bookmarks for a specific surah", () => {
    quranBookmarkService.addBookmark({ userId: "u", surahNumber: 2, ayahNumber: 255 });
    quranBookmarkService.addBookmark({ userId: "u", surahNumber: 2, ayahNumber: 286 });
    quranBookmarkService.addBookmark({ userId: "u", surahNumber: 36, ayahNumber: 1 });

    const bms = quranBookmarkService.getBookmarksForSurah(2);
    expect(bms.length).toBe(2);
    expect(bms.every((b) => b.surahNumber === 2)).toBe(true);
  });

  it("should update a bookmark note", () => {
    quranBookmarkService.addBookmark({ userId: "u", surahNumber: 67, ayahNumber: 1 });
    quranBookmarkService.updateBookmarkNote(67, 1, "Surah Al-Mulk start");

    const bms = quranBookmarkService.getBookmarksForSurah(67);
    expect(bms[0].note).toBe("Surah Al-Mulk start");
  });
});
