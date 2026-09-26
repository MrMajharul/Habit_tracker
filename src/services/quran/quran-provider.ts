// ============================================================================
// Qur'an Content Provider — Al-Quran Cloud API
// Source: https://alquran.cloud (free, verified Qur'an data API)
//
// IMPORTANT: All Qur'an Arabic text and translations come from this verified
// source. No AI-generated content is used for Qur'an text.
// ============================================================================

import type {
  AyahWithTranslation,
  QuranContentProvider,
  SurahInfo,
} from "./quran-types";

// ─── Static Surah metadata (verified canonical data) ────────────────────────
// This avoids fetching the full surah list on every page load.
// Source: https://api.alquran.cloud/v1/surah

const SURAH_DATA: SurahInfo[] = [
  { number: 1, name: "Al-Fatihah", englishName: "Al-Fatihah", englishNameTranslation: "The Opening", arabicName: "الفاتحة", ayahCount: 7, revelationType: "meccan", juz: [1] },
  { number: 2, name: "Al-Baqarah", englishName: "Al-Baqarah", englishNameTranslation: "The Cow", arabicName: "البقرة", ayahCount: 286, revelationType: "medinan", juz: [1, 2, 3] },
  { number: 3, name: "Ali 'Imran", englishName: "Ali 'Imran", englishNameTranslation: "Family of Imran", arabicName: "آل عمران", ayahCount: 200, revelationType: "medinan", juz: [3, 4] },
  { number: 4, name: "An-Nisa", englishName: "An-Nisa", englishNameTranslation: "The Women", arabicName: "النساء", ayahCount: 176, revelationType: "medinan", juz: [4, 5, 6] },
  { number: 5, name: "Al-Ma'idah", englishName: "Al-Ma'idah", englishNameTranslation: "The Table Spread", arabicName: "المائدة", ayahCount: 120, revelationType: "medinan", juz: [6, 7] },
  { number: 6, name: "Al-An'am", englishName: "Al-An'am", englishNameTranslation: "The Cattle", arabicName: "الأنعام", ayahCount: 165, revelationType: "meccan", juz: [7, 8] },
  { number: 7, name: "Al-A'raf", englishName: "Al-A'raf", englishNameTranslation: "The Heights", arabicName: "الأعراف", ayahCount: 206, revelationType: "meccan", juz: [8, 9] },
  { number: 8, name: "Al-Anfal", englishName: "Al-Anfal", englishNameTranslation: "The Spoils of War", arabicName: "الأنفال", ayahCount: 75, revelationType: "medinan", juz: [9, 10] },
  { number: 9, name: "At-Tawbah", englishName: "At-Tawbah", englishNameTranslation: "The Repentance", arabicName: "التوبة", ayahCount: 129, revelationType: "medinan", juz: [10, 11] },
  { number: 10, name: "Yunus", englishName: "Yunus", englishNameTranslation: "Jonah", arabicName: "يونس", ayahCount: 109, revelationType: "meccan", juz: [11] },
  { number: 11, name: "Hud", englishName: "Hud", englishNameTranslation: "Hud", arabicName: "هود", ayahCount: 123, revelationType: "meccan", juz: [11, 12] },
  { number: 12, name: "Yusuf", englishName: "Yusuf", englishNameTranslation: "Joseph", arabicName: "يوسف", ayahCount: 111, revelationType: "meccan", juz: [12, 13] },
  { number: 13, name: "Ar-Ra'd", englishName: "Ar-Ra'd", englishNameTranslation: "The Thunder", arabicName: "الرعد", ayahCount: 43, revelationType: "medinan", juz: [13] },
  { number: 14, name: "Ibrahim", englishName: "Ibrahim", englishNameTranslation: "Abraham", arabicName: "إبراهيم", ayahCount: 52, revelationType: "meccan", juz: [13] },
  { number: 15, name: "Al-Hijr", englishName: "Al-Hijr", englishNameTranslation: "The Rocky Tract", arabicName: "الحجر", ayahCount: 99, revelationType: "meccan", juz: [14] },
  { number: 16, name: "An-Nahl", englishName: "An-Nahl", englishNameTranslation: "The Bee", arabicName: "النحل", ayahCount: 128, revelationType: "meccan", juz: [14] },
  { number: 17, name: "Al-Isra", englishName: "Al-Isra", englishNameTranslation: "The Night Journey", arabicName: "الإسراء", ayahCount: 111, revelationType: "meccan", juz: [15] },
  { number: 18, name: "Al-Kahf", englishName: "Al-Kahf", englishNameTranslation: "The Cave", arabicName: "الكهف", ayahCount: 110, revelationType: "meccan", juz: [15, 16] },
  { number: 19, name: "Maryam", englishName: "Maryam", englishNameTranslation: "Mary", arabicName: "مريم", ayahCount: 98, revelationType: "meccan", juz: [16] },
  { number: 20, name: "Taha", englishName: "Taha", englishNameTranslation: "Ta-Ha", arabicName: "طه", ayahCount: 135, revelationType: "meccan", juz: [16] },
  { number: 21, name: "Al-Anbiya", englishName: "Al-Anbiya", englishNameTranslation: "The Prophets", arabicName: "الأنبياء", ayahCount: 112, revelationType: "meccan", juz: [17] },
  { number: 22, name: "Al-Hajj", englishName: "Al-Hajj", englishNameTranslation: "The Pilgrimage", arabicName: "الحج", ayahCount: 78, revelationType: "medinan", juz: [17] },
  { number: 23, name: "Al-Mu'minun", englishName: "Al-Mu'minun", englishNameTranslation: "The Believers", arabicName: "المؤمنون", ayahCount: 118, revelationType: "meccan", juz: [18] },
  { number: 24, name: "An-Nur", englishName: "An-Nur", englishNameTranslation: "The Light", arabicName: "النور", ayahCount: 64, revelationType: "medinan", juz: [18] },
  { number: 25, name: "Al-Furqan", englishName: "Al-Furqan", englishNameTranslation: "The Criterion", arabicName: "الفرقان", ayahCount: 77, revelationType: "meccan", juz: [18, 19] },
  { number: 26, name: "Ash-Shu'ara", englishName: "Ash-Shu'ara", englishNameTranslation: "The Poets", arabicName: "الشعراء", ayahCount: 227, revelationType: "meccan", juz: [19] },
  { number: 27, name: "An-Naml", englishName: "An-Naml", englishNameTranslation: "The Ant", arabicName: "النمل", ayahCount: 93, revelationType: "meccan", juz: [19, 20] },
  { number: 28, name: "Al-Qasas", englishName: "Al-Qasas", englishNameTranslation: "The Stories", arabicName: "القصص", ayahCount: 88, revelationType: "meccan", juz: [20] },
  { number: 29, name: "Al-Ankabut", englishName: "Al-Ankabut", englishNameTranslation: "The Spider", arabicName: "العنكبوت", ayahCount: 69, revelationType: "meccan", juz: [20, 21] },
  { number: 30, name: "Ar-Rum", englishName: "Ar-Rum", englishNameTranslation: "The Romans", arabicName: "الروم", ayahCount: 60, revelationType: "meccan", juz: [21] },
  { number: 31, name: "Luqman", englishName: "Luqman", englishNameTranslation: "Luqman", arabicName: "لقمان", ayahCount: 34, revelationType: "meccan", juz: [21] },
  { number: 32, name: "As-Sajdah", englishName: "As-Sajdah", englishNameTranslation: "The Prostration", arabicName: "السجدة", ayahCount: 30, revelationType: "meccan", juz: [21] },
  { number: 33, name: "Al-Ahzab", englishName: "Al-Ahzab", englishNameTranslation: "The Combined Forces", arabicName: "الأحزاب", ayahCount: 73, revelationType: "medinan", juz: [21, 22] },
  { number: 34, name: "Saba", englishName: "Saba", englishNameTranslation: "Sheba", arabicName: "سبأ", ayahCount: 54, revelationType: "meccan", juz: [22] },
  { number: 35, name: "Fatir", englishName: "Fatir", englishNameTranslation: "The Originator", arabicName: "فاطر", ayahCount: 45, revelationType: "meccan", juz: [22] },
  { number: 36, name: "Ya-Sin", englishName: "Ya-Sin", englishNameTranslation: "Ya Sin", arabicName: "يس", ayahCount: 83, revelationType: "meccan", juz: [22, 23] },
  { number: 37, name: "As-Saffat", englishName: "As-Saffat", englishNameTranslation: "Those who set the Ranks", arabicName: "الصافات", ayahCount: 182, revelationType: "meccan", juz: [23] },
  { number: 38, name: "Sad", englishName: "Sad", englishNameTranslation: "The Letter Sad", arabicName: "ص", ayahCount: 88, revelationType: "meccan", juz: [23] },
  { number: 39, name: "Az-Zumar", englishName: "Az-Zumar", englishNameTranslation: "The Troops", arabicName: "الزمر", ayahCount: 75, revelationType: "meccan", juz: [23, 24] },
  { number: 40, name: "Ghafir", englishName: "Ghafir", englishNameTranslation: "The Forgiver", arabicName: "غافر", ayahCount: 85, revelationType: "meccan", juz: [24] },
  { number: 41, name: "Fussilat", englishName: "Fussilat", englishNameTranslation: "Explained in Detail", arabicName: "فصلت", ayahCount: 54, revelationType: "meccan", juz: [24, 25] },
  { number: 42, name: "Ash-Shuraa", englishName: "Ash-Shuraa", englishNameTranslation: "The Consultation", arabicName: "الشورى", ayahCount: 53, revelationType: "meccan", juz: [25] },
  { number: 43, name: "Az-Zukhruf", englishName: "Az-Zukhruf", englishNameTranslation: "The Ornaments of Gold", arabicName: "الزخرف", ayahCount: 89, revelationType: "meccan", juz: [25] },
  { number: 44, name: "Ad-Dukhan", englishName: "Ad-Dukhan", englishNameTranslation: "The Smoke", arabicName: "الدخان", ayahCount: 59, revelationType: "meccan", juz: [25] },
  { number: 45, name: "Al-Jathiyah", englishName: "Al-Jathiyah", englishNameTranslation: "The Crouching", arabicName: "الجاثية", ayahCount: 37, revelationType: "meccan", juz: [25] },
  { number: 46, name: "Al-Ahqaf", englishName: "Al-Ahqaf", englishNameTranslation: "The Wind-Curved Sandhills", arabicName: "الأحقاف", ayahCount: 35, revelationType: "meccan", juz: [26] },
  { number: 47, name: "Muhammad", englishName: "Muhammad", englishNameTranslation: "Muhammad", arabicName: "محمد", ayahCount: 38, revelationType: "medinan", juz: [26] },
  { number: 48, name: "Al-Fath", englishName: "Al-Fath", englishNameTranslation: "The Victory", arabicName: "الفتح", ayahCount: 29, revelationType: "medinan", juz: [26] },
  { number: 49, name: "Al-Hujurat", englishName: "Al-Hujurat", englishNameTranslation: "The Rooms", arabicName: "الحجرات", ayahCount: 18, revelationType: "medinan", juz: [26] },
  { number: 50, name: "Qaf", englishName: "Qaf", englishNameTranslation: "The Letter Qaf", arabicName: "ق", ayahCount: 45, revelationType: "meccan", juz: [26] },
  { number: 51, name: "Adh-Dhariyat", englishName: "Adh-Dhariyat", englishNameTranslation: "The Winnowing Winds", arabicName: "الذاريات", ayahCount: 60, revelationType: "meccan", juz: [26, 27] },
  { number: 52, name: "At-Tur", englishName: "At-Tur", englishNameTranslation: "The Mount", arabicName: "الطور", ayahCount: 49, revelationType: "meccan", juz: [27] },
  { number: 53, name: "An-Najm", englishName: "An-Najm", englishNameTranslation: "The Star", arabicName: "النجم", ayahCount: 62, revelationType: "meccan", juz: [27] },
  { number: 54, name: "Al-Qamar", englishName: "Al-Qamar", englishNameTranslation: "The Moon", arabicName: "القمر", ayahCount: 55, revelationType: "meccan", juz: [27] },
  { number: 55, name: "Ar-Rahman", englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent", arabicName: "الرحمن", ayahCount: 78, revelationType: "medinan", juz: [27] },
  { number: 56, name: "Al-Waqi'ah", englishName: "Al-Waqi'ah", englishNameTranslation: "The Inevitable", arabicName: "الواقعة", ayahCount: 96, revelationType: "meccan", juz: [27] },
  { number: 57, name: "Al-Hadid", englishName: "Al-Hadid", englishNameTranslation: "The Iron", arabicName: "الحديد", ayahCount: 29, revelationType: "medinan", juz: [27] },
  { number: 58, name: "Al-Mujadila", englishName: "Al-Mujadila", englishNameTranslation: "The Pleading Woman", arabicName: "المجادلة", ayahCount: 22, revelationType: "medinan", juz: [28] },
  { number: 59, name: "Al-Hashr", englishName: "Al-Hashr", englishNameTranslation: "The Exile", arabicName: "الحشر", ayahCount: 24, revelationType: "medinan", juz: [28] },
  { number: 60, name: "Al-Mumtahanah", englishName: "Al-Mumtahanah", englishNameTranslation: "She that is to be examined", arabicName: "الممتحنة", ayahCount: 13, revelationType: "medinan", juz: [28] },
  { number: 61, name: "As-Saf", englishName: "As-Saf", englishNameTranslation: "The Ranks", arabicName: "الصف", ayahCount: 14, revelationType: "medinan", juz: [28] },
  { number: 62, name: "Al-Jumu'ah", englishName: "Al-Jumu'ah", englishNameTranslation: "The Congregation, Friday", arabicName: "الجمعة", ayahCount: 11, revelationType: "medinan", juz: [28] },
  { number: 63, name: "Al-Munafiqun", englishName: "Al-Munafiqun", englishNameTranslation: "The Hypocrites", arabicName: "المنافقون", ayahCount: 11, revelationType: "medinan", juz: [28] },
  { number: 64, name: "At-Taghabun", englishName: "At-Taghabun", englishNameTranslation: "The Mutual Disillusion", arabicName: "التغابن", ayahCount: 18, revelationType: "medinan", juz: [28] },
  { number: 65, name: "At-Talaq", englishName: "At-Talaq", englishNameTranslation: "The Divorce", arabicName: "الطلاق", ayahCount: 12, revelationType: "medinan", juz: [28] },
  { number: 66, name: "At-Tahrim", englishName: "At-Tahrim", englishNameTranslation: "The Prohibition", arabicName: "التحريم", ayahCount: 12, revelationType: "medinan", juz: [28] },
  { number: 67, name: "Al-Mulk", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", arabicName: "الملك", ayahCount: 30, revelationType: "meccan", juz: [29] },
  { number: 68, name: "Al-Qalam", englishName: "Al-Qalam", englishNameTranslation: "The Pen", arabicName: "القلم", ayahCount: 52, revelationType: "meccan", juz: [29] },
  { number: 69, name: "Al-Haqqah", englishName: "Al-Haqqah", englishNameTranslation: "The Reality", arabicName: "الحاقة", ayahCount: 52, revelationType: "meccan", juz: [29] },
  { number: 70, name: "Al-Ma'arij", englishName: "Al-Ma'arij", englishNameTranslation: "The Ascending Stairways", arabicName: "المعارج", ayahCount: 44, revelationType: "meccan", juz: [29] },
  { number: 71, name: "Nuh", englishName: "Nuh", englishNameTranslation: "Noah", arabicName: "نوح", ayahCount: 28, revelationType: "meccan", juz: [29] },
  { number: 72, name: "Al-Jinn", englishName: "Al-Jinn", englishNameTranslation: "The Jinn", arabicName: "الجن", ayahCount: 28, revelationType: "meccan", juz: [29] },
  { number: 73, name: "Al-Muzzammil", englishName: "Al-Muzzammil", englishNameTranslation: "The Enshrouded One", arabicName: "المزمل", ayahCount: 20, revelationType: "meccan", juz: [29] },
  { number: 74, name: "Al-Muddaththir", englishName: "Al-Muddaththir", englishNameTranslation: "The Cloaked One", arabicName: "المدثر", ayahCount: 56, revelationType: "meccan", juz: [29] },
  { number: 75, name: "Al-Qiyamah", englishName: "Al-Qiyamah", englishNameTranslation: "The Resurrection", arabicName: "القيامة", ayahCount: 40, revelationType: "meccan", juz: [29] },
  { number: 76, name: "Al-Insan", englishName: "Al-Insan", englishNameTranslation: "The Man", arabicName: "الإنسان", ayahCount: 31, revelationType: "medinan", juz: [29] },
  { number: 77, name: "Al-Mursalat", englishName: "Al-Mursalat", englishNameTranslation: "The Emissaries", arabicName: "المرسلات", ayahCount: 50, revelationType: "meccan", juz: [29] },
  { number: 78, name: "An-Naba", englishName: "An-Naba", englishNameTranslation: "The Tidings", arabicName: "النبأ", ayahCount: 40, revelationType: "meccan", juz: [30] },
  { number: 79, name: "An-Nazi'at", englishName: "An-Nazi'at", englishNameTranslation: "Those who drag forth", arabicName: "النازعات", ayahCount: 46, revelationType: "meccan", juz: [30] },
  { number: 80, name: "Abasa", englishName: "Abasa", englishNameTranslation: "He Frowned", arabicName: "عبس", ayahCount: 42, revelationType: "meccan", juz: [30] },
  { number: 81, name: "At-Takwir", englishName: "At-Takwir", englishNameTranslation: "The Overthrowing", arabicName: "التكوير", ayahCount: 29, revelationType: "meccan", juz: [30] },
  { number: 82, name: "Al-Infitar", englishName: "Al-Infitar", englishNameTranslation: "The Cleaving", arabicName: "الانفطار", ayahCount: 19, revelationType: "meccan", juz: [30] },
  { number: 83, name: "Al-Mutaffifin", englishName: "Al-Mutaffifin", englishNameTranslation: "The Defrauding", arabicName: "المطففين", ayahCount: 36, revelationType: "meccan", juz: [30] },
  { number: 84, name: "Al-Inshiqaq", englishName: "Al-Inshiqaq", englishNameTranslation: "The Sundering", arabicName: "الانشقاق", ayahCount: 25, revelationType: "meccan", juz: [30] },
  { number: 85, name: "Al-Buruj", englishName: "Al-Buruj", englishNameTranslation: "The Mansions of the Stars", arabicName: "البروج", ayahCount: 22, revelationType: "meccan", juz: [30] },
  { number: 86, name: "At-Tariq", englishName: "At-Tariq", englishNameTranslation: "The Night Comer", arabicName: "الطارق", ayahCount: 17, revelationType: "meccan", juz: [30] },
  { number: 87, name: "Al-A'la", englishName: "Al-A'la", englishNameTranslation: "The Most High", arabicName: "الأعلى", ayahCount: 19, revelationType: "meccan", juz: [30] },
  { number: 88, name: "Al-Ghashiyah", englishName: "Al-Ghashiyah", englishNameTranslation: "The Overwhelming", arabicName: "الغاشية", ayahCount: 26, revelationType: "meccan", juz: [30] },
  { number: 89, name: "Al-Fajr", englishName: "Al-Fajr", englishNameTranslation: "The Dawn", arabicName: "الفجر", ayahCount: 30, revelationType: "meccan", juz: [30] },
  { number: 90, name: "Al-Balad", englishName: "Al-Balad", englishNameTranslation: "The City", arabicName: "البلد", ayahCount: 20, revelationType: "meccan", juz: [30] },
  { number: 91, name: "Ash-Shams", englishName: "Ash-Shams", englishNameTranslation: "The Sun", arabicName: "الشمس", ayahCount: 15, revelationType: "meccan", juz: [30] },
  { number: 92, name: "Al-Lail", englishName: "Al-Lail", englishNameTranslation: "The Night", arabicName: "الليل", ayahCount: 21, revelationType: "meccan", juz: [30] },
  { number: 93, name: "Ad-Duhaa", englishName: "Ad-Duhaa", englishNameTranslation: "The Morning Hours", arabicName: "الضحى", ayahCount: 11, revelationType: "meccan", juz: [30] },
  { number: 94, name: "Ash-Sharh", englishName: "Ash-Sharh", englishNameTranslation: "The Relief", arabicName: "الشرح", ayahCount: 8, revelationType: "meccan", juz: [30] },
  { number: 95, name: "At-Tin", englishName: "At-Tin", englishNameTranslation: "The Fig", arabicName: "التين", ayahCount: 8, revelationType: "meccan", juz: [30] },
  { number: 96, name: "Al-Alaq", englishName: "Al-Alaq", englishNameTranslation: "The Clot", arabicName: "العلق", ayahCount: 19, revelationType: "meccan", juz: [30] },
  { number: 97, name: "Al-Qadr", englishName: "Al-Qadr", englishNameTranslation: "The Power", arabicName: "القدر", ayahCount: 5, revelationType: "meccan", juz: [30] },
  { number: 98, name: "Al-Bayyinah", englishName: "Al-Bayyinah", englishNameTranslation: "The Clear Proof", arabicName: "البينة", ayahCount: 8, revelationType: "medinan", juz: [30] },
  { number: 99, name: "Az-Zalzalah", englishName: "Az-Zalzalah", englishNameTranslation: "The Earthquake", arabicName: "الزلزلة", ayahCount: 8, revelationType: "medinan", juz: [30] },
  { number: 100, name: "Al-Adiyat", englishName: "Al-Adiyat", englishNameTranslation: "The Courser", arabicName: "العاديات", ayahCount: 11, revelationType: "meccan", juz: [30] },
  { number: 101, name: "Al-Qari'ah", englishName: "Al-Qari'ah", englishNameTranslation: "The Calamity", arabicName: "القارعة", ayahCount: 11, revelationType: "meccan", juz: [30] },
  { number: 102, name: "At-Takathur", englishName: "At-Takathur", englishNameTranslation: "The Rivalry in world increase", arabicName: "التكاثر", ayahCount: 8, revelationType: "meccan", juz: [30] },
  { number: 103, name: "Al-Asr", englishName: "Al-Asr", englishNameTranslation: "The Declining Day", arabicName: "العصر", ayahCount: 3, revelationType: "meccan", juz: [30] },
  { number: 104, name: "Al-Humazah", englishName: "Al-Humazah", englishNameTranslation: "The Traducer", arabicName: "الهمزة", ayahCount: 9, revelationType: "meccan", juz: [30] },
  { number: 105, name: "Al-Fil", englishName: "Al-Fil", englishNameTranslation: "The Elephant", arabicName: "الفيل", ayahCount: 5, revelationType: "meccan", juz: [30] },
  { number: 106, name: "Quraysh", englishName: "Quraysh", englishNameTranslation: "Quraysh", arabicName: "قريش", ayahCount: 4, revelationType: "meccan", juz: [30] },
  { number: 107, name: "Al-Ma'un", englishName: "Al-Ma'un", englishNameTranslation: "The Small Kindnesses", arabicName: "الماعون", ayahCount: 7, revelationType: "meccan", juz: [30] },
  { number: 108, name: "Al-Kawthar", englishName: "Al-Kawthar", englishNameTranslation: "The Abundance", arabicName: "الكوثر", ayahCount: 3, revelationType: "meccan", juz: [30] },
  { number: 109, name: "Al-Kafirun", englishName: "Al-Kafirun", englishNameTranslation: "The Disbelievers", arabicName: "الكافرون", ayahCount: 6, revelationType: "meccan", juz: [30] },
  { number: 110, name: "An-Nasr", englishName: "An-Nasr", englishNameTranslation: "The Divine Support", arabicName: "النصر", ayahCount: 3, revelationType: "medinan", juz: [30] },
  { number: 111, name: "Al-Masad", englishName: "Al-Masad", englishNameTranslation: "The Palm Fibre", arabicName: "المسد", ayahCount: 5, revelationType: "meccan", juz: [30] },
  { number: 112, name: "Al-Ikhlas", englishName: "Al-Ikhlas", englishNameTranslation: "The Sincerity", arabicName: "الإخلاص", ayahCount: 4, revelationType: "meccan", juz: [30] },
  { number: 113, name: "Al-Falaq", englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", arabicName: "الفلق", ayahCount: 5, revelationType: "meccan", juz: [30] },
  { number: 114, name: "An-Nas", englishName: "An-Nas", englishNameTranslation: "Mankind", arabicName: "الناس", ayahCount: 6, revelationType: "medinan", juz: [30] },
];

// ─── API Cache ──────────────────────────────────────────────────────────────

const ayahCache = new Map<number, AyahWithTranslation[]>();

// ─── Provider Implementation ────────────────────────────────────────────────

export class AlQuranCloudProvider implements QuranContentProvider {
  private baseUrl = "https://api.alquran.cloud/v1";

  getProviderName(): string {
    return "Al-Quran Cloud API (alquran.cloud)";
  }

  async listSurahs(): Promise<SurahInfo[]> {
    return SURAH_DATA;
  }

  async getSurah(surahNumber: number): Promise<SurahInfo | null> {
    if (surahNumber < 1 || surahNumber > 114) return null;
    return SURAH_DATA[surahNumber - 1] ?? null;
  }

  async getAyahs(surahNumber: number): Promise<AyahWithTranslation[]> {
    if (surahNumber < 1 || surahNumber > 114) return [];

    // Return from cache if available
    const cached = ayahCache.get(surahNumber);
    if (cached) return cached;

    try {
      // Fetch Arabic text and English translation in parallel
      const [arabicRes, translationRes] = await Promise.all([
        fetch(`${this.baseUrl}/surah/${surahNumber}/quran-uthmani`),
        fetch(`${this.baseUrl}/surah/${surahNumber}/en.sahih`),
      ]);

      if (!arabicRes.ok || !translationRes.ok) {
        console.warn(`Failed to fetch ayahs for Surah ${surahNumber}`);
        return [];
      }

      const arabicData = await arabicRes.json();
      const translationData = await translationRes.json();

      const arabicAyahs = arabicData?.data?.ayahs ?? [];
      const translationAyahs = translationData?.data?.ayahs ?? [];

      const ayahs: AyahWithTranslation[] = arabicAyahs.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any, idx: number) => ({
          number: a.numberInSurah,
          numberInQuran: a.number,
          text: a.text,
          juz: a.juz,
          page: a.page,
          translation: translationAyahs[idx]?.text ?? undefined,
          translationEdition: "Sahih International (en.sahih)",
        }),
      );

      // Cache the result
      ayahCache.set(surahNumber, ayahs);

      return ayahs;
    } catch (err) {
      console.warn(`Error fetching ayahs for Surah ${surahNumber}:`, err);
      return [];
    }
  }

  async searchContent(query: string): Promise<AyahWithTranslation[]> {
    if (!query || query.length < 2) return [];

    try {
      const res = await fetch(
        `${this.baseUrl}/search/${encodeURIComponent(query)}/all/en.sahih`,
      );
      if (!res.ok) return [];

      const data = await res.json();
      const matches = data?.data?.matches ?? [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return matches.slice(0, 20).map((m: any) => ({
        number: m.numberInSurah,
        numberInQuran: m.number,
        text: m.text,
        juz: m.edition?.identifier === "quran-uthmani" ? m.juz : 0,
        page: m.page ?? 0,
        translation: m.text,
        translationEdition: "Sahih International (en.sahih)",
      }));
    } catch {
      return [];
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let _provider: QuranContentProvider | null = null;

export function getQuranProvider(): QuranContentProvider {
  if (!_provider) {
    _provider = new AlQuranCloudProvider();
  }
  return _provider;
}

export function setQuranProvider(provider: QuranContentProvider): void {
  _provider = provider;
}

// Re-export the static SURAH_DATA for offline/fast access
export { SURAH_DATA };
