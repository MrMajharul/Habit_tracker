import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { addCalendarDays, formatInstantInTimeZone, resolveAnalyticsPeriod } from "./analytics-period";
import { aggregateAnalytics } from "./analytics-aggregator";
import {
  fetchRemoteSnapshot,
  hydrateLocalStudyData,
  loadLocalSnapshot,
  mergeSnapshots,
  readSnapshotCache,
  saveSnapshotCache,
} from "./analytics-query-service";
import type {
  AnalyticsPeriodPreset,
  AnalyticsSnapshot,
  AnalyticsSummary,
} from "./analytics-types";

export interface LoadAnalyticsOptions {
  timezone: string;
  preset: AnalyticsPeriodPreset;
  customStart?: string;
  customEnd?: string;
  now?: Date;
  userId?: string;
  snapshot?: AnalyticsSnapshot;
}

const memo = new Map<string, { summary: AnalyticsSummary; expires: number }>();

function memoKey(options: LoadAnalyticsOptions, snapshotAt: string): string {
  return [
    options.timezone,
    options.preset,
    options.customStart ?? "",
    options.customEnd ?? "",
    snapshotAt,
  ].join("|");
}

export function buildAnalyticsFromSnapshot(
  snapshot: AnalyticsSnapshot,
  options: Omit<LoadAnalyticsOptions, "snapshot">,
): AnalyticsSummary {
  const range = resolveAnalyticsPeriod({
    preset: options.preset,
    timezone: options.timezone,
    now: options.now ?? new Date(snapshot.generatedAt),
    customStart: options.customStart,
    customEnd: options.customEnd,
  });
  const key = memoKey(options, snapshot.generatedAt);
  const cached = memo.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.summary;
  }
  const summary = aggregateAnalytics(snapshot, range);
  memo.set(key, { summary, expires: Date.now() + 30_000 });
  return summary;
}

export async function loadAnalyticsSummary(options: LoadAnalyticsOptions): Promise<{
  summary: AnalyticsSummary;
  snapshot: AnalyticsSnapshot;
  fromCache: boolean;
}> {
  if (options.snapshot) {
    return {
      summary: buildAnalyticsFromSnapshot(options.snapshot, options),
      snapshot: options.snapshot,
      fromCache: false,
    };
  }

  let userId = options.userId;
  if (!userId && isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Ignore
    }
  }

  const now = options.now ?? new Date();
  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  const local = loadLocalSnapshot({
    userId,
    timezone: options.timezone,
    now,
  });
  const hydrated = await hydrateLocalStudyData(local);

  if (!online) {
    const cached = readSnapshotCache();
    const snapshot = cached?.snapshot ?? hydrated;
    const summary = buildAnalyticsFromSnapshot(snapshot, options);
    summary.isStale = true;
    summary.lastUpdatedAt = cached?.savedAt ?? snapshot.generatedAt;
    return { summary, snapshot, fromCache: true };
  }

  const today = formatInstantInTimeZone(now, options.timezone);
  const remote = userId
    ? await fetchRemoteSnapshot({
        userId,
        timezone: options.timezone,
        startDate: addCalendarDays(today, -365),
        endDate: today,
      })
    : null;

  const snapshot = mergeSnapshots(hydrated, remote);
  saveSnapshotCache(snapshot);
  return {
    summary: buildAnalyticsFromSnapshot(snapshot, options),
    snapshot,
    fromCache: false,
  };
}

export function clearAnalyticsMemo(): void {
  memo.clear();
}

export const analyticsService = {
  loadAnalyticsSummary,
  buildAnalyticsFromSnapshot,
  clearAnalyticsMemo,
};
