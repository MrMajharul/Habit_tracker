export interface HadithRecord {
  id: string;
  arabicText: string;
  englishTranslation: string;
  banglaTranslation: string | null;
  source: string;
  book: string;
  bookNumber?: number;
  hadithNumber: string;
  grade: string | null;
  topic: string | null;
  isVerified: boolean;
  sourceUrl?: string;
  /** Marks popular/well-known hadiths for the Popular section */
  isPopular?: boolean;
}

export interface HadithCollectionInfo {
  id: string;
  name: string;
  arabicName: string;
  apiKey: string;
  totalBooks: number;
  totalHadiths: number;
  description: string;
}

export interface HadithBookSection {
  bookNumber: number;
  title: string;
  hadithCount?: number;
}

export interface ReadingPosition {
  collectionId: string;
  bookNumber: number;
  hadithNumber?: string;
  updatedAt: number;
}
