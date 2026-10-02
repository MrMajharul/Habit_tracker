import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  fetchChapterTiming,
  findActiveAyahAndWord,
  getAyahStartSeconds,
  QURAN_COM_RECITER_IDS,
  type VerseTimestamp,
} from "@/services/quran/quran-audio-timing-service";

const sampleTimestamps: VerseTimestamp[] = [
  {
    verseKey: "1:1",
    ayahNumber: 1,
    timestampFrom: 0,
    timestampTo: 6090,
    duration: 6090,
    segments: [
      [1, 0, 580],
      [2, 580, 1409],
      [3, 1409, 2502],
      [4, 2502, 5840],
    ],
  },
  {
    verseKey: "1:2",
    ayahNumber: 2,
    timestampFrom: 6090,
    timestampTo: 11680,
    duration: 5590,
    segments: [
      [1, 6090, 7025],
      [2, 7025, 7885],
      [3, 7885, 8515],
      [4, 8515, 11550],
    ],
  },
];

describe("Quran Audio Timing Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Reciter mapping", () => {
    it("maps all supported reciters to Quran.com IDs", () => {
      expect(QURAN_COM_RECITER_IDS.alafasy).toBe(7);
      expect(QURAN_COM_RECITER_IDS.abdulbasit).toBe(2);
      expect(QURAN_COM_RECITER_IDS.shatri).toBe(4);
    });
  });

  describe("findActiveAyahAndWord", () => {
    it("returns nulls for empty or undefined timestamps", () => {
      expect(findActiveAyahAndWord(null, 1000)).toEqual({
        activeAyahNumber: null,
        activeWordIndex: null,
      });
      expect(findActiveAyahAndWord([], 1000)).toEqual({
        activeAyahNumber: null,
        activeWordIndex: null,
      });
    });

    it("identifies Ayah 1 and Word 1 at 300ms", () => {
      const result = findActiveAyahAndWord(sampleTimestamps, 300);
      expect(result.activeAyahNumber).toBe(1);
      expect(result.activeWordIndex).toBe(1);
    });

    it("identifies Ayah 1 and Word 3 at 2000ms", () => {
      const result = findActiveAyahAndWord(sampleTimestamps, 2000);
      expect(result.activeAyahNumber).toBe(1);
      expect(result.activeWordIndex).toBe(3);
    });

    it("identifies Ayah 2 and Word 1 at 6500ms", () => {
      const result = findActiveAyahAndWord(sampleTimestamps, 6500);
      expect(result.activeAyahNumber).toBe(2);
      expect(result.activeWordIndex).toBe(1);
    });

    it("returns active Ayah with null word index if playback is in a pause between words", () => {
      // 5900ms is between word 4 (ends at 5840) and ayah 2 (starts at 6090)
      const result = findActiveAyahAndWord(sampleTimestamps, 5900);
      expect(result.activeAyahNumber).toBe(1);
      expect(result.activeWordIndex).toBeNull();
    });

    it("returns nulls when time is beyond the end of the chapter", () => {
      const result = findActiveAyahAndWord(sampleTimestamps, 20000);
      expect(result.activeAyahNumber).toBe(null);
      expect(result.activeWordIndex).toBe(null);
    });
  });

  describe("getAyahStartSeconds", () => {
    it("returns null when ayah not found", () => {
      expect(getAyahStartSeconds(sampleTimestamps, 99)).toBeNull();
      expect(getAyahStartSeconds([], 1)).toBeNull();
    });

    it("returns start time in seconds for Ayah 1 and Ayah 2", () => {
      expect(getAyahStartSeconds(sampleTimestamps, 1)).toBe(0);
      expect(getAyahStartSeconds(sampleTimestamps, 2)).toBe(6.09);
    });
  });

  describe("fetchChapterTiming", () => {
    it("fetches timing from API and formats timestamps", async () => {
      const mockApiResponse = {
        audio_file: {
          id: 911,
          chapter_id: 1,
          audio_url: "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3",
          timestamps: [
            {
              verse_key: "1:1",
              timestamp_from: 0,
              timestamp_to: 6090,
              duration: 6090,
              segments: [[1, 0, 580]],
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const data = await fetchChapterTiming(1, "alafasy");
      expect(data).not.toBeNull();
      expect(data?.surahNumber).toBe(1);
      expect(data?.reciterId).toBe("alafasy");
      expect(data?.audioUrl).toBe(mockApiResponse.audio_file.audio_url);
      expect(data?.timestamps[0].ayahNumber).toBe(1);
      expect(data?.timestamps[0].segments).toEqual([[1, 0, 580]]);
    });

    it("returns null when fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      const data = await fetchChapterTiming(999, "alafasy");
      expect(data).toBeNull();
    });
  });
});
