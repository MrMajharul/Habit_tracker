import { SEED_HADITH } from "@/data/hadith/seed-hadith";

import type {
  HadithBookSection,
  HadithCollectionInfo,
  HadithRecord,
  ReadingPosition,
} from "./types";

// ─── Cache Keys ──────────────────────────────────────────────────────────────
const CACHE_KEY = "istiqamaah_hadith_cache";
const LAST_READ_KEY = "istiqamaah_hadith_last_read";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── API Configuration ───────────────────────────────────────────────────────
// Using fawazahmed0/hadith-api (verified, CDN-backed, open source authentic text)
const API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

// ─── Supported Collections (The Six Canonical Books) ─────────────────────────
export const HADITH_COLLECTIONS: HadithCollectionInfo[] = [
  {
    id: "bukhari",
    name: "Sahih al-Bukhari",
    arabicName: "صحيح البخاري",
    apiKey: "bukhari",
    totalBooks: 97,
    totalHadiths: 7563,
    description:
      "Considered the most authentic book of Hadith after the Qur'an, compiled by Imam Muhammad al-Bukhari.",
  },
  {
    id: "muslim",
    name: "Sahih Muslim",
    arabicName: "صحيح مسلم",
    apiKey: "muslim",
    totalBooks: 56,
    totalHadiths: 7500,
    description:
      "The second most authentic Hadith compilation, renowned for its strict thematic categorization by Imam Muslim.",
  },
  {
    id: "tirmidhi",
    name: "Jami' at-Tirmidhi",
    arabicName: "جامع الترمذي",
    apiKey: "tirmidhi",
    totalBooks: 49,
    totalHadiths: 3956,
    description:
      "Compiled by Imam Abu Isa at-Tirmidhi, famous for containing comprehensive authenticity gradings for each report.",
  },
  {
    id: "abudawud",
    name: "Sunan Abi Dawud",
    arabicName: "سنن أبي داود",
    apiKey: "abudawud",
    totalBooks: 43,
    totalHadiths: 5274,
    description:
      "Primary source for legal and jurisprudential ahadith, compiled by Imam Abu Dawud al-Sijistani.",
  },
  {
    id: "nasai",
    name: "Sunan an-Nasa'i",
    arabicName: "سنن النسائي",
    apiKey: "nasai",
    totalBooks: 51,
    totalHadiths: 5758,
    description:
      "Compiled by Imam Ahmad an-Nasa'i, acclaimed for its rigorous chain verification and legal precision.",
  },
  {
    id: "ibnmajah",
    name: "Sunan Ibn Majah",
    arabicName: "سنن ابن ماجه",
    apiKey: "ibnmajah",
    totalBooks: 37,
    totalHadiths: 4341,
    description:
      "The sixth major Sunan collection, compiled by Imam Ibn Majah, covering essential chapters of faith and daily life.",
  },
];

// Fallback seed sections for major collections to guarantee instant offline browsing
const DEFAULT_BUKHARI_SECTIONS: HadithBookSection[] = [
  { bookNumber: 1, title: "Revelation (Bad' al-Wahy)" },
  { bookNumber: 2, title: "Belief (Kitab al-Iman)" },
  { bookNumber: 3, title: "Knowledge (Kitab al-'Ilm)" },
  { bookNumber: 4, title: "Ablutions (Wudu')" },
  { bookNumber: 5, title: "Bathing (Ghusl)" },
  { bookNumber: 6, title: "Menstrual Periods" },
  { bookNumber: 7, title: "Rubbing hands and feet with dust (Tayammum)" },
  { bookNumber: 8, title: "Prayers (Salat)" },
  { bookNumber: 9, title: "Times of the Prayers" },
  { bookNumber: 10, title: "Call to Prayers (Adhaan)" },
  { bookNumber: 11, title: "Friday Prayer" },
  { bookNumber: 12, title: "Fear Prayer" },
  { bookNumber: 13, title: "The Two Festivals (Eids)" },
  { bookNumber: 14, title: "Witr Prayer" },
  { bookNumber: 15, title: "Invoking Allah for Rain (Istisqaa)" },
  { bookNumber: 16, title: "Eclipses" },
  { bookNumber: 17, title: "Prostration During Recital of Qur'an" },
  { bookNumber: 18, title: "Shortening the Prayers (At-Taqseer)" },
  { bookNumber: 19, title: "Prayer at Night (Tahajjud)" },
  { bookNumber: 20, title: "Virtues of Prayer at Masjid Makkah and Madinah" },
  { bookNumber: 24, title: "Obligatory Charity Tax (Zakat)" },
  { bookNumber: 25, title: "Hajj (Pilgrimage)" },
  { bookNumber: 31, title: "Fasting (Sawm)" },
];

const DEFAULT_MUSLIM_SECTIONS: HadithBookSection[] = [
  { bookNumber: 1, title: "The Book of Faith (Kitab Al-Iman)" },
  { bookNumber: 2, title: "The Book of Purification (Kitab Al-Taharah)" },
  { bookNumber: 3, title: "The Book of Menstruation (Kitab Al-Haid)" },
  { bookNumber: 4, title: "The Book of Prayers (Kitab Al-Salat)" },
  { bookNumber: 5, title: "The Book of Mosques and Places of Prayer" },
  { bookNumber: 6, title: "The Book of Prayer - Travellers" },
  { bookNumber: 7, title: "The Book of Prayer - Friday" },
  { bookNumber: 8, title: "The Book of Prayer - Two Eids" },
  { bookNumber: 9, title: "The Book of Prayer - Rain" },
  { bookNumber: 10, title: "The Book of Prayer - Eclipses" },
  { bookNumber: 12, title: "The Book of Zakat" },
  { bookNumber: 13, title: "The Book of Fasting (Kitab Al-Siyam)" },
  { bookNumber: 15, title: "The Book of Pilgrimage (Kitab Al-Hajj)" },
];

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
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}


function getHourKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  return `${y}-${m}-${d}-${h}`;
}

function deterministicIndex(hourKey: string, length: number): number {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < hourKey.length; i++) {
    hash = (hash * 31 + hourKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class HadithService {
  private apiCache = new Map<string, HadithRecord[]>();
  private allHadithCache: HadithRecord[] | null = null;
  private sectionsCache = new Map<string, HadithBookSection[]>();

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

  async getHadithOfTheHour(date = new Date()): Promise<HadithRecord | null> {
    const all = await this.getAllHadith();
    if (all.length === 0) return null;

    const hourKey = getHourKey(date);
    const index = deterministicIndex(hourKey, all.length);
    return all[index] ?? null;
  }

  async getHadithOfTheDay(date = new Date()): Promise<HadithRecord | null> {
    return this.getHadithOfTheHour(date);
  }

  async getHadithById(id: string): Promise<HadithRecord | null> {
    const all = await this.getAllHadith();
    return all.find((hadith) => hadith.id === id) ?? null;
  }

  async getPopularHadith(): Promise<HadithRecord[]> {
    const all = await this.getAllHadith();
    return all.filter((h) => h.isPopular);
  }

  async getHadithByCollection(collection: string): Promise<HadithRecord[]> {
    const all = await this.getAllHadith();
    const collectionMeta = HADITH_COLLECTIONS.find(
      (c) => c.id === collection || c.name === collection || c.apiKey === collection,
    );
    if (!collectionMeta) return [];
    return all.filter(
      (h) => h.source === collectionMeta.name || h.book === collectionMeta.name,
    );
  }

  /**
   * Fetches books / chapters list for a given collection
   */
  async getCollectionSections(collectionId: string): Promise<HadithBookSection[]> {
    if (this.sectionsCache.has(collectionId)) {
      return this.sectionsCache.get(collectionId)!;
    }

    // Check localStorage cache
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(`istiqamaah_sections_${collectionId}`);
        if (local) {
          const parsed = JSON.parse(local);
          this.sectionsCache.set(collectionId, parsed);
          return parsed;
        }
      } catch {
        // Ignore
      }
    }

    // Try fetching from API info.json
    try {
      const res = await fetch(`${API_BASE}/info.json`, {
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        const colData = json[collectionId];
        if (colData && colData.metadata && colData.metadata.sections) {
          const sectionsObj = colData.metadata.sections as Record<string, string>;
          const list: HadithBookSection[] = [];

          for (const [key, title] of Object.entries(sectionsObj)) {
            const num = parseInt(key, 10);
            if (num > 0 && title && title.trim().length > 0) {
              list.push({ bookNumber: num, title: title.trim() });
            }
          }

          list.sort((a, b) => a.bookNumber - b.bookNumber);

          if (list.length > 0) {
            this.sectionsCache.set(collectionId, list);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  `istiqamaah_sections_${collectionId}`,
                  JSON.stringify(list),
                );
              } catch {}
            }
            return list;
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch sections for ${collectionId}, using fallback:`, err);
    }

    // Fallback to built-in sections or generated placeholders
    let fallbackList: HadithBookSection[] = [];
    if (collectionId === "bukhari") {
      fallbackList = DEFAULT_BUKHARI_SECTIONS;
    } else if (collectionId === "muslim") {
      fallbackList = DEFAULT_MUSLIM_SECTIONS;
    } else {
      const meta = HADITH_COLLECTIONS.find((c) => c.id === collectionId);
      const total = meta ? meta.totalBooks : 20;
      fallbackList = Array.from({ length: total }, (_, i) => ({
        bookNumber: i + 1,
        title: `Book ${i + 1}`,
      }));
    }

    this.sectionsCache.set(collectionId, fallbackList);
    return fallbackList;
  }

  /**
   * Fetches all hadiths belonging to a specific book in a collection
   */
  async getBookHadiths(
    collectionId: string,
    bookNumber: number,
  ): Promise<{ bookTitle: string; hadiths: HadithRecord[] }> {
    const cacheKey = `${collectionId}-book-${bookNumber}`;

    // 1. In-memory check
    if (this.apiCache.has(cacheKey)) {
      const hadiths = this.apiCache.get(cacheKey)!;
      return { bookTitle: hadiths[0]?.book || `Book ${bookNumber}`, hadiths };
    }

    // 2. localStorage check
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(`istiqamaah_book_${collectionId}_${bookNumber}`);
        if (local) {
          const parsed: HadithRecord[] = JSON.parse(local);
          this.apiCache.set(cacheKey, parsed);
          return { bookTitle: parsed[0]?.book || `Book ${bookNumber}`, hadiths: parsed };
        }
      } catch {}
    }

    const collectionMeta = HADITH_COLLECTIONS.find((c) => c.id === collectionId);
    const collectionName = collectionMeta?.name || collectionId;

    // Get book title
    const sections = await this.getCollectionSections(collectionId);
    const section = sections.find((s) => s.bookNumber === bookNumber);
    const bookTitle = section?.title || `Book ${bookNumber}`;

    // 3. Network fetch
    try {
      const [engRes, araRes] = await Promise.all([
        fetch(`${API_BASE}/editions/eng-${collectionId}/sections/${bookNumber}.json`, {
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`${API_BASE}/editions/ara-${collectionId}/sections/${bookNumber}.json`, {
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      if (engRes.ok && araRes.ok) {
        const engData = await engRes.json();
        const araData = await araRes.json();

        const engHadiths = engData.hadiths || [];
        const araHadiths = araData.hadiths || [];

        const records: HadithRecord[] = [];
        const count = Math.max(engHadiths.length, araHadiths.length);

        for (let i = 0; i < count; i++) {
          const eng = engHadiths[i] || {};
          const ara = araHadiths[i] || {};

          if (!eng.text && !ara.text) continue;

          let gradeText: string | null = null;
          if (Array.isArray(eng.grades) && eng.grades[0]?.grade) {
            gradeText = eng.grades[0].grade;
          } else if (Array.isArray(ara.grades) && ara.grades[0]?.grade) {
            gradeText = ara.grades[0].grade;
          } else if (collectionId === "bukhari" || collectionId === "muslim") {
            gradeText = "Sahih";
          }

          const hadithNum = String(eng.hadithnumber || ara.hadithnumber || i + 1);

          records.push({
            id: `${collectionId}-${bookNumber}-${hadithNum}`,
            arabicText: ara.text || "",
            englishTranslation: eng.text || "",
            banglaTranslation: null,
            source: collectionName,
            book: bookTitle,
            bookNumber,
            hadithNumber: hadithNum,
            grade: gradeText,
            topic: bookTitle,
            isVerified: true,
            sourceUrl: `https://sunnah.com/${collectionId}:${hadithNum}`,
          });
        }

        if (records.length > 0) {
          this.apiCache.set(cacheKey, records);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `istiqamaah_book_${collectionId}_${bookNumber}`,
                JSON.stringify(records),
              );
            } catch {}
          }
          return { bookTitle, hadiths: records };
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch hadiths for ${collectionId} book ${bookNumber}:`, err);
    }

    // 4. Seed fallback: check if any seed hadith matches
    const seedMatches = SEED_HADITH.filter(
      (h) =>
        (h.source.toLowerCase().includes(collectionId) ||
          collectionName.toLowerCase().includes(h.source.toLowerCase())) &&
        (h.bookNumber === bookNumber || h.book.toLowerCase().includes(bookTitle.toLowerCase())),
    );

    if (seedMatches.length > 0) {
      return { bookTitle, hadiths: seedMatches };
    }

    return { bookTitle, hadiths: [] };
  }

  // ─── Reading Position Tracking ─────────────────────────────────────────────

  getLastReadPosition(): ReadingPosition | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LAST_READ_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveLastReadPosition(pos: Omit<ReadingPosition, "updatedAt">): void {
    if (typeof window === "undefined") return;
    try {
      const full: ReadingPosition = { ...pos, updatedAt: Date.now() };
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(full));
    } catch {}
  }
}

export const hadithService = new HadithService();
