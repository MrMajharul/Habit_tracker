/**
 * Quran Audio Timing Service
 *
 * Provides verse-by-verse timestamps and word-by-word segment boundaries
 * for synchronized recitation highlighting, karaoke-style following, and tap-to-play.
 * Verified data sourced from Quran.com chapter recitations API (v4).
 */

export interface VerseTimestamp {
  verseKey: string;      // e.g. "1:1", "2:255"
  ayahNumber: number;    // 1-based ayah number in the surah
  timestampFrom: number; // in milliseconds
  timestampTo: number;   // in milliseconds
  duration: number;
  segments: [number, number, number][]; // [wordIndex (1-based), startMs, endMs]
}

export interface ChapterTimingData {
  surahNumber: number;
  reciterId: string;
  audioUrl: string;
  timestamps: VerseTimestamp[];
}

// In-memory cache for instant zero-latency lookup during audio timeupdate
const timingMemoryCache = new Map<string, ChapterTimingData>();

// Reciter ID mapping for Quran.com API v4
export const QURAN_COM_RECITER_IDS: Record<string, number> = {
  alafasy: 7,     // Mishari Rashid Alafasy
  abdulbasit: 2,  // AbdulBaset AbdulSamad (Murattal)
  shatri: 4,      // Abu Bakr Al-Shatri
};

const TIMING_STORAGE_PREFIX = "istiqamaah_timing_v1_";

/**
 * Fetches chapter timestamps and word segments for a given Surah and Reciter.
 * Uses in-memory cache, localStorage fallback, and network fetch.
 */
export async function fetchChapterTiming(
  surahNumber: number,
  reciterId = "alafasy",
): Promise<ChapterTimingData | null> {
  const cacheKey = `${surahNumber}_${reciterId}`;

  // 1. Check in-memory cache
  if (timingMemoryCache.has(cacheKey)) {
    return timingMemoryCache.get(cacheKey)!;
  }

  // 2. Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`${TIMING_STORAGE_PREFIX}${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as ChapterTimingData;
        if (parsed && Array.isArray(parsed.timestamps) && parsed.timestamps.length > 0) {
          timingMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage read error
    }
  }

  // 3. Fetch from Quran.com API
  const quranComReciterId = QURAN_COM_RECITER_IDS[reciterId] ?? 7;
  const url = `https://api.quran.com/api/v4/chapter_recitations/${quranComReciterId}/${surahNumber}?segments=true`;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;

    const data = await res.json();
    const audioFile = data?.audio_file;
    if (!audioFile || !Array.isArray(audioFile.timestamps)) return null;

    const timestamps: VerseTimestamp[] = audioFile.timestamps.map(
      (t: {
        verse_key: string;
        timestamp_from: number;
        timestamp_to: number;
        duration: number;
        segments?: [number, number, number][];
      }) => {
        const parts = t.verse_key.split(":");
        const ayahNumber = parseInt(parts[1], 10) || 1;
        return {
          verseKey: t.verse_key,
          ayahNumber,
          timestampFrom: t.timestamp_from,
          timestampTo: t.timestamp_to,
          duration: t.duration,
          segments: Array.isArray(t.segments) ? t.segments : [],
        };
      },
    );

    const timingData: ChapterTimingData = {
      surahNumber,
      reciterId,
      audioUrl: audioFile.audio_url,
      timestamps,
    };

    // Cache in memory
    timingMemoryCache.set(cacheKey, timingData);

    // Cache in localStorage for offline availability
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${TIMING_STORAGE_PREFIX}${cacheKey}`,
          JSON.stringify(timingData),
        );
      } catch {
        // Storage quota exceeded — memory cache remains intact
      }
    }

    return timingData;
  } catch (err) {
    console.warn(`Failed to fetch chapter timing for Surah ${surahNumber}:`, err);
    return null;
  }
}

/**
 * Finds the currently active Ayah and Word index given the current playback time in milliseconds.
 */
export function findActiveAyahAndWord(
  timestamps: VerseTimestamp[] | undefined | null,
  currentTimeMs: number,
): { activeAyahNumber: number | null; activeWordIndex: number | null } {
  if (!timestamps || timestamps.length === 0) {
    return { activeAyahNumber: null, activeWordIndex: null };
  }

  // Find matching verse
  const verse = timestamps.find(
    (v) => currentTimeMs >= v.timestampFrom && currentTimeMs < v.timestampTo,
  );

  if (!verse) {
    return { activeAyahNumber: null, activeWordIndex: null };
  }

  let activeWordIndex: number | null = null;
  if (verse.segments && verse.segments.length > 0) {
    const segment = verse.segments.find(
      ([, startMs, endMs]) => currentTimeMs >= startMs && currentTimeMs <= endMs,
    );
    if (segment) {
      activeWordIndex = segment[0]; // 1-based word index
    }
  }

  return {
    activeAyahNumber: verse.ayahNumber,
    activeWordIndex,
  };
}

/**
 * Finds the starting timestamp (in seconds) for a given Ayah number.
 */
export function getAyahStartSeconds(
  timestamps: VerseTimestamp[] | undefined | null,
  ayahNumber: number,
): number | null {
  if (!timestamps || timestamps.length === 0) return null;
  const match = timestamps.find((v) => v.ayahNumber === ayahNumber);
  if (!match) return null;
  return match.timestampFrom / 1000;
}
