"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector } from "./period-selector";
import {
  buildCsvFiles,
  buildJsonExport,
  buildPdfReport,
  EXPORT_CATEGORIES,
} from "@/services/analytics/analytics-export-service";
import { analyticsService } from "@/services/analytics/analytics-service";
import type {
  AnalyticsPeriodPreset,
  ExportCategory,
} from "@/services/analytics/analytics-types";
import { ANALYTICS_PRIVACY_NOTICE } from "@/services/analytics/analytics-types";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<ExportCategory, string> = {
  prayer: "Salah & Prayer Logs",
  habits: "Habits & Logs",
  tasks: "Tasks & Study",
  focus: "Focus Sessions",
  quran: "Qur'an Sessions",
  dhikr: "Dhikr Activity",
  goals: "Spiritual & Productivity Goals",
  reflections: "Personal Reflections",
  summaries: "Analytics Summaries",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AnalyticsExportClient() {
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>([...EXPORT_CATEGORIES]);
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const timezone = useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      } catch {
        return "UTC";
      }
    }
    return "UTC";
  }, []);

  const toggleCategory = (cat: ExportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const selectAll = () => setSelectedCategories([...EXPORT_CATEGORIES]);
  const deselectAll = () => setSelectedCategories([]);

  const getAnalyticsData = async () => {
    return await analyticsService.loadAnalyticsSummary({
      timezone,
      preset,
      customStart: preset === "custom" ? customStart : undefined,
      customEnd: preset === "custom" ? customEnd : undefined,
    });
  };

  const handleExportJson = async () => {
    setDownloading(true);
    setStatusMessage("Generating JSON export...");
    try {
      const { summary, snapshot } = await getAnalyticsData();
      const { filename, body } = buildJsonExport(snapshot, summary, {
        categories: selectedCategories,
        range: summary.range,
      });
      const blob = new Blob([body], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, filename);
      setStatusMessage(`Downloaded ${filename}`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to generate JSON export.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCsv = async (singleCategory?: ExportCategory) => {
    setDownloading(true);
    setStatusMessage("Generating CSV files...");
    try {
      const { summary, snapshot } = await getAnalyticsData();
      const files = buildCsvFiles(snapshot, {
        categories: singleCategory ? [singleCategory] : selectedCategories,
        range: summary.range,
      });

      if (files.length === 0) {
        setStatusMessage("No data available for selected category.");
        return;
      }

      for (const file of files) {
        const blob = new Blob([file.body], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, file.filename);
      }
      setStatusMessage(`Downloaded ${files.length} CSV file${files.length === 1 ? "" : "s"}.`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to generate CSV export.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportPdf = async () => {
    setDownloading(true);
    setStatusMessage("Generating PDF report...");
    try {
      const { summary } = await getAnalyticsData();
      const { filename, body } = buildPdfReport(summary);
      const blob = new Blob([body as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, filename);
      setStatusMessage(`Downloaded ${filename}`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to generate PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back and Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/analytics"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-1 gap-1 text-muted-foreground",
            )}
          >
            <ArrowLeft className="size-4" />
            <span>Back to Analytics</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Export Your Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Export your complete personal records in open, structured formats.
          </p>
        </div>
      </div>

      {/* Prominent Privacy Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Privacy Notice</p>
          <p className="text-xs leading-relaxed opacity-90">{ANALYTICS_PRIVACY_NOTICE}</p>
          <p className="text-[11px] opacity-80">
            Exported files are generated locally in your browser. No personal data is transmitted to third-party tracking services.
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. Select Date Period</CardTitle>
          <CardDescription className="text-xs">
            Filter the historical scope of exported records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeriodSelector
            preset={preset}
            customStart={customStart}
            customEnd={customEnd}
            onPresetChange={setPreset}
            onCustomChange={(start, end) => {
              setCustomStart(start);
              setCustomEnd(end);
            }}
          />
        </CardContent>
      </Card>

      {/* Categories Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">2. Select Categories</CardTitle>
              <CardDescription className="text-xs">
                Choose which modules to include in the export bundle.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="xs" onClick={selectAll}>
                Select All
              </Button>
              <Button type="button" variant="outline" size="xs" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EXPORT_CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-left text-sm transition-colors",
                    isChecked
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border",
                      isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border/80",
                    )}
                  >
                    {isChecked && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3. Choose Format &amp; Download</CardTitle>
          <CardDescription className="text-xs">
            Download JSON, spreadsheet-compatible CSV, or a formatted PDF weekly report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* JSON Card */}
            <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode className="size-5 text-primary" />
                  <h3 className="font-semibold text-sm">JSON Format</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete structured export including metadata, summaries, and raw records.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleExportJson}
                disabled={downloading || selectedCategories.length === 0}
                className="w-full gap-1.5"
                size="sm"
              >
                <Download className="size-3.5" />
                <span>Download JSON</span>
              </Button>
            </div>

            {/* CSV Card */}
            <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-5 text-emerald" />
                  <h3 className="font-semibold text-sm">CSV Datasets</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Excel &amp; Sheets compatible with full UTF-8 Bengali &amp; Unicode support.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExportCsv()}
                disabled={downloading || selectedCategories.length === 0}
                className="w-full gap-1.5"
                size="sm"
              >
                <Download className="size-3.5" />
                <span>Download All CSV</span>
              </Button>
            </div>

            {/* PDF Report Card */}
            <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-blue-500" />
                  <h3 className="font-semibold text-sm">PDF Report</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Clean, minimalist personal report of your activity and reflections.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPdf}
                disabled={downloading}
                className="w-full gap-1.5"
                size="sm"
              >
                <Download className="size-3.5" />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>

          {statusMessage && (
            <div className="rounded-lg bg-muted/60 p-2.5 text-center text-xs text-muted-foreground">
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
