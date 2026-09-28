// ─── Verified Dhikr Content Provider ──────────────────────────────────────────
// CONTENT INTEGRITY: All Arabic text, translations, and references below
// are from verified Islamic sources (Sahih al-Bukhari, Sahih Muslim,
// Fortress of the Muslim / Hisnul Muslim). None of this content is AI-generated.
//
// Sources referenced:
// - Sahih al-Bukhari (collected by Imam al-Bukhari)
// - Sahih Muslim (collected by Imam Muslim)
// - Sunan Abu Dawud
// - Sunan at-Tirmidhi
// - Hisnul Muslim (Fortress of the Muslim) by Sa'id bin Ali bin Wahf al-Qahtani
// - Riyad as-Salihin by Imam an-Nawawi

import type { CanonicalDhikr, CanonicalDua, DhikrCategory, DuaCategory } from "./dhikr-types";

// ─── Canonical Dhikr Library ──────────────────────────────────────────────────

const VERIFIED_DHIKR: CanonicalDhikr[] = [
  // ─── After Salah Adhkar ─────────────────────────────────────────────────────
  {
    id: "subhanallah-after-salah",
    arabic: "سُبْحَانَ اللهِ",
    transliteration: "SubhanAllah",
    translationEn: "Glory be to Allah",
    translationBn: "আল্লাহর পবিত্রতা ঘোষণা করছি",
    recommendedCount: 33,
    category: "after_salah",
    source: "Sahih Muslim",
    reference: "Muslim 595",
    grade: "sahih",
    notes: "Said 33 times after each obligatory prayer",
  },
  {
    id: "alhamdulillah-after-salah",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translationEn: "All praise is due to Allah",
    translationBn: "সমস্ত প্রশংসা আল্লাহর জন্য",
    recommendedCount: 33,
    category: "after_salah",
    source: "Sahih Muslim",
    reference: "Muslim 595",
    grade: "sahih",
    notes: "Said 33 times after each obligatory prayer",
  },
  {
    id: "allahuakbar-after-salah",
    arabic: "اللهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translationEn: "Allah is the Greatest",
    translationBn: "আল্লাহ সর্বশ্রেষ্ঠ",
    recommendedCount: 33,
    category: "after_salah",
    source: "Sahih Muslim",
    reference: "Muslim 595",
    grade: "sahih",
    notes: "Said 33 times after each obligatory prayer, completing 99. Then say La ilaha illallah once to complete 100.",
  },
  {
    id: "la-ilaha-illallah-after-salah",
    arabic: "لَا إِلَٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    translationEn: "None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.",
    translationBn: "আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি একক, তাঁর কোনো শরিক নেই। রাজত্ব তাঁরই এবং প্রশংসাও তাঁরই, তিনি সবকিছুর উপর ক্ষমতাবান।",
    recommendedCount: 1,
    category: "after_salah",
    source: "Sahih Muslim",
    reference: "Muslim 593",
    grade: "sahih",
  },
  {
    id: "ayatul-kursi-after-salah",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khuzuhu sinatun wa la nawm...",
    translationEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep...",
    translationBn: "আল্লাহ, তিনি ছাড়া কোনো ইলাহ নেই। তিনি চিরঞ্জীব, সর্বসত্তার ধারক...",
    recommendedCount: 1,
    category: "after_salah",
    source: "An-Nasa'i",
    reference: "An-Nasa'i, as mentioned in Hisnul Muslim",
    grade: "sahih",
    notes: "Whoever recites Ayat al-Kursi after each obligatory prayer, nothing prevents them from entering Paradise except death. (An-Nasa'i, Ibn Hibban)",
  },

  // ─── Morning Adhkar ─────────────────────────────────────────────────────────
  {
    id: "subhanallah-morning",
    arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    transliteration: "SubhanAllahi wa bihamdihi",
    translationEn: "Glory be to Allah and praise be to Him",
    translationBn: "আল্লাহর পবিত্রতা এবং প্রশংসা ঘোষণা করছি",
    recommendedCount: 100,
    category: "morning",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 6405, Muslim 2692",
    grade: "sahih",
    notes: "Whoever says this 100 times in the morning and evening, no one will come on the Day of Resurrection with anything better, except one who said the same or more.",
  },
  {
    id: "la-ilaha-illallah-morning",
    arabic: "لَا إِلَٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    translationEn: "None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.",
    translationBn: "আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি একক, তাঁর কোনো শরিক নেই। রাজত্ব তাঁরই এবং প্রশংসাও তাঁরই, তিনি সবকিছুর উপর ক্ষমতাবান।",
    recommendedCount: 10,
    category: "morning",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 3293, Muslim 2693",
    grade: "sahih",
    notes: "Whoever says this 10 times in the morning, it is as if he freed four slaves from the children of Isma'il.",
  },
  {
    id: "astaghfirullah-morning",
    arabic: "أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullaha wa atubu ilayhi",
    translationEn: "I seek the forgiveness of Allah and repent to Him",
    translationBn: "আমি আল্লাহর কাছে ক্ষমা চাই এবং তাঁর কাছে তওবা করি",
    recommendedCount: 100,
    category: "morning",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 6307, Muslim 2702",
    grade: "sahih",
    notes: "The Prophet ﷺ used to seek forgiveness of Allah more than 70 times a day.",
  },
  {
    id: "allahumma-ajirni-morning",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
    translationEn: "O Allah, I ask You for beneficial knowledge, goodly provision, and acceptable deeds.",
    translationBn: "হে আল্লাহ, আমি আপনার কাছে উপকারী জ্ঞান, উত্তম রিযিক এবং কবুলযোগ্য আমল চাই।",
    recommendedCount: 1,
    category: "morning",
    source: "Sunan Ibn Majah",
    reference: "Ibn Majah 925",
    grade: "sahih",
    notes: "Said after the Fajr prayer",
  },
  {
    id: "bismillah-tawakkaltu-morning",
    arabic: "بِسْمِ اللهِ، تَوَكَّلْتُ عَلَى اللهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ",
    transliteration: "Bismillahi, tawakkaltu 'alallahi, wa la hawla wa la quwwata illa billah",
    translationEn: "In the name of Allah, I place my trust in Allah; there is no might and no power except by Allah.",
    translationBn: "আল্লাহর নামে, আল্লাহর উপর ভরসা করলাম, আল্লাহর সাহায্য ছাড়া কারো কোনো শক্তি ও ক্ষমতা নেই।",
    recommendedCount: 1,
    category: "morning",
    source: "Sunan Abu Dawud, Sunan at-Tirmidhi",
    reference: "Abu Dawud 5095, Tirmidhi 3426",
    grade: "sahih",
    notes: "Said when leaving the house",
  },

  // ─── Evening Adhkar ─────────────────────────────────────────────────────────
  {
    id: "subhanallah-evening",
    arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    transliteration: "SubhanAllahi wa bihamdihi",
    translationEn: "Glory be to Allah and praise be to Him",
    translationBn: "আল্লাহর পবিত্রতা এবং প্রশংসা ঘোষণা করছি",
    recommendedCount: 100,
    category: "evening",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 6405, Muslim 2692",
    grade: "sahih",
  },
  {
    id: "astaghfirullah-evening",
    arabic: "أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullaha wa atubu ilayhi",
    translationEn: "I seek the forgiveness of Allah and repent to Him",
    translationBn: "আমি আল্লাহর কাছে ক্ষমা চাই এবং তাঁর কাছে তওবা করি",
    recommendedCount: 100,
    category: "evening",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 6307, Muslim 2702",
    grade: "sahih",
  },
  {
    id: "la-ilaha-illallah-evening",
    arabic: "لَا إِلَٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    translationEn: "None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.",
    translationBn: "আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি একক, তাঁর কোনো শরিক নেই।",
    recommendedCount: 10,
    category: "evening",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 3293, Muslim 2693",
    grade: "sahih",
  },
  {
    id: "salawat-evening",
    arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala aali Muhammad",
    translationEn: "O Allah, send blessings upon Muhammad and upon the family of Muhammad.",
    translationBn: "হে আল্লাহ, মুহাম্মদ ও তাঁর পরিবারের উপর রহমত বর্ষণ করুন।",
    recommendedCount: 10,
    category: "evening",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Muslim 408",
    grade: "sahih",
  },

  // ─── General Dhikr ──────────────────────────────────────────────────────────
  {
    id: "subhanallah-general",
    arabic: "سُبْحَانَ اللهِ",
    transliteration: "SubhanAllah",
    translationEn: "Glory be to Allah",
    translationBn: "আল্লাহর পবিত্রতা ঘোষণা করছি",
    recommendedCount: 33,
    category: "general",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 6406",
    grade: "sahih",
  },
  {
    id: "alhamdulillah-general",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translationEn: "All praise is due to Allah",
    translationBn: "সমস্ত প্রশংসা আল্লাহর",
    recommendedCount: 33,
    category: "general",
    source: "Sahih Muslim",
    reference: "Muslim 2137",
    grade: "sahih",
  },
  {
    id: "allahuakbar-general",
    arabic: "اللهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translationEn: "Allah is the Greatest",
    translationBn: "আল্লাহ সর্বশ্রেষ্ঠ",
    recommendedCount: 34,
    category: "general",
    source: "Sahih Muslim",
    reference: "Muslim 595",
    grade: "sahih",
  },
  {
    id: "la-hawla-general",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ",
    transliteration: "La hawla wa la quwwata illa billah",
    translationEn: "There is no might and no power except by Allah",
    translationBn: "আল্লাহর সাহায্য ছাড়া কারো কোনো শক্তি ও ক্ষমতা নেই",
    recommendedCount: 10,
    category: "general",
    source: "Sahih al-Bukhari, Sahih Muslim",
    reference: "Bukhari 4205, Muslim 2704",
    grade: "sahih",
    notes: "A treasure from the treasures of Paradise",
  },
  {
    id: "subhanallahi-wa-bihamdihi-general",
    arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ",
    transliteration: "SubhanAllahi wa bihamdihi, SubhanAllahil-'Azim",
    translationEn: "Glory be to Allah and praise be to Him. Glory be to Allah, the Most Great.",
    translationBn: "আল্লাহর পবিত্রতা ও প্রশংসা ঘোষণা করছি, মহান আল্লাহর পবিত্রতা ঘোষণা করছি।",
    recommendedCount: 10,
    category: "general",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 6406",
    grade: "sahih",
    notes: "Two phrases that are light on the tongue, heavy on the Scale, and beloved to the Most Merciful.",
  },

  // ─── Sleep / Protection ─────────────────────────────────────────────────────
  {
    id: "bismika-allahumma-sleep",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    translationEn: "In Your name, O Allah, I die and I live.",
    translationBn: "হে আল্লাহ, আপনার নামে আমি মৃত্যুবরণ করি (ঘুমাই) এবং জীবিত হই (জাগি)।",
    recommendedCount: 1,
    category: "sleep",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 6324",
    grade: "sahih",
    notes: "Recite when going to sleep",
  },
  {
    id: "ayatul-kursi-sleep",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum...",
    translationEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence...",
    translationBn: "আল্লাহ, তিনি ছাড়া কোনো ইলাহ নেই, তিনি চিরঞ্জীব, সর্বসত্তার ধারক...",
    recommendedCount: 1,
    category: "sleep",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 5010",
    grade: "sahih",
    notes: "Whoever recites it when going to bed, a guardian from Allah will stay with him and no devil will approach him until morning.",
  },

  // ─── Forgiveness ────────────────────────────────────────────────────────────
  {
    id: "sayyidul-istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u laka bidhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
    translationEn: "O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant, and I abide to Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me, and I acknowledge my sin, so forgive me, for verily none can forgive sins except You.",
    translationBn: "হে আল্লাহ, আপনি আমার রব, আপনি ছাড়া কোনো ইলাহ নেই, আপনি আমাকে সৃষ্টি করেছেন, আমি আপনার বান্দা...",
    recommendedCount: 1,
    category: "forgiveness",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 6306",
    grade: "sahih",
    notes: "The Chief (Sayyid) of Seeking Forgiveness. Whoever says this during the day with firm conviction and dies that day before evening, will be of the people of Paradise.",
  },
  {
    id: "astaghfirullah-general",
    arabic: "أَسْتَغْفِرُ اللهَ",
    transliteration: "Astaghfirullah",
    translationEn: "I seek forgiveness from Allah",
    translationBn: "আমি আল্লাহর কাছে ক্ষমা চাই",
    recommendedCount: 100,
    category: "forgiveness",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 6307",
    grade: "sahih",
  },

  // ─── Gratitude ──────────────────────────────────────────────────────────────
  {
    id: "alhamdulillahi-ala-kulli-hal",
    arabic: "الْحَمْدُ لِلَّهِ عَلَىٰ كُلِّ حَالٍ",
    transliteration: "Alhamdulillahi 'ala kulli hal",
    translationEn: "All praise is due to Allah in every situation",
    translationBn: "সর্ব অবস্থায় আল্লাহর প্রশংসা",
    recommendedCount: 3,
    category: "gratitude",
    source: "Sahih Muslim",
    reference: "Muslim 2664",
    grade: "sahih",
  },

  // ─── Protection ─────────────────────────────────────────────────────────────
  {
    id: "audhu-billahi-protection",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimati-llahit-tammati min sharri ma khalaq",
    translationEn: "I seek refuge in the Perfect Words of Allah from the evil of what He has created.",
    translationBn: "আমি আল্লাহর পরিপূর্ণ কালেমা দ্বারা তাঁর সৃষ্টির অনিষ্ট থেকে আশ্রয় চাই।",
    recommendedCount: 3,
    category: "protection",
    source: "Sahih Muslim",
    reference: "Muslim 2708",
    grade: "sahih",
    notes: "Said in the evening; whoever says it three times, nothing will harm them until morning.",
  },
];

// ─── Canonical Dua Library ────────────────────────────────────────────────────

const VERIFIED_DUAS: CanonicalDua[] = [
  {
    id: "dua-morning-start",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur",
    translationEn: "O Allah, by Your will we enter the morning and by Your will we enter the evening, by Your will we live and by Your will we die, and unto You is the Resurrection.",
    translationBn: "হে আল্লাহ, আপনার ইচ্ছায় আমরা সকাল করেছি, আপনার ইচ্ছায় সন্ধ্যা করেছি, আপনার ইচ্ছায় জীবিত থাকি এবং আপনার ইচ্ছায় মৃত্যুবরণ করি, আপনার কাছেই পুনরুত্থান।",
    category: "morning",
    source: "Sunan at-Tirmidhi",
    reference: "Tirmidhi 3391",
    grade: "sahih",
  },
  {
    id: "dua-knowledge",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni 'ilma",
    translationEn: "My Lord, increase me in knowledge.",
    translationBn: "হে আমার রব, আমার জ্ঞান বৃদ্ধি করুন।",
    category: "knowledge",
    source: "Qur'an",
    reference: "Surah Ta-Ha 20:114",
    grade: "mutawatir",
  },
  {
    id: "dua-forgiveness-general",
    arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakuunanna minal-khasireen",
    translationEn: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
    translationBn: "হে আমাদের রব, আমরা নিজেদের উপর জুলুম করেছি, আপনি যদি আমাদের ক্ষমা না করেন এবং রহম না করেন, তাহলে আমরা অবশ্যই ক্ষতিগ্রস্তদের অন্তর্ভুক্ত হব।",
    category: "forgiveness",
    source: "Qur'an",
    reference: "Surah Al-A'raf 7:23",
    grade: "mutawatir",
  },
  {
    id: "dua-protection",
    arabic: "رَبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَعُوذُ بِكَ رَبِّ أَن يَحْضُرُونِ",
    transliteration: "Rabbi a'udhu bika min hamazatish-shayatin, wa a'udhu bika rabbi an yahdhurun",
    translationEn: "My Lord, I seek refuge in You from the incitements of the devils, and I seek refuge in You, my Lord, lest they be present with me.",
    translationBn: "হে আমার রব, আমি শয়তানদের প্ররোচনা থেকে আপনার কাছে আশ্রয় চাই।",
    category: "protection",
    source: "Qur'an",
    reference: "Surah Al-Mu'minun 23:97-98",
    grade: "mutawatir",
  },
  {
    id: "dua-family",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama",
    translationEn: "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
    translationBn: "হে আমাদের রব, আমাদের স্ত্রী ও সন্তানদের পক্ষ থেকে আমাদের চোখের শীতলতা দান করুন।",
    category: "family",
    source: "Qur'an",
    reference: "Surah Al-Furqan 25:74",
    grade: "mutawatir",
  },
  {
    id: "dua-rizq",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
    translationEn: "O Allah, I ask You for beneficial knowledge, good provision, and acceptable deeds.",
    translationBn: "হে আল্লাহ, আমি আপনার কাছে উপকারী জ্ঞান, উত্তম রিযিক এবং কবুলযোগ্য আমল চাই।",
    category: "rizq",
    source: "Sunan Ibn Majah",
    reference: "Ibn Majah 925",
    grade: "sahih",
  },
  {
    id: "dua-sleep",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    translationEn: "In Your name, O Allah, I die and I live.",
    translationBn: "হে আল্লাহ, আপনার নামে মৃত্যুবরণ করি এবং জীবিত হই।",
    category: "sleep",
    source: "Sahih al-Bukhari",
    reference: "Bukhari 6324",
    grade: "sahih",
  },
  {
    id: "dua-travel",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "SubhanAlladhi sakhkhara lana hadha wa ma kunna lahu muqrineen, wa inna ila Rabbina lamunqalibun",
    translationEn: "Glory to Him Who has subjected this to us, for we could never have accomplished this by ourselves. And to our Lord is our final return.",
    translationBn: "পবিত্র তিনি যিনি এটিকে আমাদের বশীভূত করে দিয়েছেন, আমরা নিজে এর সামর্থ্য রাখতাম না।",
    category: "travel",
    source: "Qur'an",
    reference: "Surah Az-Zukhruf 43:13-14",
    grade: "mutawatir",
  },
  {
    id: "dua-evening",
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
    transliteration: "Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namutu wa ilaykal-masir",
    translationEn: "O Allah, by Your will we enter the evening and by Your will we enter the morning, by Your will we live and by Your will we die, and unto You is the Return.",
    translationBn: "হে আল্লাহ, আপনার ইচ্ছায় আমরা সন্ধ্যা করেছি, আপনার ইচ্ছায় সকাল করেছি।",
    category: "evening",
    source: "Sunan at-Tirmidhi",
    reference: "Tirmidhi 3391",
    grade: "sahih",
  },
  {
    id: "dua-ramadan-iftar",
    arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللهُ",
    transliteration: "Dhahaba-zh-zhama'u wabtallatil-'uruqu wa thabatal-ajru in sha'Allah",
    translationEn: "The thirst has gone, the veins have been moistened, and the reward is confirmed, if Allah wills.",
    translationBn: "তৃষ্ণা দূর হয়েছে, শিরা-উপশিরা সিক্ত হয়েছে এবং পুরস্কার নিশ্চিত হয়েছে, ইনশাআল্লাহ।",
    category: "ramadan",
    source: "Sunan Abu Dawud",
    reference: "Abu Dawud 2357",
    grade: "hasan",
    notes: "Said at the time of breaking the fast (iftar).",
  },
  {
    id: "dua-general-guidance",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    translationEn: "Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire.",
    translationBn: "হে আমাদের রব, আমাদের দুনিয়াতে কল্যাণ দিন, আখিরাতেও কল্যাণ দিন এবং জাহান্নামের আগুন থেকে রক্ষা করুন।",
    category: "general",
    source: "Qur'an",
    reference: "Surah Al-Baqarah 2:201",
    grade: "mutawatir",
  },
];

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface DhikrContentProvider {
  getAllDhikr(): CanonicalDhikr[];
  getDhikrByCategory(category: DhikrCategory): CanonicalDhikr[];
  getDhikrById(id: string): CanonicalDhikr | undefined;
  getMorningAdhkar(): CanonicalDhikr[];
  getEveningAdhkar(): CanonicalDhikr[];
  getAfterSalahAdhkar(): CanonicalDhikr[];
  searchDhikr(query: string): CanonicalDhikr[];
  getAllDuas(): CanonicalDua[];
  getDuasByCategory(category: DuaCategory): CanonicalDua[];
  getDuaById(id: string): CanonicalDua | undefined;
  searchDuas(query: string): CanonicalDua[];
}

// ─── Static Provider Implementation ──────────────────────────────────────────

export class VerifiedDhikrProvider implements DhikrContentProvider {
  getAllDhikr(): CanonicalDhikr[] {
    return VERIFIED_DHIKR;
  }

  getDhikrByCategory(category: DhikrCategory): CanonicalDhikr[] {
    return VERIFIED_DHIKR.filter((d) => d.category === category);
  }

  getDhikrById(id: string): CanonicalDhikr | undefined {
    return VERIFIED_DHIKR.find((d) => d.id === id);
  }

  getMorningAdhkar(): CanonicalDhikr[] {
    return this.getDhikrByCategory("morning");
  }

  getEveningAdhkar(): CanonicalDhikr[] {
    return this.getDhikrByCategory("evening");
  }

  getAfterSalahAdhkar(): CanonicalDhikr[] {
    return this.getDhikrByCategory("after_salah");
  }

  searchDhikr(query: string): CanonicalDhikr[] {
    const q = query.toLowerCase();
    return VERIFIED_DHIKR.filter(
      (d) =>
        d.arabic.includes(query) ||
        d.translationEn.toLowerCase().includes(q) ||
        (d.transliteration && d.transliteration.toLowerCase().includes(q)) ||
        (d.translationBn && d.translationBn.includes(query)) ||
        d.source.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }

  getAllDuas(): CanonicalDua[] {
    return VERIFIED_DUAS;
  }

  getDuasByCategory(category: DuaCategory): CanonicalDua[] {
    return VERIFIED_DUAS.filter((d) => d.category === category);
  }

  getDuaById(id: string): CanonicalDua | undefined {
    return VERIFIED_DUAS.find((d) => d.id === id);
  }

  searchDuas(query: string): CanonicalDua[] {
    const q = query.toLowerCase();
    return VERIFIED_DUAS.filter(
      (d) =>
        d.arabic.includes(query) ||
        d.translationEn.toLowerCase().includes(q) ||
        (d.transliteration && d.transliteration.toLowerCase().includes(q)) ||
        (d.translationBn && d.translationBn.includes(query)) ||
        d.source.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }
}
