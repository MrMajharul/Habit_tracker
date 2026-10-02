import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AUDIO_CACHE_NAME,
  DEFAULT_RECITER_ID,
  downloadSurahAudio,
  formatSurahAudioNumber,
  getCachedSurahNumbers,
  getSavedAudioState,
  getSurahAudioUrls,
  isSurahAudioCached,
  RECITERS,
  removeDownloadedSurahAudio,
  saveAudioState,
  setupMediaSession,
  updateMediaPlaybackState,
} from "@/services/quran/quran-audio-service";
import { SURAH_DATA } from "@/services/quran/quran-provider";

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

describe("Quran Audio Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("Surah audio metadata for all 114 Surahs", () => {
    it("has 114 surahs in canonical SURAH_DATA", () => {
      expect(SURAH_DATA.length).toBe(114);
      expect(SURAH_DATA[0].number).toBe(1);
      expect(SURAH_DATA[113].number).toBe(114);
    });

    it("formats surah audio numbers with 3-digit zero-padding", () => {
      expect(formatSurahAudioNumber(1)).toBe("001");
      expect(formatSurahAudioNumber(10)).toBe("010");
      expect(formatSurahAudioNumber(114)).toBe("114");
    });

    it("generates valid primary audio URLs for all 114 Surahs", () => {
      for (let s = 1; s <= 114; s++) {
        const { primary } = getSurahAudioUrls(s);
        expect(primary).toContain("download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/");
        expect(primary).toMatch(/\/\d{3}\.mp3$/);
      }
    });

    it("supports all configured reciters with proper URLs", () => {
      expect(RECITERS.length).toBeGreaterThanOrEqual(3);

      for (const reciter of RECITERS) {
        expect(reciter.id).toBeTruthy();
        expect(reciter.name).toBeTruthy();
        expect(reciter.baseUrl).toBeTruthy();

        const { primary, fallback } = getSurahAudioUrls(1, reciter.id);
        expect(primary).toContain(reciter.baseUrl);
        expect(primary).toContain("001.mp3");

        if (reciter.fallbackPattern) {
          expect(fallback).toBeTruthy();
        }
      }
    });
  });

  describe("Audio playback persistence", () => {
    it("returns null when no audio state is saved", () => {
      expect(getSavedAudioState()).toBeNull();
    });

    it("saves and retrieves audio state correctly", () => {
      saveAudioState({
        surahNumber: 18,
        currentTime: 142.5,
        reciterId: "alafasy",
      });

      const state = getSavedAudioState();
      expect(state).not.toBeNull();
      expect(state?.surahNumber).toBe(18);
      expect(state?.currentTime).toBe(142.5);
      expect(state?.reciterId).toBe("alafasy");
      expect(state?.updatedAt).toBeGreaterThan(0);
    });
  });

  describe("Offline audio caching", () => {
    it("returns false for cached check when caches API is not supported", async () => {
      const isCached = await isSurahAudioCached(1);
      expect(isCached).toBe(false);
    });

    it("handles download and cache operations with mocked Cache Storage", async () => {
      const mockPut = vi.fn().mockResolvedValue(undefined);
      const mockMatch = vi.fn().mockResolvedValue(new Response());
      const mockDelete = vi.fn().mockResolvedValue(true);
      const mockKeys = vi.fn().mockResolvedValue([
        new Request("https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3"),
      ]);

      const mockCache = {
        put: mockPut,
        match: mockMatch,
        delete: mockDelete,
        keys: mockKeys,
      };

      const mockCachesOpen = vi.fn().mockResolvedValue(mockCache);
      const mockCachesDelete = vi.fn().mockResolvedValue(true);

      // Mock global window caches
      (global as unknown as { caches: unknown }).caches = {
        open: mockCachesOpen,
        delete: mockCachesDelete,
        match: mockMatch,
      };

      // Mock global fetch
      const mockFetch = vi.fn().mockResolvedValue(new Response("audio-stream", { status: 200 }));
      global.fetch = mockFetch;

      // 1. Download
      const downloaded = await downloadSurahAudio(1, DEFAULT_RECITER_ID);
      expect(downloaded).toBe(true);
      expect(mockCachesOpen).toHaveBeenCalledWith(AUDIO_CACHE_NAME);
      expect(mockPut).toHaveBeenCalled();

      // 2. Is cached
      const cached = await isSurahAudioCached(1, DEFAULT_RECITER_ID);
      expect(cached).toBe(true);

      // 3. Get cached numbers
      const cachedNumbers = await getCachedSurahNumbers(DEFAULT_RECITER_ID);
      expect(cachedNumbers).toContain(1);

      // 4. Remove
      const removed = await removeDownloadedSurahAudio(1, DEFAULT_RECITER_ID);
      expect(removed).toBe(true);
      expect(mockDelete).toHaveBeenCalled();

      delete (global as unknown as { caches?: unknown }).caches;
    });
  });

  describe("Media Session API integration", () => {
    it("configures media metadata and action handlers when mediaSession is present", () => {
      const setActionHandler = vi.fn();
      const mockMediaSession = {
        metadata: null,
        playbackState: "none",
        setActionHandler,
        setPositionState: vi.fn(),
      };

      (navigator as unknown as { mediaSession?: unknown }).mediaSession = mockMediaSession;

      const handlers = {
        onPlay: vi.fn(),
        onPause: vi.fn(),
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onSeekTo: vi.fn(),
      };

      setupMediaSession("Al-Fatihah", "The Opening", "الفاتحة", "Mishary Rashid Alafasy", handlers);

      expect(setActionHandler).toHaveBeenCalledWith("play", handlers.onPlay);
      expect(setActionHandler).toHaveBeenCalledWith("pause", handlers.onPause);
      expect(setActionHandler).toHaveBeenCalledWith("previoustrack", handlers.onPrevious);
      expect(setActionHandler).toHaveBeenCalledWith("nexttrack", handlers.onNext);

      updateMediaPlaybackState("playing", { duration: 60, playbackRate: 1, position: 10 });
      expect(mockMediaSession.playbackState).toBe("playing");

      delete (navigator as unknown as { mediaSession?: unknown }).mediaSession;
    });
  });
});
