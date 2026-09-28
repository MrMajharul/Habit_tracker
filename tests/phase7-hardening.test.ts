import { beforeEach, describe, expect, it } from "vitest";

import { SEED_HADITH } from "@/data/hadith/seed-hadith";
import {
  clearOfflineQueue,
  enqueueOfflineAction,
  getOfflineQueue,
  saveOfflineQueue,
  type OfflineAction,
} from "@/lib/offline/offline-sync-queue";
import {
  csvEscape,
  toCsv,
} from "@/services/analytics/analytics-export-service";
import {
  VerifiedDhikrProvider,
} from "@/services/dhikr/dhikr-provider";
import { SURAH_DATA } from "@/services/quran/quran-provider";

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

describe("Phase 7 — Production Hardening & Security Suite", () => {
  const storage = createLocalStorageMock();

  beforeEach(() => {
    storage.clear();
    // @ts-expect-error polyfill for test environment
    globalThis.window = globalThis;
    // @ts-expect-error polyfill for test environment
    globalThis.localStorage = storage;
  });

  describe("CSV Formula Injection Protection (CWE-1236)", () => {
    it("neutralizes values starting with '=' by prefixing single quote", () => {
      const malicious = "=1+1";
      const escaped = csvEscape(malicious);
      expect(escaped).toBe("'=1+1");
      expect(escaped.startsWith("'=")).toBe(true);
    });

    it("neutralizes dangerous cmd / DDE injection formulas", () => {
      const payload = "=cmd|' /C calc'!A0";
      const escaped = csvEscape(payload);
      expect(escaped.startsWith("'=")).toBe(true);
      expect(escaped).toBe("'=cmd|' /C calc'!A0");
    });

    it("neutralizes values starting with '+', '-', '@'", () => {
      expect(csvEscape("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
      expect(csvEscape("-cmd|' /C notepad'")).toBe("'-cmd|' /C notepad'");
      expect(csvEscape("@SUM(B1:B5)")).toBe("'@SUM(B1:B5)");
    });

    it("handles whitespace before formula characters", () => {
      const spaced = "   =HYPERLINK(\"http://evil.com\")";
      const escaped = csvEscape(spaced);
      expect(escaped).toContain("'");
      expect(escaped.startsWith("\"'   =")).toBe(true);
    });

    it("does not corrupt standard numbers", () => {
      expect(csvEscape(42)).toBe("42");
      expect(csvEscape(0)).toBe("0");
      expect(csvEscape(-5)).toBe("-5");
    });

    it("correctly quotes values containing commas and newlines per RFC 4180", () => {
      expect(csvEscape("Salah, Dhikr")).toBe('"Salah, Dhikr"');
      expect(csvEscape("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
      expect(csvEscape('Quote "here"')).toBe('"Quote ""here"""');
    });

    it("prepends UTF-8 BOM in toCsv for Bengali and Arabic Excel compatibility", () => {
      const csv = toCsv(["arabic", "bangla"], [["سُبْحَانَ اللهِ", "সুবহানাল্লাহ"]]);
      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv).toContain("سُبْحَانَ اللهِ");
      expect(csv).toContain("সুবহানাল্লাহ");
    });
  });

  describe("Offline Queue & Cross-User Account Isolation", () => {
    it("persists user ID on queued offline actions", () => {
      clearOfflineQueue();
      const action: OfflineAction = {
        id: "act-1",
        type: "LOG_HABIT",
        payload: { habitId: "h1", date: "2026-09-28", completed: true },
        timestamp: Date.now(),
        userId: "user-alpha",
      };
      saveOfflineQueue([action]);

      const queue = getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].userId).toBe("user-alpha");
    });

    it("clears all offline actions on logout with clearOfflineQueue()", () => {
      clearOfflineQueue();
      saveOfflineQueue([
        {
          id: "act-1",
          type: "LOG_HABIT",
          payload: { habitId: "h1" },
          timestamp: Date.now(),
          userId: "user-alpha",
        },
        {
          id: "act-2",
          type: "LOG_PRAYER",
          payload: { prayer: "fajr" },
          timestamp: Date.now(),
          userId: "user-beta",
        },
      ]);

      expect(getOfflineQueue()).toHaveLength(2);
      clearOfflineQueue();
      expect(getOfflineQueue()).toHaveLength(0);
    });

    it("selectively clears actions for a specific user ID", () => {
      clearOfflineQueue();
      saveOfflineQueue([
        {
          id: "act-1",
          type: "LOG_HABIT",
          payload: { habitId: "h1" },
          timestamp: Date.now(),
          userId: "user-alpha",
        },
        {
          id: "act-2",
          type: "LOG_PRAYER",
          payload: { prayer: "fajr" },
          timestamp: Date.now(),
          userId: "user-beta",
        },
      ]);

      clearOfflineQueue("user-alpha");
      const remaining = getOfflineQueue();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].userId).toBe("user-beta");
      clearOfflineQueue();
    });
  });

  describe("Islamic Content & Canon Verification", () => {
    it("contains exactly 114 Surahs in canonical metadata", () => {
      expect(SURAH_DATA).toHaveLength(114);

      // Verify boundary surahs
      expect(SURAH_DATA[0].number).toBe(1);
      expect(SURAH_DATA[0].name).toBe("Al-Fatihah");
      expect(SURAH_DATA[0].ayahCount).toBe(7);

      expect(SURAH_DATA[113].number).toBe(114);
      expect(SURAH_DATA[113].name).toBe("An-Nas");
      expect(SURAH_DATA[113].ayahCount).toBe(6);
    });

    it("ensures every Surah has verified Arabic name and positive ayah count", () => {
      for (const surah of SURAH_DATA) {
        expect(surah.arabicName.trim().length).toBeGreaterThan(0);
        expect(surah.ayahCount).toBeGreaterThanOrEqual(3);
        expect(["meccan", "medinan"]).toContain(surah.revelationType);
        expect(surah.juz.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("verifies SEED_HADITH contains documented citations and non-empty Arabic", () => {
      expect(SEED_HADITH.length).toBeGreaterThanOrEqual(2);
      for (const hadith of SEED_HADITH) {
        expect(hadith.arabicText.trim().length).toBeGreaterThan(0);
        expect(hadith.englishTranslation.trim().length).toBeGreaterThan(0);
        expect(hadith.source.trim().length).toBeGreaterThan(0);
        expect(hadith.sourceUrl).toMatch(/^https:\/\/sunnah\.com\//);
        expect(hadith.isVerified).toBe(true);
        expect(["Sahih", "Hasan"]).toContain(hadith.grade);
      }
    });

    it("verifies Canonical Dhikr library contains authentic citations and grades", () => {
      const provider = new VerifiedDhikrProvider();
      const allDhikr = provider.getAllDhikr();
      expect(allDhikr.length).toBeGreaterThanOrEqual(15);

      for (const dhikr of allDhikr) {
        expect(dhikr.arabic.trim().length).toBeGreaterThan(0);
        expect(dhikr.translationEn.trim().length).toBeGreaterThan(0);
        expect(dhikr.source.trim().length).toBeGreaterThan(0);
        expect(dhikr.reference.trim().length).toBeGreaterThan(0);
        expect(dhikr.grade).toBe("sahih");
        expect(dhikr.recommendedCount).toBeGreaterThan(0);
      }
    });

    it("verifies Canonical Duas contain authentic Quranic or Hadith sources", () => {
      const provider = new VerifiedDhikrProvider();
      const allDuas = provider.getAllDuas();
      expect(allDuas.length).toBeGreaterThanOrEqual(9);

      for (const dua of allDuas) {
        expect(dua.arabic.trim().length).toBeGreaterThan(0);
        expect(dua.translationEn.trim().length).toBeGreaterThan(0);
        expect(dua.source.trim().length).toBeGreaterThan(0);
        expect(dua.reference.trim().length).toBeGreaterThan(0);
        expect(["sahih", "hasan", "mutawatir"]).toContain(dua.grade);
      }
    });
  });

  describe("Malicious Input & Script Injection Safety", () => {
    it("safely enqueues and stores HTML script tags as literal data", () => {
      clearOfflineQueue();
      const scriptPayload = '<script>alert("xss")</script>';
      enqueueOfflineAction({
        type: "create_task",
        payload: { title: scriptPayload },
      });

      const queue = getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].payload.title).toBe(scriptPayload);
      clearOfflineQueue();
    });

    it("safely sanitizes task title with formula and script payloads in CSV export", () => {
      const xssFormula = '=<script>alert("xss")</script>';
      const escaped = csvEscape(xssFormula);
      expect(escaped).toContain("'=");
      expect(escaped).toContain('<script>alert(""xss"")</script>');
    });
  });
});
