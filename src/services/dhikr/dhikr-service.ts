// ─── Dhikr Service ────────────────────────────────────────────────────────────
// Orchestrates dhikr content, sessions, favorites, and Ramadan features.

import type {
  CanonicalDhikr,
  CanonicalDua,
  DhikrCategory,
  DhikrFavorite,
  DhikrSession,
  DhikrSessionStatus,
  DuaCategory,
  HijriDate,
  RamadanDailyLog,
  RamadanGoal,
  RamadanInfo,
  RamadanSettings,
} from "./dhikr-types";
import { type DhikrContentProvider, VerifiedDhikrProvider } from "./dhikr-provider";

// ─── Singleton Provider ───────────────────────────────────────────────────────

let provider: DhikrContentProvider = new VerifiedDhikrProvider();

export function setDhikrProvider(p: DhikrContentProvider): void {
  provider = p;
}

// ─── Content Access ───────────────────────────────────────────────────────────

export function getAllDhikr(): CanonicalDhikr[] {
  return provider.getAllDhikr();
}

export function getDhikrByCategory(category: DhikrCategory): CanonicalDhikr[] {
  return provider.getDhikrByCategory(category);
}

export function getDhikrById(id: string): CanonicalDhikr | undefined {
  return provider.getDhikrById(id);
}

export function getMorningAdhkar(): CanonicalDhikr[] {
  return provider.getMorningAdhkar();
}

export function getEveningAdhkar(): CanonicalDhikr[] {
  return provider.getEveningAdhkar();
}

export function getAfterSalahAdhkar(): CanonicalDhikr[] {
  return provider.getAfterSalahAdhkar();
}

export function searchDhikr(query: string): CanonicalDhikr[] {
  return provider.searchDhikr(query);
}

export function getAllDuas(): CanonicalDua[] {
  return provider.getAllDuas();
}

export function getDuasByCategory(category: DuaCategory): CanonicalDua[] {
  return provider.getDuasByCategory(category);
}

export function getDuaById(id: string): CanonicalDua | undefined {
  return provider.getDuaById(id);
}

export function searchDuas(query: string): CanonicalDua[] {
  return provider.searchDuas(query);
}

// ─── Islamic Calendar (Hijri) ─────────────────────────────────────────────────
// Uses the Umm al-Qura algorithm for approximate Hijri date calculation.
// This is an offline approximation — a more precise calculation can be
// substituted via the provider abstraction.

const HIJRI_MONTH_NAMES = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' ath-Thani",
  "Jumada al-Ula", "Jumada ath-Thaniyah", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul-Qi'dah", "Dhul-Hijjah",
];

/**
 * Approximate Gregorian to Hijri conversion.
 * Based on the Kuwaiti algorithm variant.
 * For production-critical Ramadan detection, an API or astronomical
 * calculation library should be used.
 */
export function gregorianToHijri(date: Date): HijriDate {
  const gd = date.getDate();
  const gm = date.getMonth() + 1;
  const gy = date.getFullYear();

  let jd: number;
  if (gm > 2) {
    jd =
      Math.floor(365.25 * (gy + 4716)) +
      Math.floor(30.6001 * (gm + 1)) +
      gd -
      1524.5;
  } else {
    jd =
      Math.floor(365.25 * (gy - 1 + 4716)) +
      Math.floor(30.6001 * (gm + 12 + 1)) +
      gd -
      1524.5;
  }

  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const remainder = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - remainder) / 5316) *
      Math.floor((50 * remainder) / 17719) +
    Math.floor(remainder / 5670) * Math.floor((43 * remainder) / 15238);
  const remainderAdj =
    remainder -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hm = Math.floor((24 * remainderAdj) / 709);
  const hd = remainderAdj - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  return {
    year: hy,
    month: hm,
    day: hd,
    monthName: HIJRI_MONTH_NAMES[hm - 1] ?? "Unknown",
  };
}

/**
 * Check whether a given date falls in Ramadan and compute the day number.
 */
export function getRamadanInfo(date: Date = new Date()): RamadanInfo {
  const hijri = gregorianToHijri(date);
  const isRamadan = hijri.month === 9; // Ramadan is month 9
  return {
    isRamadan,
    ramadanDay: isRamadan ? hijri.day : undefined,
    totalDays: 30, // Ramadan can be 29 or 30 days
    hijriDate: hijri,
  };
}

// ─── Session Management (Local) ───────────────────────────────────────────────

const SESSIONS_KEY = "istiqamaah_dhikr_sessions";
const FAVORITES_KEY = "istiqamaah_dhikr_favorites";
const RAMADAN_SETTINGS_KEY = "istiqamaah_ramadan_settings";
const RAMADAN_LOGS_KEY = "istiqamaah_ramadan_daily_logs";
const RAMADAN_GOALS_KEY = "istiqamaah_ramadan_goals";

function getStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStorage<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore quota
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function createDhikrSession(
  userId: string,
  dhikrId: string,
  targetCount: number,
): DhikrSession {
  const session: DhikrSession = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    dhikrId,
    targetCount,
    completedCount: 0,
    startedAt: new Date().toISOString(),
    status: "INTERRUPTED" as DhikrSessionStatus,
    createdAt: new Date().toISOString(),
  };
  const sessions = getStorage<DhikrSession>(SESSIONS_KEY);
  sessions.push(session);
  setStorage(SESSIONS_KEY, sessions);
  return session;
}

export function updateDhikrSession(
  sessionId: string,
  updates: Partial<DhikrSession>,
): DhikrSession | undefined {
  const sessions = getStorage<DhikrSession>(SESSIONS_KEY);
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return undefined;
  sessions[idx] = { ...sessions[idx], ...updates };
  setStorage(SESSIONS_KEY, sessions);
  return sessions[idx];
}

export function completeDhikrSession(
  sessionId: string,
  completedCount: number,
): DhikrSession | undefined {
  return updateDhikrSession(sessionId, {
    completedCount,
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
  });
}

export function getDhikrSessions(userId: string): DhikrSession[] {
  return getStorage<DhikrSession>(SESSIONS_KEY).filter(
    (s) => s.userId === userId,
  );
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function getDhikrFavorites(userId: string): DhikrFavorite[] {
  return getStorage<DhikrFavorite>(FAVORITES_KEY).filter(
    (f) => f.userId === userId,
  );
}

export function addDhikrFavorite(
  userId: string,
  dhikrId: string,
): DhikrFavorite | null {
  const favorites = getStorage<DhikrFavorite>(FAVORITES_KEY);
  // Prevent duplicates
  if (favorites.some((f) => f.userId === userId && f.dhikrId === dhikrId)) {
    return null;
  }
  const fav: DhikrFavorite = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    dhikrId,
    createdAt: new Date().toISOString(),
  };
  favorites.push(fav);
  setStorage(FAVORITES_KEY, favorites);
  return fav;
}

export function removeDhikrFavorite(userId: string, dhikrId: string): boolean {
  const favorites = getStorage<DhikrFavorite>(FAVORITES_KEY);
  const filtered = favorites.filter(
    (f) => !(f.userId === userId && f.dhikrId === dhikrId),
  );
  if (filtered.length === favorites.length) return false;
  setStorage(FAVORITES_KEY, filtered);
  return true;
}

export function isDhikrFavorite(userId: string, dhikrId: string): boolean {
  return getStorage<DhikrFavorite>(FAVORITES_KEY).some(
    (f) => f.userId === userId && f.dhikrId === dhikrId,
  );
}

// ─── Ramadan Settings ─────────────────────────────────────────────────────────

export function getRamadanSettings(userId: string): RamadanSettings | null {
  const all = getStorage<RamadanSettings>(RAMADAN_SETTINGS_KEY);
  return all.find((s) => s.userId === userId) ?? null;
}

export function saveRamadanSettings(settings: RamadanSettings): void {
  const all = getStorage<RamadanSettings>(RAMADAN_SETTINGS_KEY);
  const idx = all.findIndex((s) => s.userId === settings.userId);
  if (idx >= 0) {
    all[idx] = { ...settings, updatedAt: new Date().toISOString() };
  } else {
    all.push(settings);
  }
  setStorage(RAMADAN_SETTINGS_KEY, all);
}

export function getDefaultRamadanSettings(userId: string): RamadanSettings {
  return {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    isEnabled: false,
    suhoorReminder: true,
    iftarReminder: true,
    dailyQuranTarget: 20,
    dhikrReminder: true,
    reflectionReminder: false,
    taraweehTracking: true,
    customChecklistItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Ramadan Daily Logs ───────────────────────────────────────────────────────

export function getRamadanDailyLogs(userId: string): RamadanDailyLog[] {
  return getStorage<RamadanDailyLog>(RAMADAN_LOGS_KEY).filter(
    (l) => l.userId === userId,
  );
}

export function getRamadanDailyLog(
  userId: string,
  ramadanDay: number,
): RamadanDailyLog | null {
  return (
    getStorage<RamadanDailyLog>(RAMADAN_LOGS_KEY).find(
      (l) => l.userId === userId && l.ramadanDay === ramadanDay,
    ) ?? null
  );
}

export function saveRamadanDailyLog(log: RamadanDailyLog): void {
  const all = getStorage<RamadanDailyLog>(RAMADAN_LOGS_KEY);
  const idx = all.findIndex(
    (l) => l.userId === log.userId && l.ramadanDay === log.ramadanDay,
  );
  if (idx >= 0) {
    all[idx] = { ...log, updatedAt: new Date().toISOString() };
  } else {
    all.push(log);
  }
  setStorage(RAMADAN_LOGS_KEY, all);
}

// ─── Ramadan Goals ────────────────────────────────────────────────────────────

export function getRamadanGoals(userId: string): RamadanGoal[] {
  return getStorage<RamadanGoal>(RAMADAN_GOALS_KEY).filter(
    (g) => g.userId === userId,
  );
}

export function saveRamadanGoal(goal: RamadanGoal): void {
  const all = getStorage<RamadanGoal>(RAMADAN_GOALS_KEY);
  const idx = all.findIndex((g) => g.id === goal.id);
  if (idx >= 0) {
    all[idx] = { ...goal, updatedAt: new Date().toISOString() };
  } else {
    all.push(goal);
  }
  setStorage(RAMADAN_GOALS_KEY, all);
}

export function deleteRamadanGoal(goalId: string): boolean {
  const all = getStorage<RamadanGoal>(RAMADAN_GOALS_KEY);
  const filtered = all.filter((g) => g.id !== goalId);
  if (filtered.length === all.length) return false;
  setStorage(RAMADAN_GOALS_KEY, filtered);
  return true;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { VerifiedDhikrProvider } from "./dhikr-provider";
export type { DhikrContentProvider } from "./dhikr-provider";
