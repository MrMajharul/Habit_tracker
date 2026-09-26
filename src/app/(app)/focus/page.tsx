import { Suspense } from "react";
import { FocusPageClient } from "@/components/focus/focus-page-client";

export const metadata = { title: "Focus Timer" };

export default function FocusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <FocusPageClient />
    </Suspense>
  );
}
