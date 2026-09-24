import { redirect } from "next/navigation";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";

export default function HomePage() {
  if (!isSupabaseConfigured && isDevAuthBypass) {
    redirect("/dashboard");
  }

  redirect("/login");
}
