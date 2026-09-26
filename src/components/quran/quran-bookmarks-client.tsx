"use client";

import { BookmarkCheck, BookOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { quranBookmarkService } from "@/services/quran/quran-bookmark-service";
import { SURAH_DATA } from "@/services/quran/quran-provider";
import type { QuranBookmark } from "@/services/quran/quran-types";

export function QuranBookmarksClient() {
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(
    quranBookmarkService.getAllBookmarks(),
  );

  const handleRemove = (b: QuranBookmark) => {
    quranBookmarkService.removeBookmark(b.surahNumber, b.ayahNumber);
    setBookmarks((prev) => prev.filter((bk) => bk.id !== b.id));
    toast.success("Bookmark removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Qur&apos;an Bookmarks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your saved ayahs for quick reference.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookmarkCheck className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No bookmarks yet. Open a Surah and tap the bookmark icon on any ayah.
            </p>
            <Link
              href="/quran"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
            >
              Browse Surahs
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((b) => {
            const surah = SURAH_DATA[b.surahNumber - 1];
            return (
              <Card key={b.id} className="transition-all hover:shadow-sm">
                <CardContent className="flex items-start gap-3 py-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <BookOpen className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        {surah?.name ?? `Surah ${b.surahNumber}`}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Ayah {b.ayahNumber}
                      </span>
                    </div>
                    {b.note && (
                      <p className="text-xs text-muted-foreground italic">
                        {b.note}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Saved {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/quran?surah=${b.surahNumber}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")}
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleRemove(b)}
                      aria-label={`Remove bookmark for ${surah?.name} Ayah ${b.ayahNumber}`}
                      className="rounded p-1 text-muted-foreground/50 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
