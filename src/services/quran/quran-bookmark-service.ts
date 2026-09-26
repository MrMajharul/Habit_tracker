// ============================================================================
// Qur'an Bookmark Service
// ============================================================================

import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import type { QuranBookmark } from "./quran-types";

const BOOKMARKS_KEY = "istiqamaah_quran_bookmarks";

function getBookmarks(): QuranBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: QuranBookmark[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {
    // Ignore quota
  }
}

export function addBookmark(
  bookmark: Omit<QuranBookmark, "id" | "createdAt">,
): QuranBookmark | null {
  const existing = getBookmarks();

  // Prevent duplicates
  const duplicate = existing.find(
    (b) =>
      b.surahNumber === bookmark.surahNumber &&
      b.ayahNumber === bookmark.ayahNumber,
  );
  if (duplicate) return null;

  const newBookmark: QuranBookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  existing.unshift(newBookmark);
  saveBookmarks(existing);

  enqueueOfflineAction({
    type: "create_quran_bookmark",
    payload: {
      id: newBookmark.id,
      user_id: bookmark.userId,
      surah_number: bookmark.surahNumber,
      ayah_number: bookmark.ayahNumber,
      note: bookmark.note,
    },
  });

  return newBookmark;
}

export function removeBookmark(
  surahNumber: number,
  ayahNumber: number,
): void {
  const bookmarks = getBookmarks();
  const target = bookmarks.find(
    (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber,
  );
  if (!target) return;

  saveBookmarks(bookmarks.filter((b) => b.id !== target.id));

  enqueueOfflineAction({
    type: "delete_quran_bookmark",
    payload: { id: target.id },
  });
}

export function isBookmarked(
  surahNumber: number,
  ayahNumber: number,
): boolean {
  return getBookmarks().some(
    (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber,
  );
}

export function getAllBookmarks(): QuranBookmark[] {
  return getBookmarks();
}

export function getBookmarksForSurah(surahNumber: number): QuranBookmark[] {
  return getBookmarks().filter((b) => b.surahNumber === surahNumber);
}

export function updateBookmarkNote(
  surahNumber: number,
  ayahNumber: number,
  note: string,
): void {
  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex(
    (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber,
  );
  if (idx === -1) return;
  bookmarks[idx].note = note;
  saveBookmarks(bookmarks);
}

export const quranBookmarkService = {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getAllBookmarks,
  getBookmarksForSurah,
  updateBookmarkNote,
};
