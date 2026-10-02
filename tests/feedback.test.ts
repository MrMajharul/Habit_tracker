import { describe, expect, it, beforeEach } from "vitest";
import {
  CATEGORY_METADATA,
  SUPPORT_EMAIL,
  buildSupportMailtoLink,
  clearStoredFeedbacks,
  formatDiagnosticsSummary,
  formatFeedbackForClipboard,
  getStoredFeedbacks,
  getSystemDiagnostics,
  saveFeedback,
  type FeedbackSubmission,
  type SystemDiagnostics,
} from "@/services/feedback/feedback-service";

describe("Feedback and Support Service", () => {
  beforeEach(() => {
    clearStoredFeedbacks();
  });

  it("provides valid category metadata for all categories", () => {
    const categories = ["general", "bug", "feature", "correction", "question"] as const;
    for (const cat of categories) {
      const meta = CATEGORY_METADATA[cat];
      expect(meta).toBeDefined();
      expect(meta.label).toBeTruthy();
      expect(meta.labelBn).toBeTruthy();
      expect(meta.defaultPrefix).toContain("[");
    }
  });

  it("gathers system diagnostics safely", () => {
    const diag = getSystemDiagnostics();
    expect(diag).toBeDefined();
    expect(diag.appVersion).toBe("0.1.0");
    expect(diag.timestamp).toBeTruthy();
  });

  it("formats diagnostics summary correctly", () => {
    const mockDiag: SystemDiagnostics = {
      appVersion: "0.1.0",
      platform: "MacIntel",
      browser: "Chrome",
      os: "macOS",
      screenResolution: "1440x900",
      viewportSize: "1200x800",
      timezone: "Asia/Dhaka",
      language: "en-US",
      online: true,
      syncQueuePending: 0,
      timestamp: "2026-10-01T00:00:00.000Z",
    };

    const summary = formatDiagnosticsSummary(mockDiag);
    expect(summary).toContain("--- System Diagnostics ---");
    expect(summary).toContain("App Version: 0.1.0");
    expect(summary).toContain("Timezone: Asia/Dhaka");
    expect(summary).toContain("Network Status: Online");
  });

  it("saves and retrieves feedback submissions", () => {
    const saved = saveFeedback({
      category: "bug",
      subject: "Test Bug Subject",
      message: "This is a detailed bug description.",
      email: "user@example.com",
      rating: 4,
    });

    expect(saved.id).toBeTruthy();
    expect(saved.category).toBe("bug");
    expect(saved.subject).toBe("Test Bug Subject");
    expect(saved.message).toBe("This is a detailed bug description.");
    expect(saved.createdAt).toBeTruthy();

    const all = getStoredFeedbacks();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(saved.id);
  });

  it("clears stored feedbacks", () => {
    saveFeedback({
      category: "feature",
      subject: "Idea 1",
      message: "More dhikr sounds",
    });

    expect(getStoredFeedbacks().length).toBe(1);
    clearStoredFeedbacks();
    expect(getStoredFeedbacks().length).toBe(0);
  });

  it("builds a valid mailto link with encoded subject and body", () => {
    const mailto = buildSupportMailtoLink({
      category: "bug",
      subject: "Prayer time issue",
      message: "Fajr calculation is off by 2 minutes.",
      userEmail: "test@example.com",
    });

    expect(mailto.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true);
    expect(mailto).toContain(encodeURIComponent("[Bug Report] Prayer time issue"));
    expect(mailto).toContain(encodeURIComponent("Fajr calculation is off by 2 minutes."));
  });

  it("formats feedback for clipboard correctly", () => {
    const feedback: Partial<FeedbackSubmission> = {
      category: "correction",
      subject: "Ayah typo",
      message: "Typo in verse 2",
      rating: 5,
      email: "reader@istiqamaah.app",
    };

    const text = formatFeedbackForClipboard(feedback);
    expect(text).toContain("[Istiqamaah Feedback / Support]");
    expect(text).toContain("Ayah typo");
    expect(text).toContain("Typo in verse 2");
    expect(text).toContain("⭐⭐⭐⭐⭐ (5/5)");
  });
});
