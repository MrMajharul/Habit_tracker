import { Bookmark, ScrollText, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hadithService } from "@/services/hadith/hadith-service";
import type { HadithRecord } from "@/services/hadith/types";

export const metadata = { title: "Hadith" };

function HadithCard({ hadith }: { hadith: HadithRecord }) {
  return (
    <Card className="border-gold/20 bg-gradient-to-br from-card to-gold/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollText className="size-4 text-gold" />
            {hadith.source}
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[10px]">#{hadith.hadithNumber}</Badge>
            {hadith.grade && (
              <Badge variant="secondary" className="text-[10px]">{hadith.grade}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p
          className="text-right font-serif text-xl leading-loose text-muted-foreground"
          dir="rtl"
          lang="ar"
        >
          {hadith.arabicText}
        </p>

        <blockquote className="border-l-2 border-gold/40 pl-4 text-sm leading-relaxed">
          &ldquo;{hadith.englishTranslation}&rdquo;
        </blockquote>

        {hadith.banglaTranslation && (
          <p className="text-sm leading-relaxed text-muted-foreground" lang="bn">
            {hadith.banglaTranslation}
          </p>
        )}

        {hadith.topic && (
          <div>
            <Badge variant="secondary" className="text-[10px]">{hadith.topic}</Badge>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {hadith.sourceUrl ? (
            <a
              href={hadith.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              View at source ↗
            </a>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              aria-label="Bookmark hadith"
              className="rounded p-1.5 text-muted-foreground/70 hover:text-foreground"
            >
              <Bookmark className="size-4" />
            </button>
            <button
              aria-label="Share hadith"
              className="rounded p-1.5 text-muted-foreground/70 hover:text-foreground"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function HadithPage() {
  const hadiths = await hadithService.getAllHadith();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hadith</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified Hadith from source-controlled datasets. Never AI-generated.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Source integrity:</strong> All Hadith displayed here are from verified collections with proper attribution. Content is never AI-generated. More Hadith and bookmarking support arrives in Phase 4.
      </div>

      <div className="space-y-4">
        {hadiths.map((hadith) => (
          <HadithCard key={hadith.id} hadith={hadith} />
        ))}
      </div>

      {hadiths.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <ScrollText className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No verified Hadith available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
