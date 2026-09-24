import { SEED_HADITH } from "@/data/hadith/seed-hadith";

import type { HadithRecord } from "./types";

export interface HadithService {
  getHadithOfTheDay(date?: Date): Promise<HadithRecord | null>;
  getHadithById(id: string): Promise<HadithRecord | null>;
  getAllHadith(): Promise<HadithRecord[]>;
}

class SeedHadithService implements HadithService {
  async getHadithOfTheDay(date = new Date()): Promise<HadithRecord | null> {
    if (SEED_HADITH.length === 0) return null;

    const dayIndex = Math.floor(
      date.getTime() / (1000 * 60 * 60 * 24),
    );
    const index = dayIndex % SEED_HADITH.length;
    return SEED_HADITH[index] ?? null;
  }

  async getHadithById(id: string): Promise<HadithRecord | null> {
    return SEED_HADITH.find((hadith) => hadith.id === id) ?? null;
  }

  async getAllHadith(): Promise<HadithRecord[]> {
    return SEED_HADITH;
  }
}

export const hadithService: HadithService = new SeedHadithService();
