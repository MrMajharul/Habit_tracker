"use client";

import { Bookmark, BookmarkCheck, Crown, Search, Share2, Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HADITH_COLLECTIONS } from "@/services/hadith/hadith-service";
import type { HadithRecord } from "@/services/hadith/types";

interface HadithPageClientProps {
  initialHadiths: HadithRecord[];
}

const BOOKMARK_KEY = "istiqamaah_hadith_bookmarks";
const LEGACY_BOOKMARK_KEY = "noorpath_hadith_bookmarks";

type ViewTab = "all" | "popular" | "bookmarked";

export function HadithPageClient({ initialHadiths }: HadithPageClientProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState<string>("all");
  const [selectedCollection, setSelectedCollection] = React.useState<string>("all");
  const [viewTab, setViewTab] = React.useState<ViewTab>("all");
  const [bookmarkedIds, setBookmarkedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const saved =
        localStorage.getItem(BOOKMARK_KEY) ??
        localStorage.getItem(LEGACY_BOOKMARK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimeout(() => setBookmarkedIds(parsed), 0);
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleBookmark = (id: string) => {
    let next: string[];
    if (bookmarkedIds.includes(id)) {
      next = bookmarkedIds.filter((item) => item !== id);
      toast.info("Hadith removed from bookmarks");
    } else {
      next = [...bookmarkedIds, id];
      toast.success("Hadith bookmarked");
    }
    setBookmarkedIds(next);
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const handleShare = async (hadith: HadithRecord) => {
    const text = `"${hadith.englishTranslation}"\n— ${hadith.source} (#${hadith.hadithNumber})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hadith from ${hadith.source}`,
          text,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Hadith copied to clipboard");
  };

  // Extract unique topics
  const topics = React.useMemo(() => {
    const set = new Set<string>();
    initialHadiths.forEach((h) => {
      if (h.topic) set.add(h.topic);
    });
    return Array.from(set);
  }, [initialHadiths]);

  // Extract unique collections
  const collections = React.useMemo(() => {
    const set = new Set<string>();
    initialHadiths.forEach((h) => {
      if (h.source) set.add(h.source);
    });
    return Array.from(set);
  }, [initialHadiths]);

  // Popular hadiths
  const popularHadiths = React.useMemo(() => {
    return initialHadiths.filter((h) => h.isPopular);
  }, [initialHadiths]);

  // Filter hadiths
  const filteredHadiths = React.useMemo(() => {
    let source = initialHadiths;

    if (viewTab === "popular") {
      source = popularHadiths;
    } else if (viewTab === "bookmarked") {
      source = initialHadiths.filter((h) => bookmarkedIds.includes(h.id));
    }

    return source.filter((h) => {
      if (selectedCollection !== "all" && h.source !== selectedCollection) {
        return false;
      }
      if (selectedTopic !== "all" && h.topic !== selectedTopic) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesEng = h.englishTranslation.toLowerCase().includes(query);
        const matchesBn = h.banglaTranslation?.toLowerCase().includes(query);
        const matchesSrc = h.source.toLowerCase().includes(query);
        const matchesTopic = h.topic?.toLowerCase().includes(query);
        if (!matchesEng && !matchesBn && !matchesSrc && !matchesTopic) {
          return false;
        }
      }
      return true;
    });
  }, [initialHadiths, popularHadiths, viewTab, bookmarkedIds, selectedCollection, selectedTopic, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Hadith Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Authentic, source-controlled Hadiths with Arabic, English, and Bangla translations.
          </p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 rounded-xl bg-muted/60 p-1">
        {([
          { id: "all" as const, label: "All", count: initialHadiths.length },
          { id: "popular" as const, label: "Popular", count: popularHadiths.length, icon: Crown },
          { id: "bookmarked" as const, label: "Bookmarked", count: bookmarkedIds.length, icon: Bookmark },
        ]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all flex-1 justify-center ${
                viewTab === tab.id
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="size-3.5" />}
              <span>{tab.label}</span>
              <Badge variant="secondary" className="ml-1 text-[10px] h-5 min-w-5 px-1.5">
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Verified Notice */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
        <strong className="font-semibold flex items-center gap-1.5 mb-1">
          <Sparkles className="size-3.5 text-gold" />
          Source Integrity Guarantee:
        </strong>
        Every narration is cross-referenced from verified canonical collections (Sahih al-Bukhari, Sahih Muslim, Jami` at-Tirmidhi, Sunan Abi Dawud, Sunan an-Nasa&apos;i, Sunan Ibn Majah). Content is never artificially synthesized.
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by topic, translation, or book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Collection filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Collection:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCollection("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCollection === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {collections.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCollection(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCollection === c
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {HADITH_COLLECTIONS.find((col) => col.name === c)?.name.split(" ").slice(-1)[0] || c}
            </button>
          ))}
        </div>

        {/* Topic filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Topic:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTopic("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedTopic === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            All Topics
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTopic(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                selectedTopic === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Hadith List */}
      <div className="space-y-4">
        {filteredHadiths.map((hadith) => {
          const isBookmarked = bookmarkedIds.includes(hadith.id);
          return (
            <Card
              key={hadith.id}
              className="border-gold/20 bg-gradient-to-br from-card to-gold/[0.03] transition-all hover:border-gold/30 hover:shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      {hadith.source}
                    </CardTitle>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        #{hadith.hadithNumber}
                      </Badge>
                      {hadith.grade && (
                        <Badge variant="secondary" className="text-[10px]">
                          {hadith.grade}
                        </Badge>
                      )}
                      {hadith.topic && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {hadith.topic}
                        </Badge>
                      )}
                      {hadith.isPopular && (
                        <Badge variant="secondary" className="text-[10px] bg-gold/15 text-gold border-gold/30">
                          <Crown className="size-2.5 mr-0.5" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Bookmark hadith"
                      onClick={() => toggleBookmark(hadith.id)}
                      className={isBookmarked ? "text-gold" : "text-muted-foreground"}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="size-4 fill-gold text-gold" />
                      ) : (
                        <Bookmark className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Share hadith"
                      onClick={() => handleShare(hadith)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p
                  className="text-right font-serif text-xl leading-loose text-foreground/90"
                  dir="rtl"
                  lang="ar"
                >
                  {hadith.arabicText}
                </p>

                <blockquote className="border-l-2 border-gold/50 pl-4 text-sm leading-relaxed text-foreground">
                  &ldquo;{hadith.englishTranslation}&rdquo;
                </blockquote>

                {hadith.banglaTranslation && (
                  <p className="text-xs leading-relaxed text-muted-foreground" lang="bn">
                    {hadith.banglaTranslation}
                  </p>
                )}

                {hadith.sourceUrl && (
                  <div className="pt-1">
                    <a
                      href={hadith.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Verify at Sunnah.com ↗
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHadiths.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium">No Hadiths match your filter</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {viewTab === "bookmarked"
                ? "You haven't bookmarked any Hadiths yet."
                : viewTab === "popular"
                  ? "No popular Hadiths match your search."
                  : "Try searching with different terms or reset topic filters."}
            </p>
            {viewTab !== "all" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setViewTab("all")}
              >
                Show All Hadiths
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
