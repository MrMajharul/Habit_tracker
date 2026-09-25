"use client";

import { Bookmark, BookmarkCheck, Search, Share2, Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HadithRecord } from "@/services/hadith/types";

interface HadithPageClientProps {
  initialHadiths: HadithRecord[];
}

const BOOKMARK_KEY = "istiqamah_hadith_bookmarks";
const LEGACY_BOOKMARK_KEY = "noorpath_hadith_bookmarks";

export function HadithPageClient({ initialHadiths }: HadithPageClientProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState<string>("all");
  const [showOnlyBookmarked, setShowOnlyBookmarked] = React.useState(false);
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

  // Filter hadiths
  const filteredHadiths = React.useMemo(() => {
    return initialHadiths.filter((h) => {
      if (showOnlyBookmarked && !bookmarkedIds.includes(h.id)) {
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
  }, [initialHadiths, showOnlyBookmarked, bookmarkedIds, selectedTopic, searchTerm]);

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
        <Button
          variant={showOnlyBookmarked ? "default" : "outline"}
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
        >
          {showOnlyBookmarked ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
          <span>Bookmarked ({bookmarkedIds.length})</span>
        </Button>
      </div>

      {/* Verified Notice */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
        <strong className="font-semibold flex items-center gap-1.5 mb-1">
          <Sparkles className="size-3.5 text-gold" />
          Source Integrity Guarantee:
        </strong>
        Every narration is cross-referenced from verified canonical collections (Sahih al-Bukhari, Sahih Muslim, Jami` at-Tirmidhi, Sunan Abi Dawud). Content is never artificially synthesized.
      </div>

      {/* Search and Topic Filters */}
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

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
              {showOnlyBookmarked
                ? "You haven't bookmarked any Hadiths yet."
                : "Try searching with different terms or reset topic filters."}
            </p>
            {showOnlyBookmarked && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowOnlyBookmarked(false)}
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
