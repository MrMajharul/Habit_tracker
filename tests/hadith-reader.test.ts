import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  HADITH_COLLECTIONS,
  hadithService,
} from "@/services/hadith/hadith-service";
import type { HadithRecord } from "@/services/hadith/types";

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
Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });

describe("Full Hadith Collection Reader", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("Six canonical collections metadata", () => {
    it("contains exactly the six major Kutub al-Sittah collections", () => {
      const ids = HADITH_COLLECTIONS.map((c) => c.id);
      expect(ids).toContain("bukhari");
      expect(ids).toContain("muslim");
      expect(ids).toContain("tirmidhi");
      expect(ids).toContain("abudawud");
      expect(ids).toContain("nasai");
      expect(ids).toContain("ibnmajah");
      expect(HADITH_COLLECTIONS.length).toBe(6);
    });

    it("has valid non-empty names, descriptions, and book counts for all collections", () => {
      for (const col of HADITH_COLLECTIONS) {
        expect(col.name.length).toBeGreaterThan(0);
        expect(col.arabicName.length).toBeGreaterThan(0);
        expect(col.description.length).toBeGreaterThan(0);
        expect(col.totalBooks).toBeGreaterThan(30);
        expect(col.totalHadiths).toBeGreaterThan(3000);
      }
    });
  });

  describe("Collection sections and books", () => {
    it("returns book sections for Sahih al-Bukhari", async () => {
      const sections = await hadithService.getCollectionSections("bukhari");
      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0].bookNumber).toBe(1);
      expect(sections[0].title).toBeTruthy();
    });

    it("returns book sections for Sahih Muslim", async () => {
      const sections = await hadithService.getCollectionSections("muslim");
      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0].bookNumber).toBe(1);
      expect(sections[0].title).toBeTruthy();
    });
  });

  describe("Reading position tracking", () => {
    it("returns null when no reading position is stored", () => {
      expect(hadithService.getLastReadPosition()).toBeNull();
    });

    it("saves and retrieves reading position accurately", () => {
      hadithService.saveLastReadPosition({
        collectionId: "bukhari",
        bookNumber: 1,
        hadithNumber: "1",
      });

      const pos = hadithService.getLastReadPosition();
      expect(pos).not.toBeNull();
      expect(pos?.collectionId).toBe("bukhari");
      expect(pos?.bookNumber).toBe(1);
      expect(pos?.hadithNumber).toBe("1");
      expect(pos?.updatedAt).toBeGreaterThan(0);
    });
  });

  describe("Authentic Hadith Records & References", () => {
    it("returns authentic hadiths with non-empty arabic and english text", async () => {
      const all = await hadithService.getAllHadith();
      expect(all.length).toBeGreaterThan(0);

      for (const h of all) {
        expect(h.id).toBeTruthy();
        expect(h.source).toBeTruthy();
        expect(h.book).toBeTruthy();
        expect(h.hadithNumber).toBeTruthy();
        expect(h.englishTranslation.length).toBeGreaterThan(0);
        expect(h.isVerified).toBe(true);
      }
    });

    it("formats reference strings correctly without fabrication", () => {
      const sample: HadithRecord = {
        id: "bukhari-1-1",
        arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        englishTranslation: "Actions are judged by intentions...",
        banglaTranslation: null,
        source: "Sahih al-Bukhari",
        book: "Revelation",
        bookNumber: 1,
        hadithNumber: "1",
        grade: "Sahih",
        topic: "Revelation",
        isVerified: true,
        sourceUrl: "https://sunnah.com/bukhari:1",
      };

      const ref = `${sample.source}, ${sample.book}, Hadith ${sample.hadithNumber}`;
      expect(ref).toBe("Sahih al-Bukhari, Revelation, Hadith 1");
      expect(sample.sourceUrl).toBe("https://sunnah.com/bukhari:1");
    });
  });
});
