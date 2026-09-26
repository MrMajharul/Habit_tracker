// ============================================================================
// Qur'an Service — Reading Session Management
// ============================================================================

import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import type { QuranReadingSession, QuranReadingPosition } from "./quran-types";

const SESSIONS_KEY = "istiqamaah_quran_sessions";
const POSITION_KEY = "istiqamaah_quran_reading_position";

// ─── Reading Sessions ───────────────────────────────────────────────────────

function getSessions(): QuranReadingSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: QuranReadingSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore quota
  }
}

export function createReadingSession(
  session: Omit<QuranReadingSession, "id" | "createdAt">,
): QuranReadingSession {
  const newSession: QuranReadingSession = {
    ...session,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const sessions = getSessions();
  sessions.unshift(newSession);
  saveSessions(sessions);

  // Update reading position
  updateReadingPosition({
    surahNumber: session.surahNumber,
    ayahNumber: session.endAyah,
    updatedAt: new Date().toISOString(),
  });

  // Queue for offline sync
  enqueueOfflineAction({
    type: "create_quran_reading_session",
    payload: {
      id: newSession.id,
      user_id: session.userId,
      surah_number: session.surahNumber,
      start_ayah: session.startAyah,
      end_ayah: session.endAyah,
      minutes_read: session.minutesRead,
      reading_date: session.readingDate,
      note: session.note,
    },
  });

  return newSession;
}

export function getReadingSessions(): QuranReadingSession[] {
  return getSessions();
}

export function getSessionsByDate(date: string): QuranReadingSession[] {
  return getSessions().filter((s) => s.readingDate === date);
}

export function getSessionsInRange(
  startDate: string,
  endDate: string,
): QuranReadingSession[] {
  return getSessions().filter(
    (s) => s.readingDate >= startDate && s.readingDate <= endDate,
  );
}

export function deleteReadingSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
}

// ─── Reading Position ───────────────────────────────────────────────────────

export function getReadingPosition(): QuranReadingPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function updateReadingPosition(
  position: QuranReadingPosition,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  } catch {
    // Ignore
  }

  enqueueOfflineAction({
    type: "update_quran_reading_position",
    payload: {
      surah_number: position.surahNumber,
      ayah_number: position.ayahNumber,
    },
  });
}

// ─── Singleton export ───────────────────────────────────────────────────────

export const quranService = {
  createReadingSession,
  getReadingSessions,
  getSessionsByDate,
  getSessionsInRange,
  deleteReadingSession,
  getReadingPosition,
  updateReadingPosition,
};
