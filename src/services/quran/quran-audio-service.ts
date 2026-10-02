/**
 * Quran Audio Service
 *
 * Provides verified audio recitation streams for all 114 Surahs,
 * offline caching via Cache Storage API, Media Session API support
 * for lock-screen/background controls, and reciter management.
 *
 * Source Attribution:
 * Audio files are delivered via Quranicaudio.com / Quran.com CDN and Islamic Network CDN.
 * Authentic, verified recitations licensed for public educational and religious use.
 */

import { fetchChapterTiming } from "./quran-audio-timing-service";

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  baseUrl: string;
  fallbackPattern?: (surah: number) => string;
}

export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    style: "Murattal",
    baseUrl: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee",
    fallbackPattern: (s: number) => `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${s}.mp3`,
  },
  {
    id: "abdulbasit",
    name: "AbdulBaset AbdulSamad",
    arabicName: "عبد الباسط عبد الصمد",
    style: "Murattal",
    baseUrl: "https://download.quranicaudio.com/quran/abdul_basit_murattal",
    fallbackPattern: (s: number) => `https://cdn.islamic.network/quran/audio-surah/128/ar.abdulbasitmurattal/${s}.mp3`,
  },
  {
    id: "shatri",
    name: "Abu Bakr Al-Shatri",
    arabicName: "أبو بكر الشاطري",
    style: "Murattal",
    baseUrl: "https://download.quranicaudio.com/quran/abu_bakr_ash-shaatree",
    fallbackPattern: (s: number) => `https://cdn.mp3quran.net/audio/abubakr-shatri/r1/${formatSurahAudioNumber(s)}.mp3`,
  },
];

export const DEFAULT_RECITER_ID = "alafasy";
export const AUDIO_CACHE_NAME = "istiqamaah-quran-audio-v1";
const AUDIO_STATE_KEY = "istiqamaah_quran_audio_state";

/**
 * Formats a surah number (1-114) into 3-digit zero-padded string (e.g. 001, 114)
 */
export function formatSurahAudioNumber(surahNumber: number): string {
  return String(surahNumber).padStart(3, "0");
}

/**
 * Returns primary and fallback audio URLs for a given Surah and Reciter
 */
export function getSurahAudioUrls(surahNumber: number, reciterId = DEFAULT_RECITER_ID): {
  primary: string;
  fallback?: string;
} {
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  const padded = formatSurahAudioNumber(surahNumber);
  const primary = `${reciter.baseUrl}/${padded}.mp3`;
  const fallback = reciter.fallbackPattern ? reciter.fallbackPattern(surahNumber) : undefined;
  return { primary, fallback };
}

export interface SavedAudioState {
  surahNumber: number;
  currentTime: number;
  reciterId: string;
  updatedAt: number;
}

/**
 * Reads last played audio position from localStorage
 */
export function getSavedAudioState(): SavedAudioState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUDIO_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedAudioState;
  } catch {
    return null;
  }
}

/**
 * Persists current audio state
 */
export function saveAudioState(state: Omit<SavedAudioState, "updatedAt">): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      AUDIO_STATE_KEY,
      JSON.stringify({ ...state, updatedAt: Date.now() }),
    );
  } catch {
    // Ignore storage quota
  }
}

// ─── Cache Storage Offline API ──────────────────────────────────────────────

/**
 * Checks if a surah's audio is already cached offline
 */
export async function isSurahAudioCached(
  surahNumber: number,
  reciterId = DEFAULT_RECITER_ID,
): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const { primary, fallback } = getSurahAudioUrls(surahNumber, reciterId);
    const match = await cache.match(primary);
    if (match) return true;
    if (fallback) {
      const fallbackMatch = await cache.match(fallback);
      return Boolean(fallbackMatch);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Retrieves a cached Surah audio as a Blob for offline playback
 */
export async function getCachedSurahAudioBlob(
  surahNumber: number,
  reciterId = DEFAULT_RECITER_ID,
): Promise<Blob | null> {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const { primary, fallback } = getSurahAudioUrls(surahNumber, reciterId);
    let response = await cache.match(primary);
    if (!response && fallback) {
      response = await cache.match(fallback);
    }
    if (response) {
      return await response.blob();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Downloads and caches a Surah audio file for offline listening
 */
export async function downloadSurahAudio(
  surahNumber: number,
  reciterId = DEFAULT_RECITER_ID,
  onProgress?: (progressPercent: number) => void,
): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    throw new Error("Offline audio cache is not supported in this browser environment.");
  }

  const { primary, fallback } = getSurahAudioUrls(surahNumber, reciterId);
  const cache = await caches.open(AUDIO_CACHE_NAME);

  // Try primary URL first
  try {
    const response = await fetch(primary, { mode: "cors" });
    if (response.ok) {
      await cache.put(primary, response.clone());
      fetchChapterTiming(surahNumber, reciterId).catch(() => {});
      if (onProgress) onProgress(100);
      return true;
    }
  } catch (err) {
    console.warn(`Primary audio fetch failed for Surah ${surahNumber}:`, err);
  }

  // Fallback to secondary CDN if available
  if (fallback) {
    try {
      const fbResponse = await fetch(fallback, { mode: "cors" });
      if (fbResponse.ok) {
        await cache.put(primary, fbResponse.clone());
        fetchChapterTiming(surahNumber, reciterId).catch(() => {});
        if (onProgress) onProgress(100);
        return true;
      }
    } catch (fbErr) {
      console.warn(`Fallback audio fetch failed for Surah ${surahNumber}:`, fbErr);
    }
  }

  throw new Error(`Failed to download audio for Surah ${surahNumber}. Please check internet connection.`);
}

/**
 * Removes cached audio for a specific surah
 */
export async function removeDownloadedSurahAudio(
  surahNumber: number,
  reciterId = DEFAULT_RECITER_ID,
): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const { primary, fallback } = getSurahAudioUrls(surahNumber, reciterId);
    let deleted = await cache.delete(primary);
    if (fallback) {
      const fbDeleted = await cache.delete(fallback);
      deleted = deleted || fbDeleted;
    }
    return deleted;
  } catch {
    return false;
  }
}

/**
 * Returns a list of surah numbers (1-114) that are cached offline for a reciter
 */
export async function getCachedSurahNumbers(
  reciterId = DEFAULT_RECITER_ID,
): Promise<number[]> {
  if (typeof window === "undefined" || !("caches" in window)) return [];
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const requests = await cache.keys();
    const result: number[] = [];

    for (let s = 1; s <= 114; s++) {
      const { primary, fallback } = getSurahAudioUrls(s, reciterId);
      const isMatch = requests.some(
        (r) => r.url === primary || (fallback && r.url === fallback),
      );
      if (isMatch) result.push(s);
    }

    return result;
  } catch {
    return [];
  }
}

/**
 * Clears all cached Quran audio to free disk space
 */
export async function clearAllQuranAudioCache(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    return await caches.delete(AUDIO_CACHE_NAME);
  } catch {
    return false;
  }
}

// ─── Media Session API ──────────────────────────────────────────────────────

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeekTo?: (details: { seekTime: number }) => void;
}

/**
 * Configures the OS lock screen / control center media widget
 */
export function setupMediaSession(
  surahName: string,
  englishName: string,
  arabicName: string,
  reciterName: string,
  handlers: MediaSessionHandlers,
): void {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

  try {
    if (typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${surahName} (${arabicName})`,
        artist: reciterName,
        album: `The Holy Qur'an — ${englishName}`,
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    }

    if (handlers.onPlay) {
      navigator.mediaSession.setActionHandler("play", handlers.onPlay);
    }
    if (handlers.onPause) {
      navigator.mediaSession.setActionHandler("pause", handlers.onPause);
    }
    if (handlers.onPrevious) {
      navigator.mediaSession.setActionHandler("previoustrack", handlers.onPrevious);
    }
    if (handlers.onNext) {
      navigator.mediaSession.setActionHandler("nexttrack", handlers.onNext);
    }
    if (handlers.onSeekTo) {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && handlers.onSeekTo) {
          handlers.onSeekTo({ seekTime: details.seekTime });
        }
      });
    }
  } catch (err) {
    console.warn("MediaSession setup failed:", err);
  }
}

/**
 * Updates playback state on MediaSession
 */
export function updateMediaPlaybackState(
  state: "playing" | "paused" | "none",
  positionState?: { duration: number; playbackRate: number; position: number },
): void {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
    if (positionState && "setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState(positionState);
    }
  } catch {
    // Ignore unsupported browser features
  }
}
