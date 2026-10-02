"use client";

import * as React from "react";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Library,
  Loader2,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  HADITH_COLLECTIONS,
  hadithService,
} from "@/services/hadith/hadith-service";
import type {
  HadithBookSection,
  HadithCollectionInfo,
  HadithRecord,
  ReadingPosition,
} from "@/services/hadith/types";
import { cn } from "@/lib/utils";

interface HadithPageClientProps {
  initialHadiths: HadithRecord[];
}

const BOOKMARK_KEY = "istiqamaah_hadith_bookmarks";
const LEGACY_BOOKMARK_KEY = "noorpath_hadith_bookmarks";

type ViewTab = "collections" | "all" | "popular" | "bookmarked";

export function HadithPageClient({ initialHadiths }: HadithPageClientProps) {
  // Navigation State
  const [activeCollection, setActiveCollection] = React.useState<HadithCollectionInfo | null>(null);
  const [activeBookNumber, setActiveBookNumber] = React.useState<number | null>(null);
  const [bookSections, setBookSections] = React.useState<HadithBookSection[]>([]);
  const [bookHadiths, setBookHadiths] = React.useState<HadithRecord[]>([]);
  const [bookTitle, setBookTitle] = React.useState<string>("");
  const [loadingBook, setLoadingBook] = React.useState(false);
  const [loadingSections, setLoadingSections] = React.useState(false);
  const [lastRead, setLastRead] = React.useState<ReadingPosition | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewTab, setViewTab] = React.useState<ViewTab>("collections");
  const [bookmarkedIds, setBookmarkedIds] = React.useState<string[]>([]);

  // Load bookmarks and last read position on mount
  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved =
          localStorage.getItem(BOOKMARK_KEY) ??
          localStorage.getItem(LEGACY_BOOKMARK_KEY);
        if (saved) {
          setBookmarkedIds(JSON.parse(saved));
        }
        const pos = hadithService.getLastReadPosition();
        if (pos) {
          setLastRead(pos);
        }
      } catch {
        // Ignore
      }
    });
  }, []);

  // When collection is chosen, load its sections
  React.useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      if (!activeCollection) {
        setBookSections([]);
        return;
      }

      setLoadingSections(true);
      hadithService.getCollectionSections(activeCollection.id).then((sections) => {
        if (isMounted) {
          setBookSections(sections);
          setLoadingSections(false);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeCollection]);

  // When collection + book is chosen, load its hadiths
  React.useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      if (!activeCollection || activeBookNumber === null) {
        setBookHadiths([]);
        return;
      }

      setLoadingBook(true);
      hadithService
        .getBookHadiths(activeCollection.id, activeBookNumber)
        .then((res) => {
          if (isMounted) {
            setBookTitle(res.bookTitle);
            setBookHadiths(res.hadiths);
            setLoadingBook(false);
            // Persist last read position
            hadithService.saveLastReadPosition({
              collectionId: activeCollection.id,
              bookNumber: activeBookNumber,
            });
            setLastRead({
              collectionId: activeCollection.id,
              bookNumber: activeBookNumber,
              updatedAt: Date.now(),
            });
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [activeCollection, activeBookNumber]);

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
    if (typeof navigator !== "undefined" && navigator.share) {
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

  const handleCopyReference = async (hadith: HadithRecord) => {
    const ref = `${hadith.source}, ${hadith.book}, Hadith ${hadith.hadithNumber}`;
    await navigator.clipboard.writeText(ref);
    toast.success("Reference copied: " + ref);
  };

  const handleResumeLastRead = () => {
    if (!lastRead) return;
    const col = HADITH_COLLECTIONS.find((c) => c.id === lastRead.collectionId);
    if (col) {
      setActiveCollection(col);
      setActiveBookNumber(lastRead.bookNumber);
      setViewTab("collections");
    }
  };

  // Filter global hadiths (when on 'all', 'popular', or 'bookmarked' tab)
  const filteredGlobalHadiths = React.useMemo(() => {
    let list = initialHadiths;

    if (viewTab === "popular") {
      list = list.filter((h) => h.isPopular);
    } else if (viewTab === "bookmarked") {
      list = list.filter((h) => bookmarkedIds.includes(h.id));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (h) =>
          h.englishTranslation.toLowerCase().includes(q) ||
          h.source.toLowerCase().includes(q) ||
          h.book.toLowerCase().includes(q) ||
          h.hadithNumber.includes(q),
      );
    }

    return list;
  }, [initialHadiths, viewTab, bookmarkedIds, searchTerm]);

  // Filter book sections by search query
  const filteredBookSections = React.useMemo(() => {
    if (!searchTerm.trim()) return bookSections;
    const q = searchTerm.toLowerCase();
    return bookSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        String(s.bookNumber).includes(q),
    );
  }, [bookSections, searchTerm]);

  // ─── VIEW 3: Book Hadith Reader ───────────────────────────────────────────
  if (activeCollection && activeBookNumber !== null) {
    const currentSectionIdx = bookSections.findIndex(
      (s) => s.bookNumber === activeBookNumber,
    );
    const prevBook =
      currentSectionIdx > 0 ? bookSections[currentSectionIdx - 1] : null;
    const nextBook =
      currentSectionIdx < bookSections.length - 1
        ? bookSections[currentSectionIdx + 1]
        : null;

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveBookNumber(null)}
            className="gap-1 text-xs"
          >
            <ChevronLeft className="size-4" />
            Back to {activeCollection.name}
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span>Book {activeBookNumber}</span>
            <span>·</span>
            <span>{bookHadiths.length} Hadiths</span>
          </div>
        </div>

        {/* Book Header Card */}
        <Card className="border-primary/20 bg-linear-to-br from-card to-primary/5">
          <CardHeader className="text-center pb-4">
            <Badge variant="outline" className="mx-auto text-[11px] mb-1">
              {activeCollection.name}
            </Badge>
            <CardTitle className="text-xl md:text-2xl font-bold">
              {bookTitle || `Book ${activeBookNumber}`}
            </CardTitle>
            <CardDescription className="text-xs">
              Authentic transmission from verified canonical sources (Sunnah.com / fawazahmed0)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Hadith List */}
        {loadingBook ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading authentic reports...</p>
          </div>
        ) : bookHadiths.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <BookOpen className="mx-auto size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No Hadiths found for this book.</p>
              <p className="text-xs text-muted-foreground">
                Content is loaded directly from verified CDN editions.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveBookNumber(activeBookNumber)}
                className="gap-1 text-xs"
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookHadiths.map((hadith, index) => {
              const isBookmarked = bookmarkedIds.includes(hadith.id);
              return (
                <Card
                  key={hadith.id || index}
                  className="overflow-hidden border-border/80 transition-shadow hover:shadow-xs"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs font-semibold">
                        Hadith #{hadith.hadithNumber}
                      </Badge>
                      {hadith.grade && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase tracking-wider py-0",
                            hadith.grade.toLowerCase().includes("sahih")
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                          )}
                        >
                          {hadith.grade}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopyReference(hadith)}
                        title="Copy reference"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleShare(hadith)}
                        title="Share hadith"
                      >
                        <Share2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-8",
                          isBookmarked
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => toggleBookmark(hadith.id)}
                        title={isBookmarked ? "Remove bookmark" : "Bookmark hadith"}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="size-4 fill-current" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Arabic Text */}
                    {hadith.arabicText && (
                      <p
                        className="font-arabic text-xl md:text-2xl leading-loose text-foreground font-medium text-right"
                        dir="rtl"
                      >
                        {hadith.arabicText}
                      </p>
                    )}

                    {/* Translation */}
                    <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                      {hadith.englishTranslation}
                    </p>

                    {/* Reference Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                      <span>
                        Reference: {hadith.source} {hadith.hadithNumber}
                      </span>
                      {hadith.sourceUrl && (
                        <a
                          href={hadith.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <span>Sunnah.com</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Previous / Next Book Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border/70">
          {prevBook ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveBookNumber(prevBook.bookNumber)}
              className="gap-1.5 text-xs max-w-[45%]"
            >
              <ChevronLeft className="size-4 shrink-0" />
              <span className="truncate">Prev: {prevBook.title}</span>
            </Button>
          ) : (
            <div />
          )}

          {nextBook ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveBookNumber(nextBook.bookNumber)}
              className="gap-1.5 text-xs max-w-[45%]"
            >
              <span className="truncate">Next: {nextBook.title}</span>
              <ChevronRight className="size-4 shrink-0" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  // ─── VIEW 2: Books / Chapters in Chosen Collection ────────────────────────
  if (activeCollection && activeBookNumber === null) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveCollection(null)}
            className="gap-1 text-xs"
          >
            <ChevronLeft className="size-4" />
            All Collections
          </Button>

          <Badge variant="outline" className="text-xs font-mono">
            {activeCollection.totalBooks} Books
          </Badge>
        </div>

        {/* Collection Header */}
        <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-card to-primary/5 p-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {activeCollection.name}
            </h1>
            <p className="font-arabic text-xl font-bold text-primary" dir="rtl">
              {activeCollection.arabicName}
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {activeCollection.description}
          </p>
        </div>

        {/* Search within collection books */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search books in ${activeCollection.name}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Books Grid */}
        {loadingSections ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading collection books...</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookSections.map((sec) => (
              <Card
                key={sec.bookNumber}
                onClick={() => setActiveBookNumber(sec.bookNumber)}
                className="cursor-pointer border-border/70 hover:border-primary/50 hover:shadow-sm transition-all group"
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-mono text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {sec.bookNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {sec.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Book {sec.bookNumber}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── VIEW 1: Main Hadith Hub (Collections List / Tabs) ─────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Hadith Collections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified prophetic traditions from the six canonical Kutub al-Sittah compilations.
        </p>
      </div>

      {/* Resume Last Read Banner */}
      {lastRead && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Continue Reading
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {HADITH_COLLECTIONS.find((c) => c.id === lastRead.collectionId)?.name} · Book {lastRead.bookNumber}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleResumeLastRead} className="h-8 text-xs gap-1">
              <span>Resume</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button
          variant={viewTab === "collections" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setViewTab("collections");
            setSearchTerm("");
          }}
          className="gap-1.5 text-xs"
        >
          <Library className="size-3.5" />
          Collections
        </Button>
        <Button
          variant={viewTab === "popular" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setViewTab("popular");
            setSearchTerm("");
          }}
          className="gap-1.5 text-xs"
        >
          <Sparkles className="size-3.5" />
          Popular
        </Button>
        <Button
          variant={viewTab === "bookmarked" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setViewTab("bookmarked");
            setSearchTerm("");
          }}
          className="gap-1.5 text-xs"
        >
          <Bookmark className="size-3.5" />
          Bookmarked ({bookmarkedIds.length})
        </Button>
        <Button
          variant={viewTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setViewTab("all");
            setSearchTerm("");
          }}
          className="gap-1.5 text-xs"
        >
          <BookOpen className="size-3.5" />
          Browse All
        </Button>
      </div>

      {/* VIEW: Collections Grid */}
      {viewTab === "collections" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HADITH_COLLECTIONS.map((col) => (
              <Card
                key={col.id}
                onClick={() => setActiveCollection(col)}
                className="cursor-pointer border-border/80 hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {col.totalBooks} Books
                    </Badge>
                    <p className="font-arabic text-base font-bold text-primary" dir="rtl">
                      {col.arabicName}
                    </p>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mt-2">
                    {col.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {col.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    <span className="font-mono">~{col.totalHadiths.toLocaleString()} Hadiths</span>
                    <span className="flex items-center gap-1 text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      Browse Books <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Hadith Feed for Popular, Bookmarked, All */}
      {viewTab !== "collections" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search hadith text, topic, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredGlobalHadiths.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                <Bookmark className="mx-auto size-8 text-muted-foreground/30" />
                <p className="text-sm font-medium">No Hadiths match your criteria.</p>
                <p className="text-xs">
                  {viewTab === "bookmarked"
                    ? "Bookmark hadiths while reading to easily reference them here."
                    : "Try adjusting your search terms or browsing by collection."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredGlobalHadiths.map((hadith) => {
                const isBookmarked = bookmarkedIds.includes(hadith.id);
                return (
                  <Card key={hadith.id} className="border-border/80">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20">
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          {hadith.source}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {hadith.book} · Hadith #{hadith.hadithNumber}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyReference(hadith)}
                          title="Copy reference"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleShare(hadith)}
                          title="Share"
                        >
                          <Share2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-8",
                            isBookmarked ? "text-primary" : "text-muted-foreground",
                          )}
                          onClick={() => toggleBookmark(hadith.id)}
                          title="Bookmark"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="size-4 fill-current" />
                          ) : (
                            <Bookmark className="size-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">
                      {hadith.arabicText && (
                        <p
                          className="font-arabic text-lg md:text-xl leading-loose text-foreground text-right"
                          dir="rtl"
                        >
                          {hadith.arabicText}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {hadith.englishTranslation}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
