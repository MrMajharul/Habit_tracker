import { format } from "date-fns";

export function formatGregorianDate(date: Date): string {
  return format(date, "EEEE, d MMMM");
}

export function formatHijriDate(date: Date, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Hijri date unavailable";
  }
}

export function formatPrayerTime(date: Date): string {
  return format(date, "h:mm a");
}

export function formatCountdown(target: Date, now = new Date()): string {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${String(minutes).padStart(2, "0")}m remaining`;
}
