"use client";

import {
  BookOpen,
  ChevronDown,
  Database,
  HelpCircle,
  Mail,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SUPPORT_EMAIL } from "@/services/feedback/feedback-service";

interface FAQItem {
  question: string;
  questionBn: string;
  answer: string;
  answerBn: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "prayer" | "offline" | "privacy" | "quran" | "habits" | "support";
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "prayer",
    icon: Moon,
    question: "How are prayer times calculated and how can I adjust them?",
    questionBn: "নামাজের সময় কীভাবে হিসাব করা হয় এবং কীভাবে সমন্বয় করা যায়?",
    answer:
      "Prayer times are computed astronomically based on your geographical coordinates (latitude & longitude) and chosen calculation authority (e.g., Karachi, ISNA, Muslim World League, Umm Al-Qura). You can change the calculation method, Asr juristic school (Hanafi or Standard/Shafi'i), or apply minute-by-minute manual offsets directly in Settings > Prayer Settings.",
    answerBn:
      "আপনার অক্ষাংশ ও দ্রাঘিমাংশ এবং নির্বাচিত হিসাব পদ্ধতি (যেমন: করাচি, রাবেতা আল-আলম, উম্মুল কুরা ইত্যাদি) অনুযায়ী নামাজের সময় বের করা হয়। সেটিংসের 'Prayer Settings' থেকে আপনি হিসাব পদ্ধতি, আসরের হানাফি/শাফেয়ী মাজহাব এবং প্রতি ওয়াক্তে মিনিট যোগ-বিয়োগ করে সমন্বয় করতে পারেন।",
  },
  {
    category: "offline",
    icon: Smartphone,
    question: "Does Istiqamaah work without an internet connection?",
    questionBn: "ইন্টারনেট সংযোগ ছাড়া কি ইস্তিকামাহ ব্যবহার করা যায়?",
    answer:
      "Yes! Istiqamaah is built with full offline-first capabilities. Prayer calculations, Qur'an reading, Hadith of the day, Dhikr tasbih, and habit tracking all function seamlessly offline. Any actions you perform offline are stored in a secure local queue and automatically synchronized with the cloud once your connection is restored.",
    answerBn:
      "হ্যাঁ! ইস্তিকামাহ সম্পূর্ণ অফলাইন-বান্ধব। নামাজের সময়, কুরআন পাঠ, হাদিস, তাসবিহ এবং আমল ট্র্যাকিং ইন্টারনেট ছাড়াও কাজ করে। অফলাইনে করা পরিবর্তনগুলো লোকাল মেমরিতে জমা থাকে এবং ইন্টারনেট পেলে স্বয়ংক্রিয়ভাবে সিঙ্ক হয়।",
  },
  {
    category: "privacy",
    icon: ShieldCheck,
    question: "How is my personal and spiritual data kept private?",
    questionBn: "আমার ব্যক্তিগত ও ইবাদতের তথ্য কীভাবে সুরক্ষিত থাকে?",
    answer:
      "Your privacy is our core promise. Istiqamaah has zero advertisements, zero third-party behavioral trackers, and no public leaderboards. Your prayers, reflections, and habits remain strictly between you and Allah. All database tables are isolated per user via Supabase Row-Level Security (RLS).",
    answerBn:
      "আপনার তথ্যের গোপনীয়তা আমাদের প্রধান অগ্রাধিকার। ইস্তিকামাহ-তে কোনো বিজ্ঞাপন বা ট্র্যাকার নেই। আপনার সালাত, আমল ও ব্যক্তিগত নোট শুধুমাত্র আপনার ও আল্লাহর মাঝে গোপন থাকবে। ডাটাবেজে রো-লেভেল সিকিউরিটি (RLS) প্রয়োগ করা আছে।",
  },
  {
    category: "quran",
    icon: BookOpen,
    question: "Where are Qur'anic verses and Hadith texts sourced from?",
    questionBn: "কুরআনের আয়াত ও হাদিস কোথা থেকে সংগ্রহ করা হয়?",
    answer:
      "All Qur'anic texts use verified Uthmani script with official English and Bengali translations (e.g. Sahih International, Muhiuddin Khan). Hadith collections are curated from authentic references (Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, etc.) with book and number citations.",
    answerBn:
      "কুরআনের মূল টেক্সট উসমানি লিপিতে এবং নির্ভরযোগ্য বাংলা (মুহিউদ্দীন খান) ও ইংরেজি অনুবাদে দেওয়া হয়েছে। হাদিসগুলো সহীহ বুখারী, সহীহ মুসলিম প্রভৃতি বিশুদ্ধ গ্রন্থ থেকে সনদ ও হাদিস নম্বরসহ অন্তর্ভুক্ত করা হয়েছে।",
  },
  {
    category: "habits",
    icon: Sparkles,
    question: "How do habit streaks and prayer anchors work?",
    questionBn: "অভ্যাস বা আমলের ধারাবাহিকতা (Streak) কীভাবে কাজ করে?",
    answer:
      "Habits can be linked to daily prayer anchors (e.g. after Fajr, after Maghrib). Streaks increment when a habit is completed within its intended frequency (daily, weekly). If you miss a day, the streak resets to 0. Make sure your local timezone is set accurately in settings.",
    answerBn:
      "আপনি কোনো আমলকে নির্দিষ্ট নামাজের সাথে যুক্ত করতে পারেন (যেমন ফজরের পর কুরআন তিলাওয়াত)। প্রতিদিন সম্পন্ন করলে স্ট্রিক বৃদ্ধি পায়। কোনো দিন বাদ পড়লে নতুন করে শুরু হয়। সঠিক সময়ের জন্য টাইমজোন ঠিক আছে কিনা দেখে নিন।",
  },
  {
    category: "support",
    icon: Database,
    question: "How can I backup, export, or reset my account data?",
    questionBn: "আমার তথ্য কীভাবে ব্যাকআপ বা এক্সপোর্ট করব?",
    answer:
      "Visit Settings > Data & Privacy to download a quick JSON settings snapshot or click 'Analytics Export' to download comprehensive CSV datasets and PDF reports of all your prayer logs, habits, and study sessions.",
    answerBn:
      "সেটিংসের 'Data & Privacy' সেকশন থেকে আপনি JSON ব্যাকআপ নিতে পারেন অথবা 'Analytics Export' পেইজে গিয়ে সমস্ত আমল ও সালাতের CSV ও PDF রিপোর্ট ডাউনলোড করতে পারেন।",
  },
];

export function FaqDialog() {
  const [open, setOpen] = React.useState(false);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="size-4 text-primary" />
          <span>Help &amp; FAQ</span>
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Frequently Asked Questions (FAQ)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Quick answers to common questions about prayer times, offline sync, and privacy.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            {FAQ_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              const isExpanded = expandedIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card/60 transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(idx)}
                    className="flex w-full items-start justify-between gap-3 p-3.5 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          {item.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                          {item.questionBn}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 mt-1 ${
                        isExpanded ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/20 px-4 py-3 text-xs leading-relaxed space-y-2 text-foreground/90">
                      <p>{item.answer}</p>
                      <p className="text-muted-foreground text-[11px] border-l-2 border-primary/30 pl-2">
                        {item.answerBn}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left text-xs">
              <p className="font-semibold text-foreground">Still need assistance?</p>
              <p className="text-muted-foreground text-[11px]">
                Email our support team directly at {SUPPORT_EMAIL}
              </p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=[Support%20Inquiry]%20Istiqamaah%20Help`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <Mail className="size-3.5" />
              Contact Support
            </a>
          </div>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
