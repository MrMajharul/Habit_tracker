import type { AnalyticsDateRange, AnalyticsPeriodPreset } from "./analytics-types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatInstantInTimeZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

export function compareDateStr(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function enumerateDates(startDate: string, endDate: string): string[] {
  if (compareDateStr(startDate, endDate) > 0) return [];
  const dates: string[] = [];
  let cursor = startDate;
  while (compareDateStr(cursor, endDate) <= 0) {
    dates.push(cursor);
    cursor = addCalendarDays(cursor, 1);
    if (dates.length > 4000) break;
  }
  return dates;
}

export function isoWeekdayMondayFirst(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function startOfIsoWeek(dateStr: string): string {
  const weekday = isoWeekdayMondayFirst(dateStr);
  return addCalendarDays(dateStr, 1 - weekday);
}

export function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function clampRangeToToday(
  startDate: string,
  endDate: string,
  today: string,
): { startDate: string; endDate: string } {
  let start = startDate;
  let end = endDate;
  if (compareDateStr(end, today) > 0) end = today;
  if (compareDateStr(start, today) > 0) start = today;
  if (compareDateStr(start, end) > 0) {
    return { startDate: today, endDate: today };
  }
  return { startDate: start, endDate: end };
}

export function resolveAnalyticsPeriod(options: {
  preset: AnalyticsPeriodPreset;
  timezone: string;
  now?: Date;
  customStart?: string;
  customEnd?: string;
}): AnalyticsDateRange {
  const now = options.now ?? new Date();
  const today = formatInstantInTimeZone(now, options.timezone);
  let startDate = today;
  let endDate = today;

  switch (options.preset) {
    case "today":
      startDate = today;
      endDate = today;
      break;
    case "yesterday":
      startDate = addCalendarDays(today, -1);
      endDate = startDate;
      break;
    case "this_week":
      startDate = startOfIsoWeek(today);
      endDate = today;
      break;
    case "last_week": {
      const thisWeekStart = startOfIsoWeek(today);
      endDate = addCalendarDays(thisWeekStart, -1);
      startDate = startOfIsoWeek(endDate);
      break;
    }
    case "this_month":
      startDate = startOfMonth(today);
      endDate = today;
      break;
    case "last_30_days":
      startDate = addCalendarDays(today, -29);
      endDate = today;
      break;
    case "custom": {
      const customStart = options.customStart ?? today;
      const customEnd = options.customEnd ?? today;
      const clamped = clampRangeToToday(customStart, customEnd, today);
      startDate = clamped.startDate;
      endDate = clamped.endDate;
      break;
    }
  }

  const clamped = clampRangeToToday(startDate, endDate, today);
  const dayCount = enumerateDates(clamped.startDate, clamped.endDate).length;

  return {
    startDate: clamped.startDate,
    endDate: clamped.endDate,
    preset: options.preset,
    timezone: options.timezone,
    today,
    dayCount,
  };
}

export function heatmapRange(today: string): { startDate: string; endDate: string } {
  const start = addCalendarDays(today, -364);
  return { startDate: start, endDate: today };
}

export function weekdayLabel(dateStr: string): string {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return names[isoWeekdayMondayFirst(dateStr) - 1] ?? dateStr;
}

export function formatRangeLabel(startDate: string, endDate: string): string {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  if (startDate === endDate) return start;
  return `${start} – ${end}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[month - 1] ?? month} ${day}, ${year}`;
}

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function calendarDateFromInstant(iso: string, timeZone: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return formatInstantInTimeZone(parsed, timeZone);
}
