import { describe, it, expect, vi } from "vitest";

// ─── Mock localStorage ──────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("crypto", { randomUUID: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}` });

// ─── Imports ────────────────────────────────────────────────────────────────

import { AlQuranCloudProvider, SURAH_DATA } from "@/services/quran/quran-provider";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Qur'an Provider", () => {
  it("should have exactly 114 surahs in static data", () => {
    expect(SURAH_DATA.length).toBe(114);
  });

  it("should have valid surah numbers from 1 to 114", () => {
    SURAH_DATA.forEach((s, i) => {
      expect(s.number).toBe(i + 1);
    });
  });

  it("should have Arabic names for all surahs", () => {
    SURAH_DATA.forEach((s) => {
      expect(s.arabicName).toBeDefined();
      expect(s.arabicName.length).toBeGreaterThan(0);
    });
  });

  it("should have ayah counts for all surahs", () => {
    SURAH_DATA.forEach((s) => {
      expect(s.ayahCount).toBeGreaterThan(0);
    });
  });

  it("should have revelation type for all surahs", () => {
    SURAH_DATA.forEach((s) => {
      expect(["meccan", "medinan"]).toContain(s.revelationType);
    });
  });

  it("Al-Fatihah should have 7 ayahs", () => {
    expect(SURAH_DATA[0].ayahCount).toBe(7);
  });

  it("An-Nas should be surah 114", () => {
    expect(SURAH_DATA[113].number).toBe(114);
    expect(SURAH_DATA[113].name).toBe("An-Nas");
  });

  describe("AlQuranCloudProvider", () => {
    const provider = new AlQuranCloudProvider();

    it("should list all surahs", async () => {
      const surahs = await provider.listSurahs();
      expect(surahs.length).toBe(114);
    });

    it("should get a specific surah", async () => {
      const surah = await provider.getSurah(1);
      expect(surah).not.toBeNull();
      expect(surah!.name).toBe("Al-Fatihah");
      expect(surah!.ayahCount).toBe(7);
    });

    it("should return null for invalid surah number", async () => {
      expect(await provider.getSurah(0)).toBeNull();
      expect(await provider.getSurah(115)).toBeNull();
      expect(await provider.getSurah(-1)).toBeNull();
    });

    it("should return empty array for invalid surah ayahs", async () => {
      const ayahs = await provider.getAyahs(0);
      expect(ayahs).toEqual([]);
    });

    it("should report its provider name", () => {
      expect(provider.getProviderName()).toBe("Al-Quran Cloud API (alquran.cloud)");
    });
  });
});
