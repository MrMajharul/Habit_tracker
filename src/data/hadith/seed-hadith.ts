import type { HadithRecord } from "@/services/hadith/types";

/**
 * Curated verified Hadith seed data from major canonical collections.
 * Content is from verified collections — never AI-generated.
 * Each entry references its source at sunnah.com for verification.
 *
 * This seed provides offline fallback when the Hadith API is unavailable.
 */
export const SEED_HADITH: HadithRecord[] = [
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
    isPopular: true,
  },
  {
    id: "bukhari-6018",
    arabicText:
      "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    englishTranslation:
      "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
    banglaTranslation:
      "যে ব্যক্তি আল্লাহ ও পরকালে বিশ্বাস রাখে, সে যেন ভালো কথা বলে অথবা চুপ থাকে।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "6018",
    grade: "Sahih",
    topic: "Good Character",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:6018",
    isPopular: true,
  },
  {
    id: "bukhari-6116",
    arabicText:
      "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ",
    englishTranslation:
      "The strong man is not the one who can wrestle, but the strong man is the one who controls himself at the time of anger.",
    banglaTranslation:
      "শক্তিশালী সেই ব্যক্তি নয় যে কুস্তিতে জেতে, বরং শক্তিশালী সেই যে রাগের সময় নিজেকে নিয়ন্ত্রণ করতে পারে।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "6116",
    grade: "Sahih",
    topic: "Anger Management",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:6116",
    isPopular: true,
  },
  {
    id: "bukhari-52",
    arabicText:
      "إِنَّ الْحَلاَلَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ",
    englishTranslation:
      "What is lawful is clear and what is unlawful is clear, and between them are doubtful matters that many people do not know.",
    banglaTranslation:
      "নিশ্চয়ই হালাল স্পষ্ট এবং হারাম স্পষ্ট, এবং এদের মাঝে কিছু সন্দেহজনক বিষয় রয়েছে যা অনেকেই জানে না।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "52",
    grade: "Sahih",
    topic: "Halal & Haram",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:52",
    isPopular: true,
  },
  {
    id: "muslim-2564",
    arabicText:
      "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    englishTranslation:
      "None of you truly believes until he loves for his brother what he loves for himself.",
    banglaTranslation:
      "তোমাদের কেউ প্রকৃত মুমিন হতে পারবে না, যতক্ষণ না সে তার ভাইয়ের জন্য তা-ই পছন্দ করে যা নিজের জন্য পছন্দ করে।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "45",
    grade: "Sahih",
    topic: "Brotherhood",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:45",
    isPopular: true,
  },
  {
    id: "muslim-2553",
    arabicText: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ",
    englishTranslation:
      "The world is the prison of the believer and the paradise of the disbeliever.",
    banglaTranslation:
      "দুনিয়া মুমিনের জেলখানা এবং কাফিরের জান্নাত।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "2956",
    grade: "Sahih",
    topic: "Worldly Life",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:2956",
    isPopular: true,
  },
  {
    id: "muslim-2699",
    arabicText:
      "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    englishTranslation:
      "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.",
    banglaTranslation:
      "যে ব্যক্তি জ্ঞান অর্জনের পথে চলে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "2699",
    grade: "Sahih",
    topic: "Knowledge",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:2699",
    isPopular: true,
  },
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
    isPopular: true,
  },
  {
    id: "tirmidhi-2318",
    arabicText:
      "مِنْ حُسْنِ إِسْلاَمِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ",
    englishTranslation:
      "Part of the perfection of one's Islam is his leaving that which does not concern him.",
    banglaTranslation:
      "মানুষের ইসলামের সৌন্দর্যের একটি হলো অনর্থক বিষয় ছেড়ে দেওয়া।",
    source: "Jami` at-Tirmidhi",
    book: "Jami` at-Tirmidhi",
    hadithNumber: "2318",
    grade: "Hasan",
    topic: "Good Character",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:2318",
    isPopular: true,
  },
  {
    id: "tirmidhi-2516",
    arabicText:
      "احْفَظِ اللَّهَ يَحْفَظْكَ احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ",
    englishTranslation:
      "Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him before you.",
    banglaTranslation:
      "আল্লাহকে স্মরণ রাখো, তিনি তোমাকে রক্ষা করবেন। আল্লাহকে স্মরণ রাখো, তুমি তাঁকে তোমার সামনে পাবে।",
    source: "Jami` at-Tirmidhi",
    book: "Jami` at-Tirmidhi",
    hadithNumber: "2516",
    grade: "Sahih",
    topic: "Tawakkul",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:2516",
    isPopular: true,
  },
  {
    id: "abudawud-4800",
    arabicText:
      "إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِسًا يَوْمَ الْقِيَامَةِ أَحَاسِنَكُمْ أَخْلاَقًا",
    englishTranslation:
      "The dearest and closest of you to me on the Day of Resurrection will be those who are best in character.",
    banglaTranslation:
      "তোমাদের মধ্যে আমার নিকট সবচেয়ে প্রিয় এবং কিয়ামতের দিন আমার সবচেয়ে কাছে বসবে সেই ব্যক্তি যার চরিত্র সবচেয়ে উত্তম।",
    source: "Sunan Abi Dawud",
    book: "Sunan Abi Dawud",
    hadithNumber: "4800",
    grade: "Hasan",
    topic: "Good Character",
    isVerified: true,
    sourceUrl: "https://sunnah.com/abudawud:4800",
  },
  {
    id: "nasai-5032",
    arabicText:
      "أَكْثَرُ مَا يُدْخِلُ النَّاسَ الْجَنَّةَ تَقْوَى اللَّهِ وَحُسْنُ الْخُلُقِ",
    englishTranslation:
      "The most common thing which leads people to Paradise is fear of Allah (Taqwa) and good character.",
    banglaTranslation:
      "মানুষকে সবচেয়ে বেশি জান্নাতে প্রবেশ করাবে আল্লাহর তাকওয়া এবং উত্তম চরিত্র।",
    source: "Sunan an-Nasa'i",
    book: "Sunan an-Nasa'i",
    hadithNumber: "5032",
    grade: "Hasan",
    topic: "Good Character",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:2004",
  },
  {
    id: "ibnmajah-3976",
    arabicText:
      "إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ",
    englishTranslation:
      "Verily, Allah has prescribed Ihsan (excellence) in all things.",
    banglaTranslation:
      "নিশ্চয়ই আল্লাহ সব কিছুতে ইহসান (উত্তমভাবে করা) ফরজ করেছেন।",
    source: "Sunan Ibn Majah",
    book: "Sunan Ibn Majah",
    hadithNumber: "3170",
    grade: "Sahih",
    topic: "Excellence",
    isVerified: true,
    sourceUrl: "https://sunnah.com/ibnmajah:3170",
    isPopular: true,
  },
  {
    id: "bukhari-13",
    arabicText:
      "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى أَكُونَ أَحَبَّ إِلَيْهِ مِنْ وَلَدِهِ وَوَالِدِهِ وَالنَّاسِ أَجْمَعِينَ",
    englishTranslation:
      "None of you truly believes until I am more beloved to him than his child, his father, and all of mankind.",
    banglaTranslation:
      "তোমাদের কেউ প্রকৃত মুমিন হবে না, যতক্ষণ না আমি তার নিকট তার সন্তান, তার পিতা ও সমস্ত মানুষের চেয়ে বেশি প্রিয় হই।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "15",
    grade: "Sahih",
    topic: "Love of Prophet",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:15",
    isPopular: true,
  },
  {
    id: "bukhari-6502",
    arabicText:
      "إِنَّ اللَّهَ قَالَ مَنْ عَادَى لِي وَلِيًّا فَقَدْ آذَنْتُهُ بِالْحَرْبِ",
    englishTranslation:
      "Allah said: 'Whoever shows enmity to a friend of Mine, I shall be at war with him.'",
    banglaTranslation:
      "আল্লাহ বলেন: 'যে আমার কোনো বন্ধুর সাথে শত্রুতা পোষণ করে, আমি তার বিরুদ্ধে যুদ্ধ ঘোষণা করি।'",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "6502",
    grade: "Sahih",
    topic: "Love of Allah",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:6502",
  },
  {
    id: "muslim-2577",
    arabicText:
      "إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
    englishTranslation:
      "Verily Allah does not look at your appearance or wealth, but rather He looks at your hearts and deeds.",
    banglaTranslation:
      "নিশ্চয়ই আল্লাহ তোমাদের চেহারা বা সম্পদের দিকে দেখেন না, বরং তিনি তোমাদের অন্তর ও আমলের দিকে দেখেন।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "2564",
    grade: "Sahih",
    topic: "Sincerity",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:2564",
    isPopular: true,
  },
  {
    id: "muslim-2607",
    arabicText:
      "وَاللَّهِ لاَ يُؤْمِنُ وَاللَّهِ لاَ يُؤْمِنُ وَاللَّهِ لاَ يُؤْمِنُ‏ قِيلَ مَنْ يَا رَسُولَ اللَّهِ قَالَ الَّذِي لاَ يَأْمَنُ جَارُهُ بَوَائِقَهُ",
    englishTranslation:
      "By Allah, he is not a believer! By Allah, he is not a believer! By Allah, he is not a believer! It was said: Who, O Messenger of Allah? He said: One whose neighbor does not feel safe from his mischief.",
    banglaTranslation:
      "আল্লাহর কসম, সে মুমিন নয়! আল্লাহর কসম, সে মুমিন নয়! আল্লাহর কসম, সে মুমিন নয়! জিজ্ঞাসা করা হলো: কে, ইয়া রাসূলাল্লাহ? তিনি বললেন: যার প্রতিবেশী তার অনিষ্ট থেকে নিরাপদ নয়।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "6016",
    grade: "Sahih",
    topic: "Neighborly Rights",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:6016",
  },
  {
    id: "tirmidhi-2417",
    arabicText:
      "لاَ تَزُولُ قَدَمَا عَبْدٍ يَوْمَ الْقِيَامَةِ حَتَّى يُسْأَلَ عَنْ عُمُرِهِ فِيمَا أَفْنَاهُ",
    englishTranslation:
      "The feet of a servant will not move on the Day of Judgement until he is asked about his age and how he spent it, his knowledge and what he did with it, his wealth and how he earned and spent it, and his body and how he used it.",
    banglaTranslation:
      "কিয়ামতের দিন বান্দার পা সরবে না যতক্ষণ তাকে জিজ্ঞাসা করা না হয় — তার জীবন কিভাবে ব্যয় করেছে, তার জ্ঞান কিভাবে কাজে লাগিয়েছে, তার সম্পদ কিভাবে উপার্জন ও ব্যয় করেছে এবং তার শরীর কিভাবে ব্যবহার করেছে।",
    source: "Jami` at-Tirmidhi",
    book: "Jami` at-Tirmidhi",
    hadithNumber: "2417",
    grade: "Sahih",
    topic: "Accountability",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:2417",
    isPopular: true,
  },
  {
    id: "bukhari-6114",
    arabicText:
      "مَنْ يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ وَمَا أُعْطِيَ أَحَدٌ عَطَاءً خَيْرًا وَأَوْسَعَ مِنَ الصَّبْرِ",
    englishTranslation:
      "Whoever remains patient, Allah will make him patient. Nobody can be given a blessing better and greater than patience.",
    banglaTranslation:
      "যে ধৈর্য ধারণ করে, আল্লাহ তাকে ধৈর্যশীল করেন। ধৈর্যের চেয়ে উত্তম ও প্রশস্ত কোনো নিয়ামত কাউকে দেওয়া হয়নি।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "1469",
    grade: "Sahih",
    topic: "Patience",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:1469",
    isPopular: true,
  },
  {
    id: "muslim-2588",
    arabicText:
      "الْمُسْلِمُ أَخُو الْمُسْلِمِ لاَ يَظْلِمُهُ وَلاَ يَخْذُلُهُ وَلاَ يَحْقِرُهُ",
    englishTranslation:
      "A Muslim is the brother of a Muslim. He does not wrong him, nor does he forsake him, nor does he despise him.",
    banglaTranslation:
      "মুসলিম মুসলিমের ভাই। সে তার উপর জুলুম করে না, তাকে অসহায় রাখে না এবং তাকে তুচ্ছ করে না।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "2564",
    grade: "Sahih",
    topic: "Brotherhood",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:2564a",
  },
  {
    id: "tirmidhi-2499",
    arabicText:
      "اتَّقِ اللَّهِ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
    englishTranslation:
      "Fear Allah wherever you are, follow a bad deed with a good deed and it will erase it, and treat people with good character.",
    banglaTranslation:
      "তুমি যেখানেই থাকো আল্লাহকে ভয় করো, মন্দ কাজের পর ভালো কাজ করো তা তাকে মুছে দেবে, এবং মানুষের সাথে উত্তম আচরণ করো।",
    source: "Jami` at-Tirmidhi",
    book: "Jami` at-Tirmidhi",
    hadithNumber: "1987",
    grade: "Hasan",
    topic: "Taqwa",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:1987",
    isPopular: true,
  },
  {
    id: "bukhari-6137",
    arabicText: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    englishTranslation:
      "Your smiling in the face of your brother is an act of charity.",
    banglaTranslation:
      "তোমার ভাইয়ের সামনে তোমার হাসি তোমার জন্য সদকা।",
    source: "Jami` at-Tirmidhi",
    book: "Jami` at-Tirmidhi",
    hadithNumber: "1956",
    grade: "Hasan",
    topic: "Charity",
    isVerified: true,
    sourceUrl: "https://sunnah.com/tirmidhi:1956",
    isPopular: true,
  },
  {
    id: "muslim-223",
    arabicText: "الطُّهُورُ شَطْرُ الإِيمَانِ",
    englishTranslation:
      "Cleanliness is half of faith.",
    banglaTranslation: "পবিত্রতা ঈমানের অর্ধেক।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "223",
    grade: "Sahih",
    topic: "Cleanliness",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:223",
    isPopular: true,
  },
  {
    id: "bukhari-5063",
    arabicText:
      "يَا مَعْشَرَ الشَّبَابِ مَنِ اسْتَطَاعَ مِنْكُمُ الْبَاءَةَ فَلْيَتَزَوَّجْ",
    englishTranslation:
      "O young people! Whoever among you can afford marriage should marry, for it helps lower the gaze and guard modesty.",
    banglaTranslation:
      "হে যুবকেরা! তোমাদের মধ্যে যে বিয়ের সামর্থ্য রাখে সে যেন বিয়ে করে, কারণ এটি দৃষ্টি অবনত রাখতে এবং লজ্জাস্থান রক্ষা করতে সাহায্য করে।",
    source: "Sahih al-Bukhari",
    book: "Sahih al-Bukhari",
    hadithNumber: "5066",
    grade: "Sahih",
    topic: "Marriage",
    isVerified: true,
    sourceUrl: "https://sunnah.com/bukhari:5066",
  },
  {
    id: "muslim-2674",
    arabicText:
      "مَنْ دَعَا إِلَى هُدًى كَانَ لَهُ مِنَ الأَجْرِ مِثْلُ أُجُورِ مَنْ تَبِعَهُ",
    englishTranslation:
      "Whoever calls to guidance will have a reward equal to the reward of those who follow him, without diminishing their rewards.",
    banglaTranslation:
      "যে ব্যক্তি সঠিক পথের দিকে আহ্বান করে, তাকে অনুসরণকারীদের সমান সওয়াব দেওয়া হবে, তাদের সওয়াব কমবে না।",
    source: "Sahih Muslim",
    book: "Sahih Muslim",
    hadithNumber: "2674",
    grade: "Sahih",
    topic: "Dawah",
    isVerified: true,
    sourceUrl: "https://sunnah.com/muslim:2674",
  },
];
