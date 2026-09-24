export interface HadithRecord {
  id: string;
  arabicText: string;
  englishTranslation: string;
  banglaTranslation: string | null;
  source: string;
  book: string;
  hadithNumber: string;
  grade: string | null;
  topic: string | null;
  isVerified: boolean;
  sourceUrl?: string;
}
