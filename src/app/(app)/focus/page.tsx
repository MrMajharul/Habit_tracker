import { Suspense } from "react";
import { FocusPageClient } from "@/components/focus/focus-page-client";

import FocusLoading from "./loading";

export const metadata = { title: "Focus Timer" };

export default function FocusPage() {
  return (
    <Suspense fallback={<FocusLoading />}>
      <FocusPageClient />
    </Suspense>
  );
}
