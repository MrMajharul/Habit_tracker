// ─── Money Utility Functions ─────────────────────────────────────────────────
// Pure functions for currency formatting, amount parsing, and financial math.
// All amounts are integers in minor units (paisa for BDT: 100 paisa = 1 taka).
// ─────────────────────────────────────────────────────────────────────────────

import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, type CurrencyConfig } from "@/types/money";

/**
 * Get currency configuration, falling back to default (BDT).
 */
export function getCurrencyConfig(code: string): CurrencyConfig {
  return SUPPORTED_CURRENCIES[code] ?? SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Convert a user-entered decimal string (e.g. "42500.50") to minor units (4250050).
 * Returns 0 for invalid input. Rounds to avoid floating-point drift.
 */
export function parseAmountToMinor(input: string, currencyCode: string = DEFAULT_CURRENCY): number {
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  const config = getCurrencyConfig(currencyCode);
  const multiplier = Math.pow(10, config.minorUnits);
  return Math.round(parsed * multiplier);
}

/**
 * Convert minor units to a major-unit number for display (e.g. 4250050 → 42500.50).
 */
export function minorToMajor(amount: number, currencyCode: string = DEFAULT_CURRENCY): number {
  const config = getCurrencyConfig(currencyCode);
  return amount / Math.pow(10, config.minorUnits);
}

/**
 * Format minor units as a localized currency string.
 * Example: formatMoney(4250000, "BDT") → "৳42,500.00"
 */
export function formatMoney(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: { compact?: boolean; showSign?: boolean },
): string {
  const config = getCurrencyConfig(currencyCode);
  const major = minorToMajor(amount, currencyCode);
  const abs = Math.abs(major);

  let formatted: string;
  if (options?.compact && abs >= 100000) {
    // Compact format for large numbers
    if (abs >= 10000000) {
      formatted = `${config.symbol}${(abs / 10000000).toFixed(1)}Cr`;
    } else if (abs >= 100000) {
      formatted = `${config.symbol}${(abs / 100000).toFixed(1)}L`;
    } else {
      formatted = `${config.symbol}${abs.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  } else {
    formatted = `${config.symbol}${abs.toLocaleString(config.locale || "en-IN", {
      minimumFractionDigits: config.minorUnits,
      maximumFractionDigits: config.minorUnits,
    })}`;
  }

  if (amount < 0) {
    formatted = `-${formatted}`;
  }

  if (options?.showSign && amount > 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
}

/**
 * Format a display-friendly amount for input fields (no currency symbol).
 */
export function formatAmountForInput(minorUnits: number, currencyCode: string = DEFAULT_CURRENCY): string {
  if (minorUnits === 0) return "";
  const config = getCurrencyConfig(currencyCode);
  const major = minorUnits / Math.pow(10, config.minorUnits);
  // Use fixed decimal places, strip trailing zeros
  const str = major.toFixed(config.minorUnits);
  // Remove .00 for whole numbers
  if (str.endsWith(".00")) return str.slice(0, -3);
  if (str.endsWith("0") && str.includes(".")) return str.slice(0, -1);
  return str;
}

/**
 * Validate that an amount string is a valid positive number.
 */
export function isValidAmount(input: string): boolean {
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return !isNaN(parsed) && parsed > 0 && isFinite(parsed);
}

/**
 * Check if accounts use different currencies and cannot be aggregated.
 */
export function hasMixedCurrencies(currencies: string[]): boolean {
  const unique = new Set(currencies);
  return unique.size > 1;
}

/**
 * Get the current month as "YYYY-MM".
 */
export function getCurrentMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Format a month string "YYYY-MM" as a readable label.
 */
export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Get the date range for a given month "YYYY-MM" → [startDate, endDate].
 */
export function getMonthDateRange(monthStr: string): { startDate: string; endDate: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

/**
 * Calculate the next occurrence date for a recurring transaction.
 */
export function computeNextDueDate(
  currentDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
): string {
  const d = new Date(currentDate + "T12:00:00");
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Get today's date as "YYYY-MM-DD" in local timezone.
 */
export function getLocalToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Account type display labels.
 */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  mobile_wallet: "Mobile Wallet",
  savings: "Savings",
  other: "Other",
};

export const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  cash: "💵",
  bank: "🏦",
  mobile_wallet: "📱",
  savings: "🐖",
  other: "💼",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
