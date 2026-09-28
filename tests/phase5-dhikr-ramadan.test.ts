import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  VerifiedDhikrProvider,
} from "@/services/dhikr/dhikr-provider";
import {
  addDhikrFavorite,
  completeDhikrSession,
  createDhikrSession,
  getDhikrById,
  getDhikrByCategory,
  getDhikrFavorites,
  getDhikrSessions,
  getAllDhikr,
  getMorningAdhkar,
  getEveningAdhkar,
  getAfterSalahAdhkar,
  removeDhikrFavorite,
  isDhikrFavorite,
  searchDhikr,
  gregorianToHijri,
  getRamadanInfo,
  getAllDuas,
  getDuasByCategory,
  searchDuas,
  getRamadanSettings,
  saveRamadanSettings,
  getDefaultRamadanSettings,
  getRamadanGoals,
  saveRamadanGoal,
  deleteRamadanGoal,
  getRamadanDailyLogs,
  saveRamadanDailyLog,
  updateDhikrSession,
} from "@/services/dhikr/dhikr-service";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
Object.defineProperty(globalThis, "window", {
  value: {
    ...globalThis,
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: localStorageMock,
  },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

// ─── Dhikr Provider Tests ─────────────────────────────────────────────────────

describe("Dhikr Provider", () => {
  const provider = new VerifiedDhikrProvider();

  it("returns all dhikr items", () => {
    const all = provider.getAllDhikr();
    expect(all.length).toBeGreaterThan(0);
    // Every item should have required fields
    for (const d of all) {
      expect(d.id).toBeTruthy();
      expect(d.arabic).toBeTruthy();
      expect(d.translationEn).toBeTruthy();
      expect(d.category).toBeTruthy();
      expect(d.source).toBeTruthy();
      expect(d.reference).toBeTruthy();
      expect(d.recommendedCount).toBeGreaterThan(0);
    }
  });

  it("filters by category", () => {
    const morning = provider.getDhikrByCategory("morning");
    expect(morning.length).toBeGreaterThan(0);
    for (const d of morning) {
      expect(d.category).toBe("morning");
    }

    const afterSalah = provider.getDhikrByCategory("after_salah");
    expect(afterSalah.length).toBeGreaterThan(0);
    for (const d of afterSalah) {
      expect(d.category).toBe("after_salah");
    }
  });

  it("retrieves dhikr by ID", () => {
    const item = provider.getDhikrById("subhanallah-after-salah");
    expect(item).toBeDefined();
    expect(item!.arabic).toContain("سُبْحَانَ");
  });

  it("returns undefined for non-existent ID", () => {
    expect(provider.getDhikrById("non-existent")).toBeUndefined();
  });

  it("has verified source metadata", () => {
    const all = provider.getAllDhikr();
    for (const d of all) {
      // Source must reference an actual Islamic text
      expect(
        d.source.includes("Bukhari") ||
        d.source.includes("Muslim") ||
        d.source.includes("Tirmidhi") ||
        d.source.includes("Abu Dawud") ||
        d.source.includes("Nasa'i") ||
        d.source.includes("Ibn Majah") ||
        d.source.includes("Qur'an") ||
        d.source.includes("Hisnul Muslim"),
      ).toBe(true);
    }
  });

  it("searches dhikr by translation", () => {
    const results = provider.searchDhikr("forgiveness");
    expect(results.length).toBeGreaterThan(0);
  });

  it("searches dhikr by transliteration", () => {
    const results = provider.searchDhikr("SubhanAllah");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns morning adhkar", () => {
    expect(provider.getMorningAdhkar().length).toBeGreaterThan(0);
  });

  it("returns evening adhkar", () => {
    expect(provider.getEveningAdhkar().length).toBeGreaterThan(0);
  });

  it("returns after-salah adhkar", () => {
    expect(provider.getAfterSalahAdhkar().length).toBeGreaterThan(0);
  });
});

// ─── Dua Provider Tests ───────────────────────────────────────────────────────

describe("Dua Provider", () => {
  const provider = new VerifiedDhikrProvider();

  it("returns all duas", () => {
    const all = provider.getAllDuas();
    expect(all.length).toBeGreaterThan(0);
    for (const d of all) {
      expect(d.id).toBeTruthy();
      expect(d.arabic).toBeTruthy();
      expect(d.translationEn).toBeTruthy();
      expect(d.source).toBeTruthy();
      expect(d.reference).toBeTruthy();
    }
  });

  it("filters duas by category", () => {
    const knowledge = provider.getDuasByCategory("knowledge");
    expect(knowledge.length).toBeGreaterThan(0);
    for (const d of knowledge) {
      expect(d.category).toBe("knowledge");
    }
  });

  it("searches duas", () => {
    const results = provider.searchDuas("knowledge");
    expect(results.length).toBeGreaterThan(0);
  });
});

// ─── Dhikr Service Tests ──────────────────────────────────────────────────────

describe("Dhikr Service", () => {
  it("getAllDhikr returns items", () => {
    expect(getAllDhikr().length).toBeGreaterThan(0);
  });

  it("getDhikrByCategory works", () => {
    const items = getDhikrByCategory("morning");
    expect(items.length).toBeGreaterThan(0);
  });

  it("getDhikrById works", () => {
    const item = getDhikrById("subhanallah-after-salah");
    expect(item).toBeDefined();
  });

  it("searchDhikr returns matches", () => {
    expect(searchDhikr("Glory").length).toBeGreaterThan(0);
  });

  it("getMorningAdhkar returns items", () => {
    expect(getMorningAdhkar().length).toBeGreaterThan(0);
  });

  it("getEveningAdhkar returns items", () => {
    expect(getEveningAdhkar().length).toBeGreaterThan(0);
  });

  it("getAfterSalahAdhkar returns items", () => {
    expect(getAfterSalahAdhkar().length).toBeGreaterThan(0);
  });

  it("getAllDuas returns items", () => {
    expect(getAllDuas().length).toBeGreaterThan(0);
  });

  it("getDuasByCategory works", () => {
    expect(getDuasByCategory("morning").length).toBeGreaterThan(0);
  });

  it("searchDuas works", () => {
    expect(searchDuas("Lord").length).toBeGreaterThan(0);
  });
});

// ─── Dhikr Counter Tests ──────────────────────────────────────────────────────

describe("Dhikr Counter / Session", () => {
  it("creates a session", () => {
    const session = createDhikrSession("user-1", "subhanallah-after-salah", 33);
    expect(session.id).toBeTruthy();
    expect(session.userId).toBe("user-1");
    expect(session.dhikrId).toBe("subhanallah-after-salah");
    expect(session.targetCount).toBe(33);
    expect(session.completedCount).toBe(0);
    expect(session.status).toBe("INTERRUPTED");
  });

  it("completes a session", () => {
    const session = createDhikrSession("user-1", "subhanallah-after-salah", 33);
    const completed = completeDhikrSession(session.id, 33);
    expect(completed).toBeDefined();
    expect(completed!.status).toBe("COMPLETED");
    expect(completed!.completedCount).toBe(33);
    expect(completed!.completedAt).toBeTruthy();
  });

  it("updates a session", () => {
    const session = createDhikrSession("user-1", "test-dhikr", 10);
    const updated = updateDhikrSession(session.id, { completedCount: 5 });
    expect(updated).toBeDefined();
    expect(updated!.completedCount).toBe(5);
  });

  it("retrieves sessions for user", () => {
    localStorageMock.clear();
    createDhikrSession("user-A", "test-1", 10);
    createDhikrSession("user-B", "test-2", 20);
    createDhikrSession("user-A", "test-3", 30);

    const sessionsA = getDhikrSessions("user-A");
    expect(sessionsA.length).toBe(2);

    const sessionsB = getDhikrSessions("user-B");
    expect(sessionsB.length).toBe(1);
  });

  it("returns undefined when updating non-existent session", () => {
    expect(updateDhikrSession("non-existent-id", { completedCount: 5 })).toBeUndefined();
  });
});

// ─── Favorites Tests ──────────────────────────────────────────────────────────

describe("Dhikr Favorites", () => {
  it("adds a favorite", () => {
    const fav = addDhikrFavorite("user-1", "subhanallah-after-salah");
    expect(fav).not.toBeNull();
    expect(fav!.dhikrId).toBe("subhanallah-after-salah");
  });

  it("prevents duplicate favorites", () => {
    addDhikrFavorite("user-1", "alhamdulillah-after-salah");
    const dup = addDhikrFavorite("user-1", "alhamdulillah-after-salah");
    expect(dup).toBeNull();
  });

  it("removes a favorite", () => {
    addDhikrFavorite("user-1", "remove-test");
    const result = removeDhikrFavorite("user-1", "remove-test");
    expect(result).toBe(true);
    expect(isDhikrFavorite("user-1", "remove-test")).toBe(false);
  });

  it("returns false when removing non-existent favorite", () => {
    expect(removeDhikrFavorite("user-1", "non-existent")).toBe(false);
  });

  it("checks if dhikr is a favorite", () => {
    addDhikrFavorite("user-1", "check-test");
    expect(isDhikrFavorite("user-1", "check-test")).toBe(true);
    expect(isDhikrFavorite("user-1", "other")).toBe(false);
  });

  it("gets favorites for a specific user", () => {
    localStorageMock.clear();
    addDhikrFavorite("user-A", "fav-1");
    addDhikrFavorite("user-B", "fav-2");
    addDhikrFavorite("user-A", "fav-3");

    const favsA = getDhikrFavorites("user-A");
    expect(favsA.length).toBe(2);
    const favsB = getDhikrFavorites("user-B");
    expect(favsB.length).toBe(1);
  });
});

// ─── Islamic Calendar Tests ───────────────────────────────────────────────────

describe("Islamic Calendar / Ramadan Detection", () => {
  it("computes a Hijri date", () => {
    const hijri = gregorianToHijri(new Date(2026, 8, 28)); // Sept 28, 2026
    expect(hijri.year).toBeGreaterThan(1400);
    expect(hijri.month).toBeGreaterThanOrEqual(1);
    expect(hijri.month).toBeLessThanOrEqual(12);
    expect(hijri.day).toBeGreaterThanOrEqual(1);
    expect(hijri.day).toBeLessThanOrEqual(30);
    expect(hijri.monthName).toBeTruthy();
  });

  it("returns RamadanInfo with isRamadan flag", () => {
    const info = getRamadanInfo(new Date());
    expect(typeof info.isRamadan).toBe("boolean");
    expect(info.totalDays).toBe(30);
    expect(info.hijriDate).toBeDefined();
    expect(info.hijriDate.monthName).toBeTruthy();
  });

  it("identifies Ramadan when month is 9", () => {
    // Create a mock that returns month 9
    const info = getRamadanInfo();
    if (info.hijriDate.month === 9) {
      expect(info.isRamadan).toBe(true);
      expect(info.ramadanDay).toBeDefined();
    } else {
      expect(info.isRamadan).toBe(false);
      expect(info.ramadanDay).toBeUndefined();
    }
  });

  it("Hijri month names are valid", () => {
    const validNames = [
      "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' ath-Thani",
      "Jumada al-Ula", "Jumada ath-Thaniyah", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhul-Qi'dah", "Dhul-Hijjah",
    ];
    const hijri = gregorianToHijri(new Date());
    expect(validNames).toContain(hijri.monthName);
  });
});

// ─── Ramadan Settings Tests ───────────────────────────────────────────────────

describe("Ramadan Settings", () => {
  it("returns null when no settings exist", () => {
    expect(getRamadanSettings("new-user")).toBeNull();
  });

  it("saves and retrieves settings", () => {
    const defaults = getDefaultRamadanSettings("test-user");
    saveRamadanSettings(defaults);
    const retrieved = getRamadanSettings("test-user");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.userId).toBe("test-user");
    expect(retrieved!.isEnabled).toBe(false);
  });

  it("updates existing settings", () => {
    const defaults = getDefaultRamadanSettings("test-user-2");
    saveRamadanSettings(defaults);

    const updated = { ...defaults, isEnabled: true, dailyQuranTarget: 30 };
    saveRamadanSettings(updated);

    const retrieved = getRamadanSettings("test-user-2");
    expect(retrieved!.isEnabled).toBe(true);
    expect(retrieved!.dailyQuranTarget).toBe(30);
  });

  it("provides valid default settings", () => {
    const defaults = getDefaultRamadanSettings("user");
    expect(defaults.suhoorReminder).toBe(true);
    expect(defaults.iftarReminder).toBe(true);
    expect(defaults.dailyQuranTarget).toBe(20);
    expect(defaults.taraweehTracking).toBe(true);
  });
});

// ─── Ramadan Goals Tests ──────────────────────────────────────────────────────

describe("Ramadan Goals", () => {
  it("creates a goal", () => {
    const goal = {
      id: "goal-1",
      userId: "user-1",
      title: "Complete Qur'an",
      goalType: "quran_khatm" as const,
      targetValue: 30,
      currentValue: 0,
      unit: "juz",
      startDate: "2026-03-01",
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRamadanGoal(goal);
    const goals = getRamadanGoals("user-1");
    expect(goals.length).toBe(1);
    expect(goals[0].title).toBe("Complete Qur'an");
  });

  it("updates a goal's progress", () => {
    localStorageMock.clear();
    const goal = {
      id: "goal-update",
      userId: "user-1",
      title: "Morning Adhkar",
      goalType: "adhkar" as const,
      targetValue: 30,
      currentValue: 10,
      unit: "days",
      startDate: "2026-03-01",
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRamadanGoal(goal);
    saveRamadanGoal({ ...goal, currentValue: 20 });

    const goals = getRamadanGoals("user-1");
    expect(goals.length).toBe(1);
    expect(goals[0].currentValue).toBe(20);
  });

  it("marks a goal as completed", () => {
    localStorageMock.clear();
    const goal = {
      id: "goal-complete",
      userId: "user-1",
      title: "Read Qur'an Daily",
      goalType: "quran_daily" as const,
      targetValue: 30,
      currentValue: 30,
      unit: "days",
      startDate: "2026-03-01",
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRamadanGoal(goal);

    const goals = getRamadanGoals("user-1");
    expect(goals[0].isCompleted).toBe(true);
  });

  it("deletes a goal", () => {
    localStorageMock.clear();
    const goal = {
      id: "goal-delete",
      userId: "user-1",
      title: "Test",
      goalType: "custom" as const,
      targetValue: 1,
      currentValue: 0,
      unit: "times",
      startDate: "2026-03-01",
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRamadanGoal(goal);
    expect(getRamadanGoals("user-1").length).toBe(1);

    deleteRamadanGoal("goal-delete");
    expect(getRamadanGoals("user-1").length).toBe(0);
  });
});

// ─── Ramadan Daily Log Tests ──────────────────────────────────────────────────

describe("Ramadan Daily Logs", () => {
  it("saves and retrieves a daily log", () => {
    localStorageMock.clear();
    const log = {
      id: "log-1",
      userId: "user-1",
      hijriDate: "1447-09-01",
      ramadanDay: 1,
      fajrCompleted: true,
      quranCompleted: false,
      morningAdhkarCompleted: true,
      dhikrCompleted: false,
      dhuhrCompleted: false,
      asrCompleted: false,
      iftarCompleted: false,
      maghribCompleted: false,
      eveningAdhkarCompleted: false,
      ishaCompleted: false,
      taraweehCompleted: false,
      reflectionCompleted: false,
      customItems: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRamadanDailyLog(log);

    const logs = getRamadanDailyLogs("user-1");
    expect(logs.length).toBe(1);
    expect(logs[0].fajrCompleted).toBe(true);
    expect(logs[0].morningAdhkarCompleted).toBe(true);
    expect(logs[0].quranCompleted).toBe(false);
  });
});

// ─── Suggestion Engine Dhikr Tests ────────────────────────────────────────────

describe("Suggestion Engine - Dhikr & Ramadan", () => {
  it("includes dhikr in suggestion types", async () => {
    const { RuleBasedSuggestionEngine } = await import(
      "@/services/suggestions/suggestion-engine"
    );
    const engine = new RuleBasedSuggestionEngine();

    // Early morning - should include morning adhkar
    const suggestion = await engine.generateSuggestions({
      currentTime: new Date(2026, 8, 28, 5, 30),
      nextPrayerName: "Dhuhr",
      morningAdhkarCompleted: false,
    });

    expect(suggestion.items.length).toBeGreaterThan(0);
    // Should have a morning adhkar item
    const adhkarItem = suggestion.items.find(
      (i) => i.type === "MORNING_ADHKAR" || i.id === "morning-adhkar",
    );
    expect(adhkarItem).toBeDefined();
  });

  it("marks morning adhkar as completed when done", async () => {
    const { RuleBasedSuggestionEngine } = await import(
      "@/services/suggestions/suggestion-engine"
    );
    const engine = new RuleBasedSuggestionEngine();

    const suggestion = await engine.generateSuggestions({
      currentTime: new Date(2026, 8, 28, 5, 30),
      nextPrayerName: "Dhuhr",
      morningAdhkarCompleted: true,
    });

    const adhkarItem = suggestion.items.find(
      (i) => i.type === "MORNING_ADHKAR",
    );
    expect(adhkarItem).toBeDefined();
    expect(adhkarItem!.title).toContain("✓");
  });

  it("includes evening dhikr in night suggestions", async () => {
    const { RuleBasedSuggestionEngine } = await import(
      "@/services/suggestions/suggestion-engine"
    );
    const engine = new RuleBasedSuggestionEngine();

    const suggestion = await engine.generateSuggestions({
      currentTime: new Date(2026, 8, 28, 22, 0),
    });

    // Night block should have a dhikr item
    const dhikrItem = suggestion.items.find(
      (i) => i.category === "dhikr" || i.id === "sleep-adhkar",
    );
    expect(dhikrItem).toBeDefined();
  });
});

// ─── Offline Queue Phase 5 Tests ──────────────────────────────────────────────

describe("Offline Queue - Phase 5", () => {
  it("enqueues dhikr session action", async () => {
    const { enqueueOfflineAction, getOfflineQueue } = await import("@/lib/offline/offline-sync-queue");
    localStorageMock.clear();

    enqueueOfflineAction({
      type: "create_dhikr_session",
      payload: { dhikr_id: "subhanallah", target_count: 33, completed_count: 33 },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("create_dhikr_session");
  });

  it("enqueues dhikr favorite action", async () => {
    const { enqueueOfflineAction, getOfflineQueue } = await import("@/lib/offline/offline-sync-queue");
    localStorageMock.clear();

    enqueueOfflineAction({
      type: "create_dhikr_favorite",
      payload: { dhikr_id: "subhanallah" },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("create_dhikr_favorite");
  });

  it("enqueues Ramadan settings action", async () => {
    const { enqueueOfflineAction, getOfflineQueue } = await import("@/lib/offline/offline-sync-queue");
    localStorageMock.clear();

    enqueueOfflineAction({
      type: "save_ramadan_settings",
      payload: { is_enabled: true, daily_quran_target: 30 },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("save_ramadan_settings");
  });
});
