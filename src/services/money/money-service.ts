/**
 * Money Management Service
 *
 * Handles all financial CRUD operations with Supabase and local storage.
 * - Uses integer minor units (paisa) for all amounts
 * - Never trusts user_id from client; derives from Supabase auth
 * - Supports offline-first with local cache
 * - Provides aggregate calculations for dashboard/analytics
 */

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type {
  MoneyAccount,
  MoneyCategory,
  MoneyTransaction,
  MoneyBudget,
  MoneySavingsGoal,
  MoneyRecurringTransaction,
  MoneyMonthlySummary,
  MoneyAnalyticsSummary,
} from "@/types/money";
import {
  getCurrentMonth,
  getMonthDateRange,
  hasMixedCurrencies,
  computeNextDueDate,
} from "./money-utils";

// ─── Local Storage Keys ──────────────────────────────────────────────────────

const CACHE_KEYS = {
  accounts: "istiqamaah_money_accounts",
  categories: "istiqamaah_money_categories",
  transactions: "istiqamaah_money_transactions",
  budgets: "istiqamaah_money_budgets",
  savingsGoals: "istiqamaah_money_savings_goals",
  recurring: "istiqamaah_money_recurring",
} as const;

export const MONEY_CACHE_KEYS = Object.values(CACHE_KEYS);

// ─── Cache helpers ───────────────────────────────────────────────────────────

function loadCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Quota exceeded — ignore
  }
}

// ─── DB Row → App Type mappers ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAccount(row: any): MoneyAccount {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    openingBalance: Number(row.opening_balance),
    currentBalance: Number(row.current_balance),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(row: any): MoneyCategory {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(row: any): MoneyTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    currency: row.currency,
    categoryId: row.category_id,
    date: row.date,
    time: row.time,
    description: row.description,
    notes: row.notes,
    transferPairId: row.transfer_pair_id,
    recurringId: row.recurring_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.money_categories ? mapCategory(row.money_categories) : undefined,
    account: row.money_accounts ? mapAccount(row.money_accounts) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBudget(row: any): MoneyBudget {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    amount: Number(row.amount),
    currency: row.currency,
    month: row.month,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.money_categories ? mapCategory(row.money_categories) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSavingsGoal(row: any): MoneySavingsGoal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    currency: row.currency,
    targetDate: row.target_date,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecurring(row: any): MoneyRecurringTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    currency: row.currency,
    categoryId: row.category_id,
    description: row.description,
    notes: row.notes,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    nextDueDate: row.next_due_date,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.money_categories ? mapCategory(row.money_categories) : undefined,
    account: row.money_accounts ? mapAccount(row.money_accounts) : undefined,
  };
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || isDevAuthBypass) return "dev-user";
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ═════════════════════════════════════════════════════════════════════════════

export async function getAccounts(): Promise<MoneyAccount[]> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    return loadCache<MoneyAccount[]>(CACHE_KEYS.accounts) ?? [];
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_accounts")
      .select("id, user_id, name, type, currency, opening_balance, current_balance, is_active, created_at, updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const accounts = (data ?? []).map(mapAccount);
    saveCache(CACHE_KEYS.accounts, accounts);
    return accounts;
  } catch {
    return loadCache<MoneyAccount[]>(CACHE_KEYS.accounts) ?? [];
  }
}

export async function createAccount(account: {
  name: string;
  type: string;
  currency: string;
  openingBalance: number;
}): Promise<MoneyAccount | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const row = {
    user_id: userId,
    name: account.name,
    type: account.type,
    currency: account.currency,
    opening_balance: account.openingBalance,
    current_balance: account.openingBalance,
  };

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyAccount[]>(CACHE_KEYS.accounts) ?? [];
    const newAcc: MoneyAccount = {
      id: crypto.randomUUID(),
      userId,
      name: account.name,
      type: account.type as MoneyAccount["type"],
      currency: account.currency,
      openingBalance: account.openingBalance,
      currentBalance: account.openingBalance,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cached.push(newAcc);
    saveCache(CACHE_KEYS.accounts, cached);
    return newAcc;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_accounts")
      .insert(row)
      .select("id, user_id, name, type, currency, opening_balance, current_balance, is_active, created_at, updated_at")
      .single();
    if (error) throw error;
    return mapAccount(data);
  } catch {
    return null;
  }
}

export async function updateAccount(id: string, updates: Partial<{ name: string; type: string; isActive: boolean }>): Promise<boolean> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyAccount[]>(CACHE_KEYS.accounts) ?? [];
    const idx = cached.findIndex((a) => a.id === id);
    if (idx >= 0) {
      if (updates.name !== undefined) cached[idx].name = updates.name;
      if (updates.type !== undefined) cached[idx].type = updates.type as MoneyAccount["type"];
      if (updates.isActive !== undefined) cached[idx].isActive = updates.isActive;
      cached[idx].updatedAt = new Date().toISOString();
      saveCache(CACHE_KEYS.accounts, cached);
    }
    return true;
  }

  try {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from("money_accounts")
      .update(dbUpdates)
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═════════════════════════════════════════════════════════════════════════════

export async function getCategories(): Promise<MoneyCategory[]> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyCategory[]>(CACHE_KEYS.categories);
    if (cached && cached.length > 0) return cached;
    return getDefaultCategories();
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_categories")
      .select("id, user_id, name, type, icon, color, is_active, created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    const cats = (data ?? []).map(mapCategory);
    saveCache(CACHE_KEYS.categories, cats);
    return cats;
  } catch {
    return loadCache<MoneyCategory[]>(CACHE_KEYS.categories) ?? getDefaultCategories();
  }
}

function getDefaultCategories(): MoneyCategory[] {
  return [
    { id: "00000000-0000-0000-0000-000000000001", userId: null, name: "Food", type: "expense", icon: "🍕", color: "#ef4444", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000002", userId: null, name: "Transport", type: "expense", icon: "🚌", color: "#f97316", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000003", userId: null, name: "Education", type: "expense", icon: "📚", color: "#3b82f6", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000004", userId: null, name: "Bills", type: "expense", icon: "📄", color: "#8b5cf6", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000005", userId: null, name: "Shopping", type: "expense", icon: "🛍️", color: "#ec4899", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000006", userId: null, name: "Health", type: "expense", icon: "💊", color: "#14b8a6", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000007", userId: null, name: "Family", type: "expense", icon: "👨‍👩‍👧", color: "#6366f1", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000008", userId: null, name: "Entertainment", type: "expense", icon: "🎮", color: "#f59e0b", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000009", userId: null, name: "Charity", type: "expense", icon: "🤲", color: "#10b981", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-00000000000a", userId: null, name: "Sadaqah", type: "expense", icon: "💝", color: "#059669", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-00000000000b", userId: null, name: "Savings", type: "expense", icon: "🏦", color: "#0ea5e9", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-00000000000c", userId: null, name: "Other", type: "both", icon: "📦", color: "#6b7280", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-00000000000d", userId: null, name: "Salary", type: "income", icon: "💰", color: "#22c55e", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-00000000000e", userId: null, name: "Freelance", type: "income", icon: "💻", color: "#06b6d4", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-00000000000f", userId: null, name: "Gift", type: "income", icon: "🎁", color: "#a855f7", isActive: true, createdAt: "" },
    { id: "00000000-0000-0000-0000-000000000010", userId: null, name: "Investment", type: "income", icon: "📈", color: "#eab308", isActive: true, createdAt: "" },
  ];
}

export async function createCategory(cat: {
  name: string;
  type: string;
  icon: string;
  color: string;
}): Promise<MoneyCategory | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyCategory[]>(CACHE_KEYS.categories) ?? getDefaultCategories();
    const newCat: MoneyCategory = {
      id: crypto.randomUUID(),
      userId,
      name: cat.name,
      type: cat.type as MoneyCategory["type"],
      icon: cat.icon,
      color: cat.color,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    cached.push(newCat);
    saveCache(CACHE_KEYS.categories, cached);
    return newCat;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_categories")
      .insert({ user_id: userId, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color })
      .select("id, user_id, name, type, icon, color, is_active, created_at")
      .single();
    if (error) throw error;
    return mapCategory(data);
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function getTransactions(options?: {
  month?: string;
  accountId?: string;
  categoryId?: string;
  type?: string;
  limit?: number;
}): Promise<MoneyTransaction[]> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    let txns = loadCache<MoneyTransaction[]>(CACHE_KEYS.transactions) ?? [];
    if (options?.month) {
      const { startDate, endDate } = getMonthDateRange(options.month);
      txns = txns.filter((t) => t.date >= startDate && t.date <= endDate);
    }
    if (options?.accountId) txns = txns.filter((t) => t.accountId === options.accountId);
    if (options?.categoryId) txns = txns.filter((t) => t.categoryId === options.categoryId);
    if (options?.type) txns = txns.filter((t) => t.transactionType === options.type);
    txns.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    if (options?.limit) txns = txns.slice(0, options.limit);
    return txns;
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("money_transactions")
      .select("id, user_id, account_id, transaction_type, amount, currency, category_id, date, time, description, notes, transfer_pair_id, recurring_id, created_at, updated_at, money_categories(id, user_id, name, type, icon, color, is_active, created_at), money_accounts(id, user_id, name, type, currency, opening_balance, current_balance, is_active, created_at, updated_at)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.month) {
      const { startDate, endDate } = getMonthDateRange(options.month);
      query = query.gte("date", startDate).lte("date", endDate);
    }
    if (options?.accountId) query = query.eq("account_id", options.accountId);
    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.type) query = query.eq("transaction_type", options.type);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    const txns = (data ?? []).map(mapTransaction);
    // Only cache if no specific filters (full month cache)
    if (!options?.accountId && !options?.categoryId && !options?.type) {
      saveCache(CACHE_KEYS.transactions, txns);
    }
    return txns;
  } catch {
    return loadCache<MoneyTransaction[]>(CACHE_KEYS.transactions) ?? [];
  }
}

export async function createTransaction(txn: {
  accountId: string;
  transactionType: "income" | "expense";
  amount: number;
  currency: string;
  categoryId: string | null;
  date: string;
  time?: string;
  description: string;
  notes?: string;
}): Promise<MoneyTransaction | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyTransaction[]>(CACHE_KEYS.transactions) ?? [];
    const newTxn: MoneyTransaction = {
      id: crypto.randomUUID(),
      userId,
      accountId: txn.accountId,
      transactionType: txn.transactionType,
      amount: txn.amount,
      currency: txn.currency,
      categoryId: txn.categoryId,
      date: txn.date,
      time: txn.time ?? null,
      description: txn.description,
      notes: txn.notes ?? null,
      transferPairId: null,
      recurringId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cached.unshift(newTxn);
    saveCache(CACHE_KEYS.transactions, cached);
    // Update account balance locally
    updateLocalAccountBalance(txn.accountId, txn.transactionType === "income" ? txn.amount : -txn.amount);
    return newTxn;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_transactions")
      .insert({
        user_id: userId,
        account_id: txn.accountId,
        transaction_type: txn.transactionType,
        amount: txn.amount,
        currency: txn.currency,
        category_id: txn.categoryId,
        date: txn.date,
        time: txn.time || null,
        description: txn.description,
        notes: txn.notes || null,
      })
      .select("id, user_id, account_id, transaction_type, amount, currency, category_id, date, time, description, notes, transfer_pair_id, recurring_id, created_at, updated_at")
      .single();
    if (error) throw error;

    // Update account balance
    const balanceChange = txn.transactionType === "income" ? txn.amount : -txn.amount;
    await updateRemoteAccountBalance(supabase, txn.accountId, balanceChange);

    return mapTransaction(data);
  } catch {
    return null;
  }
}

export async function createTransfer(transfer: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  date: string;
  notes?: string;
}): Promise<{
  outTxn: MoneyTransaction;
  inTxn: MoneyTransaction;
  transferOut: MoneyTransaction;
  transferIn: MoneyTransaction;
} | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const pairId = crypto.randomUUID();

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyTransaction[]>(CACHE_KEYS.transactions) ?? [];
    const outTxn: MoneyTransaction = {
      id: crypto.randomUUID(),
      userId,
      accountId: transfer.fromAccountId,
      transactionType: "transfer_out",
      amount: transfer.amount,
      currency: transfer.currency || "BDT",
      categoryId: null,
      date: transfer.date,
      time: null,
      description: "Transfer",
      notes: transfer.notes ?? null,
      transferPairId: pairId,
      recurringId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const inTxn: MoneyTransaction = {
      ...outTxn,
      id: crypto.randomUUID(),
      accountId: transfer.toAccountId,
      transactionType: "transfer_in",
    };
    cached.unshift(outTxn, inTxn);
    saveCache(CACHE_KEYS.transactions, cached);
    updateLocalAccountBalance(transfer.fromAccountId, -transfer.amount);
    updateLocalAccountBalance(transfer.toAccountId, transfer.amount);
    return {
      outTxn,
      inTxn,
      transferOut: outTxn,
      transferIn: inTxn,
    };
  }

  try {
    const supabase = createClient();
    const now = new Date().toISOString();
    const base = {
      user_id: userId,
      amount: transfer.amount,
      currency: transfer.currency || "BDT",
      category_id: null,
      date: transfer.date,
      time: null,
      description: "Transfer",
      notes: transfer.notes || null,
      transfer_pair_id: pairId,
    };

    const { data, error } = await supabase
      .from("money_transactions")
      .insert([
        { ...base, account_id: transfer.fromAccountId, transaction_type: "transfer_out", created_at: now, updated_at: now },
        { ...base, account_id: transfer.toAccountId, transaction_type: "transfer_in", created_at: now, updated_at: now },
      ])
      .select("id, user_id, account_id, transaction_type, amount, currency, category_id, date, time, description, notes, transfer_pair_id, recurring_id, created_at, updated_at");

    if (error) throw error;

    // Update balances
    const outRow = (data ?? []).find((r) => r.transaction_type === "transfer_out");
    const inRow = (data ?? []).find((r) => r.transaction_type === "transfer_in");

    // Fallback balance updates
    await updateRemoteAccountBalance(supabase, transfer.fromAccountId, -transfer.amount);
    await updateRemoteAccountBalance(supabase, transfer.toAccountId, transfer.amount);

    const outTxn = outRow ? mapTransaction(outRow) : mapTransaction(data![0]);
    const inTxn = inRow ? mapTransaction(inRow) : mapTransaction(data![1]);

    return {
      outTxn,
      inTxn,
      transferOut: outTxn,
      transferIn: inTxn,
    };
  } catch {
    return null;
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyTransaction[]>(CACHE_KEYS.transactions) ?? [];
    const txn = cached.find((t) => t.id === id);
    if (txn) {
      // Reverse the balance effect
      if (txn.transactionType === "income") updateLocalAccountBalance(txn.accountId, -txn.amount);
      else if (txn.transactionType === "expense") updateLocalAccountBalance(txn.accountId, txn.amount);
      else if (txn.transactionType === "transfer_out") updateLocalAccountBalance(txn.accountId, txn.amount);
      else if (txn.transactionType === "transfer_in") updateLocalAccountBalance(txn.accountId, -txn.amount);

      // If transfer, also delete the pair
      if (txn.transferPairId) {
        const pair = cached.find((t) => t.transferPairId === txn.transferPairId && t.id !== id);
        if (pair) {
          if (pair.transactionType === "transfer_out") updateLocalAccountBalance(pair.accountId, pair.amount);
          else if (pair.transactionType === "transfer_in") updateLocalAccountBalance(pair.accountId, -pair.amount);
        }
        saveCache(CACHE_KEYS.transactions, cached.filter((t) => t.transferPairId !== txn.transferPairId));
      } else {
        saveCache(CACHE_KEYS.transactions, cached.filter((t) => t.id !== id));
      }
    }
    return true;
  }

  try {
    const supabase = createClient();
    // Fetch transaction first to reverse balance
    const { data: txnData } = await supabase
      .from("money_transactions")
      .select("id, account_id, transaction_type, amount, transfer_pair_id")
      .eq("id", id)
      .single();

    if (!txnData) return false;

    // Reverse balance
    const reversal = txnData.transaction_type === "income" ? -Number(txnData.amount) :
                     txnData.transaction_type === "expense" ? Number(txnData.amount) :
                     txnData.transaction_type === "transfer_out" ? Number(txnData.amount) :
                     -Number(txnData.amount);
    await updateRemoteAccountBalance(supabase, txnData.account_id, reversal);

    // If transfer pair, delete both and reverse both
    if (txnData.transfer_pair_id) {
      const { data: pairData } = await supabase
        .from("money_transactions")
        .select("id, account_id, transaction_type, amount")
        .eq("transfer_pair_id", txnData.transfer_pair_id)
        .neq("id", id);

      if (pairData && pairData[0]) {
        const pairReversal = pairData[0].transaction_type === "transfer_out" ?
          Number(pairData[0].amount) : -Number(pairData[0].amount);
        await updateRemoteAccountBalance(supabase, pairData[0].account_id, pairReversal);
      }

      await supabase
        .from("money_transactions")
        .delete()
        .eq("transfer_pair_id", txnData.transfer_pair_id);
    } else {
      await supabase
        .from("money_transactions")
        .delete()
        .eq("id", id);
    }

    return true;
  } catch {
    return false;
  }
}

export async function updateTransaction(id: string, updates: {
  amount?: number;
  categoryId?: string;
  date?: string;
  time?: string;
  description?: string;
  notes?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyTransaction[]>(CACHE_KEYS.transactions) ?? [];
    const idx = cached.findIndex((t) => t.id === id);
    if (idx >= 0) {
      const old = cached[idx];
      if (updates.amount !== undefined && updates.amount !== old.amount) {
        // Reverse old, apply new
        const oldEffect = old.transactionType === "income" ? old.amount : -old.amount;
        const newEffect = old.transactionType === "income" ? updates.amount : -updates.amount;
        updateLocalAccountBalance(old.accountId, -oldEffect + newEffect);
        cached[idx].amount = updates.amount;
      }
      if (updates.categoryId !== undefined) cached[idx].categoryId = updates.categoryId;
      if (updates.date !== undefined) cached[idx].date = updates.date;
      if (updates.time !== undefined) cached[idx].time = updates.time;
      if (updates.description !== undefined) cached[idx].description = updates.description;
      if (updates.notes !== undefined) cached[idx].notes = updates.notes;
      cached[idx].updatedAt = new Date().toISOString();
      saveCache(CACHE_KEYS.transactions, cached);
    }
    return true;
  }

  try {
    const supabase = createClient();

    // If amount changed, need to adjust balance
    if (updates.amount !== undefined) {
      const { data: oldTxn } = await supabase
        .from("money_transactions")
        .select("account_id, transaction_type, amount")
        .eq("id", id)
        .single();

      if (oldTxn) {
        const oldEffect = oldTxn.transaction_type === "income" ? Number(oldTxn.amount) : -Number(oldTxn.amount);
        const newEffect = oldTxn.transaction_type === "income" ? updates.amount : -updates.amount;
        await updateRemoteAccountBalance(supabase, oldTxn.account_id, -oldEffect + newEffect);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: any = {};
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase
      .from("money_transactions")
      .update(dbUpdates)
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BUDGETS
// ═════════════════════════════════════════════════════════════════════════════

export async function getBudgets(month?: string): Promise<MoneyBudget[]> {
  const m = month ?? getCurrentMonth();

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyBudget[]>(CACHE_KEYS.budgets) ?? [];
    return cached.filter((b) => b.month === m);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_budgets")
      .select("id, user_id, category_id, amount, currency, month, created_at, updated_at, money_categories(id, user_id, name, type, icon, color, is_active, created_at)")
      .eq("month", m)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const budgets = (data ?? []).map(mapBudget);
    saveCache(CACHE_KEYS.budgets, budgets);
    return budgets;
  } catch {
    return loadCache<MoneyBudget[]>(CACHE_KEYS.budgets) ?? [];
  }
}

export async function upsertBudget(budget: {
  categoryId: string;
  amount: number;
  currency?: string;
  month: string;
}): Promise<MoneyBudget | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const currency = budget.currency || "BDT";

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyBudget[]>(CACHE_KEYS.budgets) ?? [];
    const existing = cached.findIndex((b) => b.categoryId === budget.categoryId && b.month === budget.month);
    const item: MoneyBudget = {
      id: existing >= 0 ? cached[existing].id : crypto.randomUUID(),
      userId,
      categoryId: budget.categoryId,
      amount: budget.amount,
      currency,
      month: budget.month,
      createdAt: existing >= 0 ? cached[existing].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing >= 0) cached[existing] = item;
    else cached.push(item);
    saveCache(CACHE_KEYS.budgets, cached);
    return item;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_budgets")
      .upsert(
        {
          user_id: userId,
          category_id: budget.categoryId,
          amount: budget.amount,
          currency,
          month: budget.month,
        },
        { onConflict: "user_id,category_id,month" },
      )
      .select("id, user_id, category_id, amount, currency, month, created_at, updated_at")
      .single();
    if (error) throw error;
    return mapBudget(data);
  } catch {
    return null;
  }
}

export async function deleteBudget(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyBudget[]>(CACHE_KEYS.budgets) ?? [];
    saveCache(CACHE_KEYS.budgets, cached.filter((b) => b.id !== id));
    return true;
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.from("money_budgets").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SAVINGS GOALS
// ═════════════════════════════════════════════════════════════════════════════

export async function getSavingsGoals(): Promise<MoneySavingsGoal[]> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    return loadCache<MoneySavingsGoal[]>(CACHE_KEYS.savingsGoals) ?? [];
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_savings_goals")
      .select("id, user_id, name, target_amount, current_amount, currency, target_date, is_archived, created_at, updated_at")
      .eq("is_archived", false)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const goals = (data ?? []).map(mapSavingsGoal);
    saveCache(CACHE_KEYS.savingsGoals, goals);
    return goals;
  } catch {
    return loadCache<MoneySavingsGoal[]>(CACHE_KEYS.savingsGoals) ?? [];
  }
}

export async function createSavingsGoal(goal: {
  name: string;
  targetAmount: number;
  currency: string;
  targetDate?: string;
}): Promise<MoneySavingsGoal | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneySavingsGoal[]>(CACHE_KEYS.savingsGoals) ?? [];
    const newGoal: MoneySavingsGoal = {
      id: crypto.randomUUID(),
      userId,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: 0,
      currency: goal.currency,
      targetDate: goal.targetDate ?? null,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cached.push(newGoal);
    saveCache(CACHE_KEYS.savingsGoals, cached);
    return newGoal;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_savings_goals")
      .insert({
        user_id: userId,
        name: goal.name,
        target_amount: goal.targetAmount,
        currency: goal.currency,
        target_date: goal.targetDate || null,
      })
      .select("id, user_id, name, target_amount, current_amount, currency, target_date, is_archived, created_at, updated_at")
      .single();
    if (error) throw error;
    return mapSavingsGoal(data);
  } catch {
    return null;
  }
}

export async function updateSavingsGoal(id: string, updates: Partial<{
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  isArchived: boolean;
}>): Promise<boolean> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneySavingsGoal[]>(CACHE_KEYS.savingsGoals) ?? [];
    const idx = cached.findIndex((g) => g.id === id);
    if (idx >= 0) {
      if (updates.name !== undefined) cached[idx].name = updates.name;
      if (updates.targetAmount !== undefined) cached[idx].targetAmount = updates.targetAmount;
      if (updates.currentAmount !== undefined) cached[idx].currentAmount = updates.currentAmount;
      if (updates.targetDate !== undefined) cached[idx].targetDate = updates.targetDate;
      if (updates.isArchived !== undefined) cached[idx].isArchived = updates.isArchived;
      cached[idx].updatedAt = new Date().toISOString();
      saveCache(CACHE_KEYS.savingsGoals, cached);
    }
    return true;
  }

  try {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;

    const { error } = await supabase.from("money_savings_goals").update(dbUpdates).eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function addSavingsContribution(goalId: string, amount: number): Promise<boolean> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneySavingsGoal[]>(CACHE_KEYS.savingsGoals) ?? [];
    const idx = cached.findIndex((g) => g.id === goalId);
    if (idx >= 0) {
      cached[idx].currentAmount = Number(cached[idx].currentAmount) + Number(amount);
      cached[idx].updatedAt = new Date().toISOString();
      saveCache(CACHE_KEYS.savingsGoals, cached);
    }
    return true;
  }

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("money_savings_goals")
      .select("current_amount")
      .eq("id", goalId)
      .single();

    if (!data) return false;

    const { error } = await supabase
      .from("money_savings_goals")
      .update({ current_amount: Number(data.current_amount) + amount })
      .eq("id", goalId);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// RECURRING TRANSACTIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function getRecurringTransactions(): Promise<MoneyRecurringTransaction[]> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    return loadCache<MoneyRecurringTransaction[]>(CACHE_KEYS.recurring) ?? [];
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_recurring_transactions")
      .select("id, user_id, account_id, transaction_type, amount, currency, category_id, description, notes, frequency, start_date, end_date, next_due_date, is_active, created_at, updated_at, money_categories(id, user_id, name, type, icon, color, is_active, created_at), money_accounts(id, user_id, name, type, currency, opening_balance, current_balance, is_active, created_at, updated_at)")
      .eq("is_active", true)
      .order("next_due_date", { ascending: true });
    if (error) throw error;
    const recurring = (data ?? []).map(mapRecurring);
    saveCache(CACHE_KEYS.recurring, recurring);
    return recurring;
  } catch {
    return loadCache<MoneyRecurringTransaction[]>(CACHE_KEYS.recurring) ?? [];
  }
}

export async function createRecurringTransaction(recurring: {
  accountId: string;
  transactionType: "income" | "expense";
  amount: number;
  currency: string;
  categoryId: string | null;
  description: string;
  notes?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
}): Promise<MoneyRecurringTransaction | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyRecurringTransaction[]>(CACHE_KEYS.recurring) ?? [];
    const newItem: MoneyRecurringTransaction = {
      id: crypto.randomUUID(),
      userId,
      accountId: recurring.accountId,
      transactionType: recurring.transactionType,
      amount: recurring.amount,
      currency: recurring.currency,
      categoryId: recurring.categoryId,
      description: recurring.description,
      notes: recurring.notes ?? null,
      frequency: recurring.frequency,
      startDate: recurring.startDate,
      endDate: recurring.endDate ?? null,
      nextDueDate: recurring.startDate,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cached.push(newItem);
    saveCache(CACHE_KEYS.recurring, cached);
    return newItem;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("money_recurring_transactions")
      .insert({
        user_id: userId,
        account_id: recurring.accountId,
        transaction_type: recurring.transactionType,
        amount: recurring.amount,
        currency: recurring.currency,
        category_id: recurring.categoryId,
        description: recurring.description,
        notes: recurring.notes || null,
        frequency: recurring.frequency,
        start_date: recurring.startDate,
        end_date: recurring.endDate || null,
        next_due_date: recurring.startDate,
      })
      .select("id, user_id, account_id, transaction_type, amount, currency, category_id, description, notes, frequency, start_date, end_date, next_due_date, is_active, created_at, updated_at")
      .single();
    if (error) throw error;
    return mapRecurring(data);
  } catch {
    return null;
  }
}

export async function confirmRecurringOccurrence(recurringId: string): Promise<MoneyTransaction | null> {
  // Get the recurring transaction
  const allRecurring = await getRecurringTransactions();
  const rec = allRecurring.find((r) => r.id === recurringId);
  if (!rec) return null;

  // Create the actual transaction
  const txn = await createTransaction({
    accountId: rec.accountId,
    transactionType: rec.transactionType,
    amount: rec.amount,
    currency: rec.currency,
    categoryId: rec.categoryId,
    date: rec.nextDueDate,
    description: rec.description,
    notes: rec.notes ?? undefined,
  });

  if (!txn) return null;

  // Advance next_due_date
  const nextDate = computeNextDueDate(rec.nextDueDate, rec.frequency);

  // Check if past end_date
  const isExpired = rec.endDate && nextDate > rec.endDate;

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyRecurringTransaction[]>(CACHE_KEYS.recurring) ?? [];
    const idx = cached.findIndex((r) => r.id === recurringId);
    if (idx >= 0) {
      if (isExpired) {
        cached[idx].isActive = false;
      } else {
        cached[idx].nextDueDate = nextDate;
      }
      cached[idx].updatedAt = new Date().toISOString();
      saveCache(CACHE_KEYS.recurring, cached);
    }
  } else {
    try {
      const supabase = createClient();
      if (isExpired) {
        await supabase.from("money_recurring_transactions").update({ is_active: false }).eq("id", recurringId);
      } else {
        await supabase.from("money_recurring_transactions").update({ next_due_date: nextDate }).eq("id", recurringId);
      }
    } catch {
      // Best effort
    }
  }

  return txn;
}

export async function skipRecurringOccurrence(recurringId: string): Promise<boolean> {
  const allRecurring = await getRecurringTransactions();
  const rec = allRecurring.find((r) => r.id === recurringId);
  if (!rec) return false;

  const nextDate = computeNextDueDate(rec.nextDueDate, rec.frequency);
  const isExpired = rec.endDate && nextDate > rec.endDate;

  if (!isSupabaseConfigured || isDevAuthBypass) {
    const cached = loadCache<MoneyRecurringTransaction[]>(CACHE_KEYS.recurring) ?? [];
    const idx = cached.findIndex((r) => r.id === recurringId);
    if (idx >= 0) {
      if (isExpired) cached[idx].isActive = false;
      else cached[idx].nextDueDate = nextDate;
      cached[idx].updatedAt = new Date().toISOString();
      saveCache(CACHE_KEYS.recurring, cached);
    }
    return true;
  }

  try {
    const supabase = createClient();
    if (isExpired) {
      await supabase.from("money_recurring_transactions").update({ is_active: false }).eq("id", recurringId);
    } else {
      await supabase.from("money_recurring_transactions").update({ next_due_date: nextDate }).eq("id", recurringId);
    }
    return true;
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MONTHLY SUMMARY (Dashboard/Analytics)
// ═════════════════════════════════════════════════════════════════════════════

export async function getMonthlySummary(month?: string): Promise<MoneyMonthlySummary> {
  const m = month ?? getCurrentMonth();
  const transactions = await getTransactions({ month: m });
  const accounts = await getAccounts();

  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const mixed = hasMixedCurrencies(currencies);
  const primaryCurrency = currencies[0] ?? "BDT";

  let totalIncome = 0;
  let totalExpense = 0;

  const currencySummaries: Record<string, { income: number; expense: number; balance: number }> = {};

  for (const txn of transactions) {
    const curr = txn.currency;
    if (!currencySummaries[curr]) {
      currencySummaries[curr] = { income: 0, expense: 0, balance: 0 };
    }
    if (txn.transactionType === "income") {
      totalIncome += txn.amount;
      currencySummaries[curr].income += txn.amount;
    } else if (txn.transactionType === "expense") {
      totalExpense += txn.amount;
      currencySummaries[curr].expense += txn.amount;
    }
    // Transfers do NOT count as income or expense
  }

  for (const curr of Object.keys(currencySummaries)) {
    currencySummaries[curr].balance = currencySummaries[curr].income - currencySummaries[curr].expense;
  }

  const totalBalance = accounts.reduce((sum, a) => {
    if (a.currency === primaryCurrency) return sum + a.currentBalance;
    return sum; // Don't mix currencies
  }, 0);

  return {
    month: m,
    currency: primaryCurrency,
    totalIncome,
    totalExpense,
    balance: totalBalance,
    saved: totalIncome - totalExpense,
    hasMixedCurrencies: mixed,
    currencySummaries: mixed ? currencySummaries : undefined,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// BUDGET WITH SPENDING
// ═════════════════════════════════════════════════════════════════════════════

export async function getBudgetsWithSpending(month?: string): Promise<MoneyBudget[]> {
  const m = month ?? getCurrentMonth();
  const [budgets, transactions] = await Promise.all([
    getBudgets(m),
    getTransactions({ month: m }),
  ]);

  // Aggregate spending by category
  const spendByCategory: Record<string, number> = {};
  for (const txn of transactions) {
    if (txn.transactionType === "expense" && txn.categoryId) {
      spendByCategory[txn.categoryId] = (spendByCategory[txn.categoryId] ?? 0) + txn.amount;
    }
  }

  return budgets.map((b) => ({
    ...b,
    spent: spendByCategory[b.categoryId] ?? 0,
    remaining: b.amount - (spendByCategory[b.categoryId] ?? 0),
  }));
}

// ═════════════════════════════════════════════════════════════════════════════
// MONEY ANALYTICS SUMMARY
// ═════════════════════════════════════════════════════════════════════════════

export async function getMoneyAnalyticsSummary(month?: string): Promise<MoneyAnalyticsSummary> {
  const m = month ?? getCurrentMonth();
  const [yearStr, monthStr] = m.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);

  const [transactions, budgetsWithSpend, categories, allTxns] = await Promise.all([
    getTransactions({ month: m }),
    getBudgetsWithSpending(m),
    getCategories(),
    getTransactions(),
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpendMap: Record<string, number> = {};

  for (const txn of transactions) {
    if (txn.transactionType === "income") {
      totalIncome += txn.amount;
    } else if (txn.transactionType === "expense") {
      totalExpenses += txn.amount;
      if (txn.categoryId) {
        categorySpendMap[txn.categoryId] = (categorySpendMap[txn.categoryId] ?? 0) + txn.amount;
      }
    }
  }

  const netCashFlow = totalIncome - totalExpenses;
  const totalSavings = Math.max(0, netCashFlow);

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const avgDailySpending = daysInMonth > 0 ? Math.round(totalExpenses / daysInMonth) : 0;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const topCategories = Object.entries(categorySpendMap)
    .map(([catId, amount]) => ({
      category: categoryMap.get(catId) ?? {
        id: catId,
        userId: null,
        name: "Other",
        type: "expense" as const,
        icon: "📦",
        color: "#6b7280",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const budgetUtilization = budgetsWithSpend.map((b) => {
    const spent = b.spent ?? 0;
    const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    return {
      budget: b,
      spent,
      percent,
    };
  });

  const monthlyComparison: Array<{ month: string; income: number; expense: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, monthNum - 1 - i, 1);
    const pastMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const { startDate, endDate } = getMonthDateRange(pastMonth);
    const monthTxns = allTxns.filter((t) => t.date >= startDate && t.date <= endDate);
    const inc = monthTxns.filter((t) => t.transactionType === "income").reduce((s, t) => s + t.amount, 0);
    const exp = monthTxns.filter((t) => t.transactionType === "expense").reduce((s, t) => s + t.amount, 0);
    monthlyComparison.push({
      month: pastMonth,
      income: inc,
      expense: exp,
    });
  }

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    totalSavings,
    avgDailySpending,
    topCategories,
    budgetUtilization,
    monthlyComparison,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Internal helpers
// ═════════════════════════════════════════════════════════════════════════════

function updateLocalAccountBalance(accountId: string, delta: number): void {
  const cached = loadCache<MoneyAccount[]>(CACHE_KEYS.accounts) ?? [];
  const idx = cached.findIndex((a) => a.id === accountId);
  if (idx >= 0) {
    cached[idx].currentBalance = Number(cached[idx].currentBalance) + Number(delta);
    cached[idx].updatedAt = new Date().toISOString();
    saveCache(CACHE_KEYS.accounts, cached);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateRemoteAccountBalance(supabase: any, accountId: string, delta: number): Promise<void> {
  try {
    const { data } = await supabase
      .from("money_accounts")
      .select("current_balance")
      .eq("id", accountId)
      .single();
    if (data) {
      await supabase
        .from("money_accounts")
        .update({ current_balance: Number(data.current_balance) + delta })
        .eq("id", accountId);
    }
  } catch {
    // Best effort
  }
}
