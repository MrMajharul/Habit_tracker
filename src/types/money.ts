// ─── Money Management Types ──────────────────────────────────────────────────
// All monetary amounts are stored as integers in minor units (paisa for BDT).
// 1 BDT = 100 paisa. ৳42,500.00 is stored as 4250000.
// NEVER use floating-point for persisted financial amounts.
// ─────────────────────────────────────────────────────────────────────────────

export type MoneyAccountType = "cash" | "bank" | "mobile_wallet" | "savings" | "other";
export type MoneyTransactionType = "income" | "expense" | "transfer_out" | "transfer_in";
export type MoneyCategoryType = "income" | "expense" | "both";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

// ─── Currency ────────────────────────────────────────────────────────────────

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  minorUnits: number; // e.g. 2 for BDT (100 paisa = 1 taka)
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", minorUnits: 2, locale: "en-BD" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", minorUnits: 2, locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", minorUnits: 2, locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", minorUnits: 2, locale: "en-GB" },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", minorUnits: 2, locale: "ar-SA" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", minorUnits: 2, locale: "ar-AE" },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", minorUnits: 2, locale: "ms-MY" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", minorUnits: 2, locale: "en-IN" },
  PKR: { code: "PKR", symbol: "₨", name: "Pakistani Rupee", minorUnits: 2, locale: "ur-PK" },
} as const;

export const DEFAULT_CURRENCY = "BDT";

// ─── Account ─────────────────────────────────────────────────────────────────

export interface MoneyAccount {
  id: string;
  userId: string;
  name: string;
  type: MoneyAccountType;
  currency: string;
  openingBalance: number; // minor units
  currentBalance: number; // minor units
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface MoneyCategory {
  id: string;
  userId: string | null; // null = system category
  name: string;
  type: MoneyCategoryType;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface MoneyTransaction {
  id: string;
  userId: string;
  accountId: string;
  transactionType: MoneyTransactionType;
  amount: number; // minor units, always positive
  currency: string;
  categoryId: string | null;
  date: string; // "YYYY-MM-DD"
  time: string | null; // "HH:mm:ss"
  description: string;
  notes: string | null;
  transferPairId: string | null;
  recurringId: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields for display
  category?: MoneyCategory;
  account?: MoneyAccount;
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export interface MoneyBudget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number; // minor units
  currency: string;
  month: string; // "YYYY-MM"
  createdAt: string;
  updatedAt: string;
  // Computed
  category?: MoneyCategory;
  spent?: number;
  remaining?: number;
}

// ─── Savings Goal ────────────────────────────────────────────────────────────

export interface MoneySavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number; // minor units
  currentAmount: number; // minor units
  currency: string;
  targetDate: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Recurring Transaction ───────────────────────────────────────────────────

export interface MoneyRecurringTransaction {
  id: string;
  userId: string;
  accountId: string;
  transactionType: "income" | "expense";
  amount: number;
  currency: string;
  categoryId: string | null;
  description: string;
  notes: string | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined
  category?: MoneyCategory;
  account?: MoneyAccount;
}

// ─── Dashboard Summary ──────────────────────────────────────────────────────

export interface MoneyMonthlySummary {
  month: string;
  currency: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  saved: number;
  hasMixedCurrencies: boolean;
  currencySummaries?: Record<string, {
    income: number;
    expense: number;
    balance: number;
  }>;
}

// ─── Form types ──────────────────────────────────────────────────────────────

export interface TransactionFormData {
  transactionType: "income" | "expense";
  amount: string; // user-entered string, parsed to minor units
  accountId: string;
  categoryId: string;
  date: string;
  time: string;
  description: string;
  notes: string;
}

export interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  notes: string;
}

export interface BudgetFormData {
  categoryId: string;
  amount: string;
  month: string;
}

export interface SavingsGoalFormData {
  name: string;
  targetAmount: string;
  targetDate: string;
  currency: string;
}

export interface RecurringFormData {
  transactionType: "income" | "expense";
  amount: string;
  accountId: string;
  categoryId: string;
  description: string;
  notes: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface MoneyAnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  totalSavings: number;
  avgDailySpending: number;
  topCategories: Array<{ category: MoneyCategory; amount: number }>;
  budgetUtilization: Array<{ budget: MoneyBudget; spent: number; percent: number }>;
  monthlyComparison: Array<{ month: string; income: number; expense: number }>;
}
