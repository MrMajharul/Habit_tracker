import type { HadithRecord } from "@/services/hadith/types";

/**
 * Source-controlled Hadith seed data.
 * Content is from verified collections — never AI-generated.
 * @see https://sunnah.com/tirmidhi:3895
 */
export const SEED_HADITH: HadithRecord[] = [
  {
    id: "tirmidhi-3895",
    arabicText:
      "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ وَأَنَا خَيْرُكُمْ لِأَهْلِي",
    englishTranslation:
      "The best of you are those who are best to their families, and I am the best of you to my family.",
    banglaTranslation:
      "তোমাদের মধ্যে সর্বোত্তম সে, যে তার পরিবারের প্রতি সর্বোত্তম, এবং আমি তোমাদের মধ্যে আমার পরিবারের প্রতি সর্বোত্তম।",
    source: "Jami` at-Tirmidhi",
    book: "Jami` at-Tirmidhi",
    hadithNumber: "3895",
    grade: "Hasan",
    topic: "Family",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:3895",
  },
  {
    id: "bukhari-1",
    arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    englishTranslation:
      "Actions are judged by intentions, and every person will be rewarded according to their intention.",
    banglaTranslation:
      "নিশ্চয়ই সকল কাজ নিয়তের উপর নির্ভরশীল, এবং প্রত্যেক ব্যক্তি তা-ই পাবে যা সে নিয়ত করেছে।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "1",
    grade: "Sahih",
    topic: "Intentions",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:1",
  },
];
