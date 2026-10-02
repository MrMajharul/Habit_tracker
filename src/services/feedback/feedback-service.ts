/**
 * Feedback and Support Service
 * Handles user feedback collection, diagnostic telemetry (privacy-respecting),
 * offline persistence, and support mailto generation.
 */

import { getOfflineQueue } from "@/lib/offline/offline-sync-queue";

export type FeedbackCategory =
  | "general"
  | "bug"
  | "feature"
  | "correction"
  | "question";

export interface SystemDiagnostics {
  appVersion: string;
  platform: string;
  browser: string;
  os: string;
  screenResolution: string;
  viewportSize: string;
  timezone: string;
  language: string;
  online: boolean;
  syncQueuePending: number;
  timestamp: string;
}

export interface FeedbackSubmission {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  email?: string;
  rating?: number;
  diagnostics?: SystemDiagnostics;
  createdAt: string;
}

const FEEDBACK_STORAGE_KEY = "istiqamaah_user_feedback";
export const SUPPORT_EMAIL = "support.istiqamaah@gmail.com";

export const CATEGORY_METADATA: Record<
  FeedbackCategory,
  {
    label: string;
    labelBn: string;
    description: string;
    icon: string;
    defaultPrefix: string;
  }
> = {
  general: {
    label: "General Feedback",
    labelBn: "সাধারণ মতামত",
    description: "Share your overall impressions or thoughts on the app",
    icon: "MessageSquare",
    defaultPrefix: "[Feedback]",
  },
  bug: {
    label: "Bug / Issue Report",
    labelBn: "বাগ বা সমস্যা রিপোর্ট",
    description: "Report something that is broken, misaligned, or behaving unexpectedly",
    icon: "Bug",
    defaultPrefix: "[Bug Report]",
  },
  feature: {
    label: "Feature Request",
    labelBn: "নতুন ফিচারের প্রস্তাবনা",
    description: "Suggest a feature or enhancement you would love to see",
    icon: "Lightbulb",
    defaultPrefix: "[Feature Request]",
  },
  correction: {
    label: "Qur'an / Hadith Correction",
    labelBn: "কুরআন/হাদিস বা অনুবাদ সংশোধন",
    description: "Report a typographical, transliteration, or translation issue in sacred texts",
    icon: "BookOpen",
    defaultPrefix: "[Text Correction]",
  },
  question: {
    label: "Question / Support",
    labelBn: "সহায়তা বা জিজ্ঞাসা",
    description: "Need help using Istiqamaah or understanding its features",
    icon: "HelpCircle",
    defaultPrefix: "[Support Question]",
  },
};

/**
 * Gather safe, non-sensitive device and environment diagnostics to assist
 * debugging and support queries.
 */
export function getSystemDiagnostics(): SystemDiagnostics {
  if (typeof window === "undefined") {
    return {
      appVersion: "0.1.0",
      platform: "SSR",
      browser: "Server",
      os: "Server",
      screenResolution: "N/A",
      viewportSize: "N/A",
      timezone: "UTC",
      language: "en",
      online: true,
      syncQueuePending: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const userAgent = navigator.userAgent;
  let browser = "Unknown";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome/")) browser = "Chrome";
  else if (userAgent.includes("Safari/")) browser = "Safari";

  let os = "Unknown";
  if (/iPad|iPhone|iPod/.test(userAgent)) os = "iOS";
  else if (/Android/.test(userAgent)) os = "Android";
  else if (/Macintosh|Mac OS X/.test(userAgent)) os = "macOS";
  else if (/Windows NT/.test(userAgent)) os = "Windows";
  else if (/Linux/.test(userAgent)) os = "Linux";

  const queue = getOfflineQueue();

  return {
    appVersion: "0.1.0",
    platform: navigator.platform || "Web",
    browser,
    os,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    language: navigator.language || "en",
    online: navigator.onLine,
    syncQueuePending: queue.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats system diagnostics into a concise string suitable for emails or logs.
 */
export function formatDiagnosticsSummary(diag: SystemDiagnostics): string {
  return [
    "--- System Diagnostics ---",
    `App Version: ${diag.appVersion}`,
    `OS / Platform: ${diag.os} (${diag.platform})`,
    `Browser: ${diag.browser}`,
    `Screen / Viewport: ${diag.screenResolution} (Window: ${diag.viewportSize})`,
    `Timezone: ${diag.timezone}`,
    `Language: ${diag.language}`,
    `Network Status: ${diag.online ? "Online" : "Offline"}`,
    `Pending Sync Queue: ${diag.syncQueuePending} items`,
    `Timestamp: ${diag.timestamp}`,
    "--------------------------",
  ].join("\n");
}

let memoryFeedbackStore: FeedbackSubmission[] = [];

/**
 * Read all locally saved feedback items.
 */
export function getStoredFeedbacks(): FeedbackSubmission[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return [...memoryFeedbackStore];
  }
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : memoryFeedbackStore;
  } catch {
    return [...memoryFeedbackStore];
  }
}

/**
 * Persist feedback locally so it's safely kept even offline.
 */
export function saveFeedback(
  data: Omit<FeedbackSubmission, "id" | "createdAt">
): FeedbackSubmission {
  const newSubmission: FeedbackSubmission = {
    ...data,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  memoryFeedbackStore = [newSubmission, ...memoryFeedbackStore].slice(0, 50);

  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const current = getStoredFeedbacks();
      const updated = [newSubmission, ...current.filter(f => f.id !== newSubmission.id)].slice(0, 50); // keep last 50
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }
  }

  return newSubmission;
}

/**
 * Clear locally stored feedback log.
 */
export function clearStoredFeedbacks(): void {
  memoryFeedbackStore = [];
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Generates a prefilled mailto URL for direct email support.
 */
export function buildSupportMailtoLink(params: {
  category: FeedbackCategory;
  subject: string;
  message: string;
  userEmail?: string;
  diagnostics?: SystemDiagnostics;
}): string {
  const meta = CATEGORY_METADATA[params.category];
  const subjectLine = `${meta.defaultPrefix} ${params.subject.trim() || meta.label}`;

  const bodyParts = [
    `Assalamu Alaikum / Hello Istiqamaah Team,`,
    ``,
    `Category: ${meta.label} (${meta.labelBn})`,
    params.userEmail ? `User Contact Email: ${params.userEmail}` : "",
    ``,
    `--- Message ---`,
    params.message.trim(),
    ``,
    params.diagnostics ? formatDiagnosticsSummary(params.diagnostics) : "",
  ].filter((p) => p !== undefined);

  const bodyContent = bodyParts.join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subjectLine
  )}&body=${encodeURIComponent(bodyContent)}`;
}

/**
 * Formats feedback submission into ready-to-copy clipboard text.
 */
export function formatFeedbackForClipboard(
  data: Partial<FeedbackSubmission>
): string {
  const meta = data.category ? CATEGORY_METADATA[data.category] : null;
  const parts: string[] = [
    `[Istiqamaah Feedback / Support]`,
    meta ? `Category: ${meta.label} (${meta.labelBn})` : "",
    data.rating ? `Rating: ${"⭐".repeat(data.rating)} (${data.rating}/5)` : "",
    data.subject ? `Subject: ${data.subject}` : "",
    data.email ? `From: ${data.email}` : "",
    ``,
    `Message:`,
    data.message || "(No message provided)",
    ``,
    data.diagnostics ? formatDiagnosticsSummary(data.diagnostics) : "",
  ].filter(Boolean);

  return parts.join("\n");
}
