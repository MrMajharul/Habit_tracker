"use client";

import { useEffect } from "react";
import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { syncActiveUser } from "@/lib/cache/user-cache";

export function AuthStateSync() {
  useEffect(() => {
    if (!isSupabaseConfigured || isDevAuthBypass) return;

    try {
      const supabase = createClient();

      // Check current user upon hydration
      supabase.auth.getUser().then(({ data: { user } }) => {
        syncActiveUser(user ? user.id : null);
      });

      // Listen for auth state transitions (sign in, sign out, switch account)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        syncActiveUser(session?.user ? session.user.id : null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (e) {
      console.warn("Failed to attach auth state sync listener:", e);
    }
  }, []);

  return null;
}
