import { Suspense } from "react";
import { QuranPageClient } from "@/components/quran/quran-page-client";

import QuranLoading from "./loading";

export const metadata = { title: "Qur'an" };

export default function QuranPage() {
  return (
    <Suspense fallback={<QuranLoading />}>
      <QuranPageClient />
    </Suspense>
  );
}
