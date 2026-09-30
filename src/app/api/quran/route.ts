import { NextResponse } from "next/server";

import { SEED_SURAHS } from "@/data/quran/seed-quran";
import type { AyahWithTranslation } from "@/services/quran/quran-types";

const ALQURAN_API_BASE = "https://api.alquran.cloud/v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surahParam = searchParams.get("surah");
  const searchQuery = searchParams.get("search");

  // ─── 1. Surah Fetching ───────────────────────────────────────────────────────
  if (surahParam) {
    const surahNumber = parseInt(surahParam, 10);
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return NextResponse.json(
        { error: "Invalid surah number. Must be between 1 and 114." },
        { status: 400 }
      );
    }

    try {
      // Fetch Arabic, English, and Bengali in a single multi-edition request
      const res = await fetch(
        `${ALQURAN_API_BASE}/surah/${surahNumber}/editions/quran-uthmani,en.sahih,bn.bengali`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: 86400 * 30 }, // Cache for 30 days
        }
      );

      if (res.ok) {
        const json = await res.json();
        const editions = json?.data ?? [];
        const arabicData = editions[0]?.ayahs ?? [];
        const enData = editions[1]?.ayahs ?? [];
        const bnData = editions[2]?.ayahs ?? [];

        if (Array.isArray(arabicData) && arabicData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ayahs: AyahWithTranslation[] = arabicData.map((a: any, idx: number) => ({
            number: a.numberInSurah,
            numberInQuran: a.number,
            text: a.text,
            juz: a.juz,
            page: a.page,
            translation: enData[idx]?.text ?? undefined,
            translationEdition: "Sahih International (en.sahih)",
            translationBn: bnData[idx]?.text ?? undefined,
            translationBnEdition: "Maulana Muhiuddin Khan (bn.bengali)",
          }));

          return NextResponse.json({ success: true, ayahs });
        }
      }
    } catch (err) {
      console.warn(`[API /api/quran] External fetch failed for Surah ${surahNumber}:`, err);
    }

    // Check offline seed fallback if available
    const seedAyahs = SEED_SURAHS[surahNumber];
    if (seedAyahs && seedAyahs.length > 0) {
      return NextResponse.json({ success: true, ayahs: seedAyahs, offlineFallback: true });
    }

    return NextResponse.json(
      { error: `Could not load Surah ${surahNumber}` },
      { status: 502 }
    );
  }

  // ─── 2. Search Content ───────────────────────────────────────────────────────
  if (searchQuery && searchQuery.trim().length >= 2) {
    try {
      const res = await fetch(
        `${ALQURAN_API_BASE}/search/${encodeURIComponent(searchQuery.trim())}/all/en.sahih`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: 86400 },
        }
      );

      if (res.ok) {
        const json = await res.json();
        const matches = json?.data?.matches ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ayahs: AyahWithTranslation[] = matches.slice(0, 20).map((m: any) => ({
          number: m.numberInSurah,
          numberInQuran: m.number,
          text: m.text,
          juz: m.edition?.identifier === "quran-uthmani" ? m.juz : 0,
          page: m.page ?? 0,
          translation: m.text,
          translationEdition: "Sahih International (en.sahih)",
        }));

        return NextResponse.json({ success: true, ayahs });
      }
    } catch (err) {
      console.warn("[API /api/quran] Search failed:", err);
    }

    return NextResponse.json({ success: true, ayahs: [] });
  }

  return NextResponse.json(
    { error: "Missing query parameters. Specify 'surah' or 'search'." },
    { status: 400 }
  );
}
