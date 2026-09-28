import type {
  AnalyticsSnapshot,
  AnalyticsSummary,
  ExportCategory,
  ExportSelection,
  JsonExportDocument,
} from "./analytics-types";
import { ANALYTICS_PRIVACY_NOTICE } from "./analytics-types";
import { formatMinutes, formatRangeLabel } from "./analytics-period";
import { prayerNameLabel } from "./analytics-aggregator";

const ALL_CATEGORIES: ExportCategory[] = [
  "prayer",
  "habits",
  "tasks",
  "focus",
  "quran",
  "dhikr",
  "goals",
  "reflections",
  "summaries",
];

export function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  let text = String(value);

  // Guard against spreadsheet formula injection (CWE-1236 / CSV Injection)
  // If a string starts with =, +, -, @, tab, or carriage return, prefix with a single quote (')
  if (typeof value === "string") {
    const trimmed = text.trimStart();
    if (trimmed.length > 0 && /^[=+\-@\t\r]/.test(trimmed)) {
      text = `'${text}`;
    }
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const bom = "\uFEFF";
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return `${bom}${lines.join("\r\n")}\r\n`;
}

function stamp(dateStr: string): string {
  return dateStr;
}

export function exportFileName(kind: string, today: string, extension: string): string {
  return `istiqamaah-${kind}-${today}.${extension}`;
}

export function buildJsonExport(
  snapshot: AnalyticsSnapshot,
  summary: AnalyticsSummary,
  selection: ExportSelection,
): { filename: string; body: string; document: JsonExportDocument } {
  const categories = selection.categories.length ? selection.categories : ALL_CATEGORIES;
  const include = (category: ExportCategory) => categories.includes(category);

  const document: JsonExportDocument = {
    metadata: {
      product: "Istiqamaah",
      tagline: "Balance your Deen. Organize your life.",
      exportedAt: snapshot.generatedAt,
      timezone: selection.range.timezone,
      dateRange: {
        startDate: selection.range.startDate,
        endDate: selection.range.endDate,
        preset: selection.range.preset,
      },
      privacyNotice: ANALYTICS_PRIVACY_NOTICE,
    },
    summaries: summary,
    records: {},
  };

  const inRange = (date: string) => date >= selection.range.startDate && date <= selection.range.endDate;

  if (include("prayer")) {
    document.records.prayerLogs = snapshot.prayerLogs.filter((l) => inRange(l.date));
  }
  if (include("habits")) {
    document.records.habitLogs = snapshot.habitLogs.filter((l) => inRange(l.date));
  }
  if (include("tasks")) {
    document.records.tasks = snapshot.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      subjectId: task.subjectId,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      estimatedMinutes: task.estimatedMinutes,
    }));
  }
  if (include("focus")) {
    document.records.focusSessions = snapshot.focusSessions;
  }
  if (include("quran")) {
    document.records.quranSessions = snapshot.quranSessions.filter((s) => inRange(s.readingDate));
  }
  if (include("dhikr")) {
    document.records.dhikrSessions = snapshot.dhikrSessions;
  }
  if (include("goals")) {
    document.records.goals = [...snapshot.spiritualGoals, ...snapshot.productivityGoals];
  }
  if (include("reflections")) {
    document.records.reflections = snapshot.reflections
      .filter((item) => inRange(item.reflectionDate))
      .map((item) => ({
        reflectionDate: item.reflectionDate,
        mood: item.mood,
        moodRating: item.moodRating,
        tomorrowPriority: item.tomorrowPriority,
        hasAchievements: Boolean(item.achievements),
        hasImprovements: Boolean(item.improvements),
        achievements: item.achievements ?? undefined,
        improvements: item.improvements ?? undefined,
      }));
  }

  const body = JSON.stringify(document, null, 2);
  return {
    filename: exportFileName("analytics", stamp(selection.range.today), "json"),
    body,
    document,
  };
}

export function buildCsvFiles(
  snapshot: AnalyticsSnapshot,
  selection: ExportSelection,
): Array<{ filename: string; body: string; category: ExportCategory }> {
  const categories = selection.categories.length ? selection.categories : ALL_CATEGORIES;
  const today = selection.range.today;
  const inRange = (date: string) => date >= selection.range.startDate && date <= selection.range.endDate;
  const files: Array<{ filename: string; body: string; category: ExportCategory }> = [];

  if (categories.includes("prayer")) {
    files.push({
      category: "prayer",
      filename: exportFileName("prayer", today, "csv"),
      body: toCsv(
        ["date", "prayer", "status"],
        snapshot.prayerLogs.filter((l) => inRange(l.date)).map((l) => [l.date, l.prayer, l.status]),
      ),
    });
  }
  if (categories.includes("habits")) {
    files.push({
      category: "habits",
      filename: exportFileName("habits", today, "csv"),
      body: toCsv(
        ["date", "habit_id", "habit_name", "completed"],
        snapshot.habitLogs
          .filter((l) => inRange(l.date))
          .map((l) => [
            l.date,
            l.habitId,
            snapshot.habits.find((h) => h.id === l.habitId)?.name ?? "",
            l.completed,
          ]),
      ),
    });
  }
  if (categories.includes("tasks")) {
    files.push({
      category: "tasks",
      filename: exportFileName("tasks", today, "csv"),
      body: toCsv(
        ["title", "status", "due_date", "completed_at", "created_at"],
        snapshot.tasks.map((t) => [t.title, t.status, t.dueDate, t.completedAt, t.createdAt]),
      ),
    });
  }
  if (categories.includes("focus")) {
    files.push({
      category: "focus",
      filename: exportFileName("focus", today, "csv"),
      body: toCsv(
        ["started_at", "actual_minutes", "planned_minutes", "status", "subject"],
        snapshot.focusSessions.map((s) => [
          s.startedAt,
          s.actualMinutes,
          s.plannedMinutes,
          s.status,
          s.subjectName ?? "",
        ]),
      ),
    });
  }
  if (categories.includes("quran")) {
    files.push({
      category: "quran",
      filename: exportFileName("quran", today, "csv"),
      body: toCsv(
        ["reading_date", "surah_number", "start_ayah", "end_ayah", "minutes_read"],
        snapshot.quranSessions
          .filter((s) => inRange(s.readingDate))
          .map((s) => [s.readingDate, s.surahNumber, s.startAyah, s.endAyah, s.minutesRead]),
      ),
    });
  }
  if (categories.includes("dhikr")) {
    files.push({
      category: "dhikr",
      filename: exportFileName("dhikr", today, "csv"),
      body: toCsv(
        ["started_at", "dhikr_id", "completed_count", "target_count", "status"],
        snapshot.dhikrSessions.map((s) => [s.startedAt, s.dhikrId, s.completedCount, s.targetCount, s.status]),
      ),
    });
  }
  if (categories.includes("goals")) {
    files.push({
      category: "goals",
      filename: exportFileName("goals", today, "csv"),
      body: toCsv(
        ["title", "kind", "current_value", "target_value", "completed"],
        [
          ...snapshot.spiritualGoals.map((g) => [g.title, "spiritual", g.currentValue, g.targetValue, g.isCompleted]),
          ...snapshot.productivityGoals.map((g) => [g.title, "productivity", g.currentValue, g.targetValue, g.isCompleted]),
        ],
      ),
    });
  }

  return files;
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function latinize(text: string): string {
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
}

export function buildPdfReport(summary: AnalyticsSummary): { filename: string; body: Uint8Array } {
  const lines = [
    "ISTIQAMAAH",
    "Personal Weekly Report",
    "",
    `Period: ${formatRangeLabel(summary.range.startDate, summary.range.endDate)}`,
    `Timezone: ${summary.range.timezone}`,
    "",
    "Overview",
    `Prayer activity: ${summary.prayer.completed}/${summary.prayer.possible}`,
    `Habits: ${summary.habits.completionRate}% completion`,
    `Qur'an: ${formatMinutes(summary.quran.minutesRead)}, ${summary.quran.ayahsRead} ayahs`,
    `Dhikr activity: ${summary.dhikr.completedSessions} completed sessions`,
    `Study & work: ${summary.tasks.completed} tasks completed`,
    `Focus: ${formatMinutes(summary.focus.totalMinutes)}`,
    `Goals completed: spiritual ${summary.goals.spiritualCompleted}, productivity ${summary.goals.productivityCompleted}`,
    "",
    "Prayer Activity",
    ...summary.prayer.perPrayer.map(
      (item) => `${prayerNameLabel(item.prayer)} ${item.completed} / ${item.possible}`,
    ),
    "",
    "Personal Reflection",
    `Reflection days: ${summary.reflections.reflectionDays}`,
    summary.weeklyReview.reflectionPrompt,
    "",
    ANALYTICS_PRIVACY_NOTICE,
  ];

  const contentLines = lines.map((line, index) => {
    const y = 780 - index * 16;
    return `BT /F1 11 Tf 48 ${y} Td (${pdfEscape(latinize(line))}) Tj ET`;
  });
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let offset = "%PDF-1.4\n".length;
  const offsets = [0];
  const chunks: string[] = ["%PDF-1.4\n"];
  for (const object of objects) {
    offsets.push(offset);
    chunks.push(`${object}\n`);
    offset += object.length + 1;
  }
  const xrefStart = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const pdf = `${chunks.join("")}${xref}${trailer}`;
  return {
    filename: exportFileName("weekly-report", summary.range.today, "pdf"),
    body: new TextEncoder().encode(pdf),
  };
}

export const EXPORT_CATEGORIES = ALL_CATEGORIES;
