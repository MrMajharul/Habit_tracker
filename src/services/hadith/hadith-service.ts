import { SEED_HADITH } from "@/data/hadith/seed-hadith";

import type { HadithRecord } from "./types";

// ─── Cache Keys ──────────────────────────────────────────────────────────────
const CACHE_KEY = "istiqamaah_hadith_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── API Configuration ───────────────────────────────────────────────────────
// Using fawazahmed0/hadith-api (free, no key required, CDN-backed)
const API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

// Supported collections with metadata
export const HADITH_COLLECTIONS = [
  { id: "bukhari", name: "Sahih al-Bukhari", apiKey: "bukhari", totalBooks: 97 },
  { id: "muslim", name: "Sahih Muslim", apiKey: "muslim", totalBooks: 56 },
  { id: "tirmidhi", name: "Jami` at-Tirmidhi", apiKey: "tirmidhi", totalBooks: 49 },
  { id: "abudawud", name: "Sunan Abi Dawud", apiKey: "abudawud", totalBooks: 43 },
  { id: "nasai", name: "Sunan an-Nasa'i", apiKey: "nasai", totalBooks: 51 },
  { id: "ibnmajah", name: "Sunan Ibn Majah", apiKey: "ibnmajah", totalBooks: 37 },
] as const;

// ─── Cache Helpers ───────────────────────────────────────────────────────────

interface CachedHadithData {
  hadiths: HadithRecord[];
  timestamp: number;
  hourKey: string;
}

function getCachedData(): CachedHadithData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedHadithData = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS * 24) {
      // Cache older than 24 hours, discard
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedData(hadiths: HadithRecord[], hourKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const data: CachedHadithData = {
      hadiths,
      timestamp: Date.now(),
      hourKey,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — ignore
  }
}

// ─── Hourly Key ──────────────────────────────────────────────────────────────

function getHourKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  return `${y}-${m}-${d}-${h}`;
}

/**
 * Deterministic selection using hourKey as a seed.
 * Same hourKey always yields same index = stable per hour.
 */
function deterministicIndex(hourKey: string, length: number): number {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < hourKey.length; i++) {
    hash = (hash * 31 + hourKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

// ─── API Fetching ────────────────────────────────────────────────────────────

async function fetchHadithFromAPI(
  collection: string,
  section: number,
): Promise<HadithRecord[]> {
  const collectionMeta = HADITH_COLLECTIONS.find((c) => c.apiKey === collection);
  if (!collectionMeta) return [];

  try {
    const [engRes, araRes] = await Promise.all([
      fetch(`${API_BASE}/editions/eng-${collection}/${section}.json`, {
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${API_BASE}/editions/ara-${collection}/${section}.json`, {
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!engRes.ok || !araRes.ok) return [];

    const engData = await engRes.json();
    const araData = await araRes.json();

    const engHadiths = engData.hadiths || [];
    const araHadiths = araData.hadiths || [];

    const records: HadithRecord[] = [];

    for (let i = 0; i < Math.min(engHadiths.length, 10); i++) {
      const eng = engHadiths[i];
      const ara = araHadiths[i];

      if (!eng?.text || !ara?.text) continue;

      records.push({
        id: `${collection}-${eng.hadithnumber || i}`,
        arabicText: ara.text || "",
        englishTranslation: eng.text || "",
        banglaTranslation: null,
        source: collectionMeta.name,
        book: collectionMeta.name,
        hadithNumber: String(eng.hadithnumber || ""),
        grade: null,
        topic: null,
        isVerified: true,
        sourceUrl: `https://sunnah.com/${collection}:${eng.hadithnumber || ""}`,
      });
    }

    return records;
  } catch {
    return [];
  }
}

// ─── Service Interface ───────────────────────────────────────────────────────

export interface HadithService {
  getHadithOfTheHour(date?: Date): Promise<HadithRecord | null>;
  getHadithOfTheDay(date?: Date): Promise<HadithRecord | null>;
  getHadithById(id: string): Promise<HadithRecord | null>;
  getAllHadith(): Promise<HadithRecord[]>;
  getPopularHadith(): Promise<HadithRecord[]>;
  getHadithByCollection(collection: string): Promise<HadithRecord[]>;
  fetchMoreHadith(collection: string, section?: number): Promise<HadithRecord[]>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

class EnhancedHadithService implements HadithService {
  private apiCache = new Map<string, HadithRecord[]>();
  private allHadithCache: HadithRecord[] | null = null;

  /**
   * Returns all available hadith, combining seed data with any cached API data.
   */
  async getAllHadith(): Promise<HadithRecord[]> {
    if (this.allHadithCache) return this.allHadithCache;

    const cached = getCachedData();
    const apiHadiths = cached?.hadiths || [];

    // Merge seed + API, deduplicate by id
    const map = new Map<string, HadithRecord>();
    for (const h of SEED_HADITH) map.set(h.id, h);
    for (const h of apiHadiths) {
      if (!map.has(h.id)) map.set(h.id, h);
    }

    this.allHadithCache = Array.from(map.values());
    return this.allHadithCache;
  }

  /**
   * Hourly rotation — deterministic selection based on YYYY-MM-DD-HH.
   * Same hour = same hadith = no random change on page refresh.
   */
  async getHadithOfTheHour(date = new Date()): Promise<HadithRecord | null> {
    const all = await this.getAllHadith();
    if (all.length === 0) return null;

    const hourKey = getHourKey(date);
    const index = deterministicIndex(hourKey, all.length);
    return all[index] ?? null;
  }

  /**
   * Legacy daily rotation — kept for backward compatibility.
   * Now delegates to hourly rotation.
   */
  async getHadithOfTheDay(date = new Date()): Promise<HadithRecord | null> {
    return this.getHadithOfTheHour(date);
  }

  async getHadithById(id: string): Promise<HadithRecord | null> {
    const all = await this.getAllHadith();
    return all.find((hadith) => hadith.id === id) ?? null;
  }

  /**
   * Returns popular/well-known hadiths (those marked isPopular in seed data).
   */
  async getPopularHadith(): Promise<HadithRecord[]> {
    const all = await this.getAllHadith();
    return all.filter((h) => h.isPopular);
  }

  /**
   * Filter hadiths by collection/source name.
   */
  async getHadithByCollection(collection: string): Promise<HadithRecord[]> {
    const all = await this.getAllHadith();
    const collectionMeta = HADITH_COLLECTIONS.find(
      (c) => c.id === collection || c.name === collection,
    );
    if (!collectionMeta) return [];
    return all.filter(
      (h) => h.source === collectionMeta.name || h.book === collectionMeta.name,
    );
  }

  /**
   * Fetch additional hadiths from the API for a specific collection and section.
   * Caches results locally.
   */
  async fetchMoreHadith(collection: string, section = 1): Promise<HadithRecord[]> {
    const cacheKey = `${collection}-${section}`;
    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey)!;
    }

    const hadiths = await fetchHadithFromAPI(collection, section);
    if (hadiths.length > 0) {
      this.apiCache.set(cacheKey, hadiths);

      // Persist to localStorage cache
      const existing = getCachedData();
      const merged = [...(existing?.hadiths || []), ...hadiths];
      // Deduplicate
      const map = new Map<string, HadithRecord>();
      for (const h of merged) map.set(h.id, h);
      setCachedData(Array.from(map.values()), getHourKey());

      // Invalidate allHadith cache
      this.allHadithCache = null;
    }

    return hadiths;
  }
}

export const hadithService: HadithService = new EnhancedHadithService();
