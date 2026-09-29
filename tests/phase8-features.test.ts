import { describe, expect, it, beforeEach } from "vitest";

import {
  createCustomDhikr,
  deleteCustomDhikr,
  getCustomDhikr,
  updateCustomDhikr,
} from "@/services/dhikr/dhikr-service";
import { hadithService } from "@/services/hadith/hadith-service";
import { computeForbiddenTimes } from "@/services/prayer/forbidden-times";
import { getQuranProvider, SURAH_DATA } from "@/services/quran/quran-provider";

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });
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

describe("Phase 8: Hadith Hourly Rotation & Popular Hadith", () => {
  it("returns a deterministic hadith for a given hour", async () => {
    const fixedDate1 = new Date(2026, 8, 30, 10, 15);
    const fixedDate2 = new Date(2026, 8, 30, 10, 45); // Same hour
    const fixedDate3 = new Date(2026, 8, 30, 11, 0); // Different hour

    const hadith1 = await hadithService.getHadithOfTheHour(fixedDate1);
    const hadith2 = await hadithService.getHadithOfTheHour(fixedDate2);
    const hadith3 = await hadithService.getHadithOfTheHour(fixedDate3);

    expect(hadith1).not.toBeNull();
    expect(hadith2).not.toBeNull();
    expect(hadith3).not.toBeNull();
    // Same hour must produce the exact same hadith
    expect(hadith1?.id).toBe(hadith2?.id);
    expect(hadith1?.englishTranslation).toBe(hadith2?.englishTranslation);

    // Both should have valid verified text and source
    expect(hadith1?.source).toBeDefined();
    expect(hadith1?.englishTranslation.length).toBeGreaterThan(10);
  });

  it("returns verified popular hadiths", async () => {
    const popular = await hadithService.getPopularHadith();
    expect(popular.length).toBeGreaterThan(0);
    for (const h of popular) {
      expect(h.isPopular).toBe(true);
      expect(h.source).toBeDefined();
      expect(h.englishTranslation).toBeDefined();
    }
  });
});

describe("Phase 8: Forbidden Prayer Times", () => {
  it("calculates 3 forbidden prayer windows correctly", () => {
    const windows = computeForbiddenTimes({
      latitude: 23.8103,
      longitude: 90.4125,
      calculationMethod: "karachi",
      asrMadhhab: "standard",
      date: new Date(2026, 8, 30),
    });

    expect(windows).toHaveLength(3);
    const names = windows.map((w) => w.name);
    expect(names).toContain("After Sunrise");
    expect(names).toContain("Zawal (Solar Noon)");
    expect(names).toContain("Before Sunset");

    for (const w of windows) {
      expect(w.start.getTime()).toBeLessThan(w.end.getTime());
      expect(w.description).toBeDefined();
    }
  });
});

describe("Phase 8: Custom Dhikr CRUD", () => {
  const testUserId = "test_user_phase8";

  it("creates, retrieves, updates, and deletes personal custom dhikr", () => {
    // 1. Create
    const created = createCustomDhikr(testUserId, {
      name: "Subhanallahi wa bihamdihi",
      arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
      targetCount: 100,
      category: "personal",
      notes: "Daily morning tasbeeh",
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Subhanallahi wa bihamdihi");
    expect(created.source).toBe("Personal");
    expect(created.targetCount).toBe(100);

    // 2. Retrieve
    const userDhikrs = getCustomDhikr(testUserId);
    expect(userDhikrs.some((d) => d.id === created.id)).toBe(true);

    // 3. Update
    const updated = updateCustomDhikr(testUserId, created.id, {
      targetCount: 33,
      notes: "Updated target",
    });
    expect(updated?.targetCount).toBe(33);
    expect(updated?.notes).toBe("Updated target");

    // 4. Delete
    const deleted = deleteCustomDhikr(testUserId, created.id);
    expect(deleted).toBe(true);

    const remaining = getCustomDhikr(testUserId);
    expect(remaining.some((d) => d.id === created.id)).toBe(false);
  });
});

describe("Phase 8: Quran Provider with Bengali Support", () => {
  it("provides canonical Surah data with 114 surahs", async () => {
    expect(SURAH_DATA).toHaveLength(114);
    const fatihah = SURAH_DATA[0];
    expect(fatihah.number).toBe(1);
    expect(fatihah.name).toBe("Al-Fatihah");
    expect(fatihah.arabicName).toBe("الفاتحة");
    expect(fatihah.ayahCount).toBe(7);
  });

  it("provider includes Al-Quran Cloud provider with translation types", async () => {
    const provider = getQuranProvider();
    expect(provider).toBeDefined();
    expect(provider.getProviderName()).toContain("Al-Quran Cloud");
  });
});
