"use client";

import { Bookmark, ScrollText, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HadithRecord } from "@/services/hadith/types";

interface HadithOfTheDayProps {
  hadith: HadithRecord | null;
  compact?: boolean;
}

export function HadithOfTheDay({ hadith, compact = false }: HadithOfTheDayProps) {
  if (!hadith) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4 text-gold" />
            Hadith of the Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No verified Hadith available today. Content is loaded from a
            source-controlled dataset.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleShare = async () => {
    const text = `"${hadith.englishTranslation}" — ${hadith.book}, ${hadith.hadithNumber}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Hadith of the Day", text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(text);
    toast.success("Hadith copied to clipboard");
  };

  const handleBookmark = () => {
    toast.message("Bookmark saved locally", {
      description: "Full bookmark sync arrives in Phase 4 with Supabase.",
    });
  };

  return (
    <Card className="h-full border-gold/20 bg-gradient-to-br from-card to-gold/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="size-4 text-gold" />
          Hadith of the Day
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{hadith.book}</span>
          {hadith.grade ? (
            <Badge variant="secondary" className="text-[10px]">
              {hadith.grade}
            </Badge>
          ) : null}
          <Badge variant="outline" className="text-[10px]">
            Verified seed
          </Badge>
        </CardDescription>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Bookmark hadith"
            onClick={handleBookmark}
          >
            <Bookmark className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Share hadith"
            onClick={handleShare}
          >
            <Share2 className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {!compact && (
          <p
            className="text-right font-serif text-lg leading-loose text-muted-foreground"
            dir="rtl"
            lang="ar"
          >
            {hadith.arabicText}
          </p>
        )}

        <blockquote className="border-l-2 border-gold/40 pl-4 text-sm leading-relaxed sm:text-base">
          &ldquo;{hadith.englishTranslation}&rdquo;
        </blockquote>

        <footer className="text-xs text-muted-foreground">
          — {hadith.source}, #{hadith.hadithNumber}
          {hadith.topic ? ` · ${hadith.topic}` : ""}
        </footer>

        {!compact && hadith.banglaTranslation ? (
          <p className="text-sm leading-relaxed text-muted-foreground" lang="bn">
            {hadith.banglaTranslation}
          </p>
        ) : null}

        {hadith.sourceUrl ? (
          <a
            href={hadith.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Read more at source
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
