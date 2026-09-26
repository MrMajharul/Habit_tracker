import { Suspense } from "react";
import { QuranPageClient } from "@/components/quran/quran-page-client";

export const metadata = { title: "Qur'an" };

export default function QuranPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <QuranPageClient />
    </Suspense>
  );
}
