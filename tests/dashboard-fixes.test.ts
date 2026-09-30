import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

import { HadithOfTheDay } from "@/components/dashboard/hadith-of-the-day";
import { isPrayerAvailable } from "@/services/prayer";
import type { HadithRecord } from "@/services/hadith/types";
import type { PrayerDaySummary } from "@/services/prayer";

const sampleHadith: HadithRecord = {
  id: "test-1",
  source: "Sahih Muslim",
  book: "Sahih Muslim",
  hadithNumber: "2699",
  arabicText: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
  englishTranslation: "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.",
  banglaTranslation: "যে ব্যক্তি জ্ঞান অর্জনের পথে চলে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।",
  topic: "Knowledge",
  grade: "Sahih",
  isVerified: true,
  sourceUrl: "https://sunnah.com/muslim:2699",
};

describe("Dashboard Fixes - HadithOfTheDay Bangla in Mobile View", () => {
  it("renders Bangla translation and Arabic text in compact (mobile) mode", () => {
    const html = renderToString(React.createElement(HadithOfTheDay, { hadith: sampleHadith, compact: true }));
    expect(html).toContain("যে ব্যক্তি জ্ঞান অর্জনের পথে চলে");
    expect(html).toContain("Whoever follows a path in pursuit of knowledge");
    expect(html).toContain("مَنْ سَلَكَ طَرِيقًا");
  });

  it("renders Bangla translation and Arabic text in desktop mode", () => {
    const html = renderToString(React.createElement(HadithOfTheDay, { hadith: sampleHadith, compact: false }));
    expect(html).toContain("যে ব্যক্তি জ্ঞান অর্জনের পথে চলে");
    expect(html).toContain("Whoever follows a path in pursuit of knowledge");
    expect(html).toContain("مَنْ سَلَكَ طَرِيقًا");
  });
});

describe("Dashboard Fixes - Prayer Time Lock", () => {
  const baseTime = new Date("2026-09-30T12:00:00Z");
  const prayers: PrayerDaySummary["prayers"] = [
    { name: "fajr", label: "Fajr", time: new Date("2026-09-30T04:30:00Z"), completed: true, notificationsEnabled: true },
    { name: "dhuhr", label: "Dhuhr", time: new Date("2026-09-30T12:00:00Z"), completed: false, notificationsEnabled: true },
    { name: "asr", label: "Asr", time: new Date("2026-09-30T15:30:00Z"), completed: false, notificationsEnabled: true },
    { name: "maghrib", label: "Maghrib", time: new Date("2026-09-30T18:00:00Z"), completed: false, notificationsEnabled: true },
    { name: "isha", label: "Isha", time: new Date("2026-09-30T19:30:00Z"), completed: false, notificationsEnabled: true },
  ];

  it("permits prayers whose time has already arrived or passed", () => {
    expect(isPrayerAvailable("fajr", prayers, baseTime)).toBe(true);
    expect(isPrayerAvailable("dhuhr", prayers, baseTime)).toBe(true);
  });

  it("locks prayers whose time has not yet arrived", () => {
    expect(isPrayerAvailable("asr", prayers, baseTime)).toBe(false);
    expect(isPrayerAvailable("maghrib", prayers, baseTime)).toBe(false);
    expect(isPrayerAvailable("isha", prayers, baseTime)).toBe(false);
  });

  it("handles ISO string timestamps safely", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stringTimePrayers: any = [
      { name: "fajr", label: "Fajr", time: "2026-09-30T04:30:00Z", completed: false },
      { name: "isha", label: "Isha", time: "2026-09-30T19:30:00Z", completed: false },
    ];
    expect(isPrayerAvailable("fajr", stringTimePrayers, baseTime)).toBe(true);
    expect(isPrayerAvailable("isha", stringTimePrayers, baseTime)).toBe(false);
  });
});
