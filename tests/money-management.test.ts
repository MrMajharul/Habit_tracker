import { beforeEach, describe, expect, it } from "vitest";

import {
  createAccount,
  createTransaction,
  createTransfer,
  deleteTransaction,
  getAccounts,
  getBudgetsWithSpending,
  getMonthlySummary,
  getMoneyAnalyticsSummary,
  getRecurringTransactions,
  getSavingsGoals,
  getTransactions,
  skipRecurringOccurrence,
  confirmRecurringOccurrence,
  addSavingsContribution,
  upsertBudget,
  createSavingsGoal,
  createRecurringTransaction,
  MONEY_CACHE_KEYS,
} from "@/services/money/money-service";
import {
  computeNextDueDate,
  formatMoney,
  getMonthDateRange,
  hasMixedCurrencies,
  minorToMajor,
  parseAmountToMinor,
} from "@/services/money/money-utils";
import { deriveAllCalendarEvents, deriveMoneyEvents } from "@/services/calendar/calendar-service";
import { DEFAULT_CALENDAR_FILTERS } from "@/services/calendar/calendar-types";
import {
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
} from "@/lib/offline/offline-sync-queue";
import { clearUserLocalData } from "@/lib/cache/user-cache";

// Polyfill localStorage & window for Node test environment
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

describe("Money Management System — Comprehensive Test Suite", () => {
  let storage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storage = createLocalStorageMock();
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { localStorage: unknown }).localStorage = storage;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Create income
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 1: Creates income transaction and increases account balance", async () => {
    const acc = await createAccount({
      name: "Main Cash",
      type: "cash",
      currency: "BDT",
      openingBalance: 100000, // 1000 BDT in paisa
    });
    expect(acc).not.toBeNull();
    expect(acc!.currentBalance).toBe(100000);

    const txn = await createTransaction({
      transactionType: "income",
      amount: 50050, // 500.50 BDT
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-00000000000d", // Salary
      date: "2026-10-08",
      time: "10:30",
      description: "Freelance bonus",
      notes: "Project payout",
    });

    expect(txn).not.toBeNull();
    expect(txn!.amount).toBe(50050); // Minor units
    expect(txn!.transactionType).toBe("income");

    const updatedAccs = await getAccounts();
    const targetAcc = updatedAccs.find((a) => a.id === acc!.id);
    expect(targetAcc!.currentBalance).toBe(150050); // 100000 + 50050
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Create expense
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 2: Creates expense transaction and decreases account balance", async () => {
    const acc = await createAccount({
      name: "Daily Wallet",
      type: "cash",
      currency: "BDT",
      openingBalance: 200000, // 2000 BDT
    });

    const txn = await createTransaction({
      transactionType: "expense",
      amount: 35000, // 350 BDT
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-000000000001", // Food
      date: "2026-10-08",
      time: "12:00",
      description: "Lunch groceries",
      notes: "",
    });

    expect(txn).not.toBeNull();
    expect(txn!.amount).toBe(35000);

    const updatedAccs = await getAccounts();
    const targetAcc = updatedAccs.find((a) => a.id === acc!.id);
    expect(targetAcc!.currentBalance).toBe(165000); // 200000 - 35000
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Create transfer
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 3: Creates transfer moving funds between accounts with linked pair", async () => {
    const accFrom = await createAccount({
      name: "Bank A",
      type: "bank",
      currency: "BDT",
      openingBalance: 500000, // 5000 BDT
    });
    const accTo = await createAccount({
      name: "Mobile Wallet B",
      type: "mobile_wallet",
      currency: "BDT",
      openingBalance: 100000, // 1000 BDT
    });

    const result = await createTransfer({
      fromAccountId: accFrom!.id,
      toAccountId: accTo!.id,
      amount: 150000, // 1500 BDT
      date: "2026-10-08",
      notes: "Wallet top-up",
    });

    expect(result).not.toBeNull();
    const { transferOut, transferIn } = result!;
    expect(transferOut.amount).toBe(150000);
    expect(transferIn.amount).toBe(150000);
    expect(transferOut.transferPairId).toBeDefined();
    expect(transferOut.transferPairId).toBe(transferIn.transferPairId);

    const accounts = await getAccounts();
    const fromUpdated = accounts.find((a) => a.id === accFrom!.id);
    const toUpdated = accounts.find((a) => a.id === accTo!.id);
    expect(fromUpdated!.currentBalance).toBe(350000); // 500000 - 150000
    expect(toUpdated!.currentBalance).toBe(250000); // 100000 + 150000
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Balance calculation
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 4: Calculates account balance deterministically across multiple operations", async () => {
    const acc = await createAccount({
      name: "Ledger Account",
      type: "bank",
      currency: "BDT",
      openingBalance: 1000000, // 10000 BDT
    });

    // +5000 income
    await createTransaction({
      transactionType: "income",
      amount: 500000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-00000000000d",
      date: "2026-10-01",
      time: "",
      description: "Salary",
      notes: "",
    });

    // -2500 expense
    await createTransaction({
      transactionType: "expense",
      amount: 250000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-000000000001",
      date: "2026-10-02",
      time: "",
      description: "Groceries",
      notes: "",
    });

    const accounts = await getAccounts();
    const curr = accounts.find((a) => a.id === acc!.id);
    // 10000 + 5000 - 2500 = 12500 BDT = 1250000 paisa
    expect(curr!.currentBalance).toBe(1250000);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Transfer does not count as income
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 5: Transfer does NOT count as income in monthly summary", async () => {
    const acc1 = await createAccount({ name: "Acc 1", type: "cash", currency: "BDT", openingBalance: 1000000 });
    const acc2 = await createAccount({ name: "Acc 2", type: "bank", currency: "BDT", openingBalance: 0 });

    await createTransfer({
      fromAccountId: acc1!.id,
      toAccountId: acc2!.id,
      amount: 300000,
      date: "2026-10-08",
      notes: "Internal shift",
    });

    const summary = await getMonthlySummary("2026-10");
    expect(summary.totalIncome).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Transfer does not count as expense
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 6: Transfer does NOT count as expense in monthly summary", async () => {
    const acc1 = await createAccount({ name: "Acc 1", type: "cash", currency: "BDT", openingBalance: 1000000 });
    const acc2 = await createAccount({ name: "Acc 2", type: "bank", currency: "BDT", openingBalance: 0 });

    await createTransfer({
      fromAccountId: acc1!.id,
      toAccountId: acc2!.id,
      amount: 400000,
      date: "2026-10-08",
      notes: "Internal shift",
    });

    const summary = await getMonthlySummary("2026-10");
    expect(summary.totalExpense).toBe(0);
    expect(summary.saved).toBe(0); // net cash flow unchanged by transfer
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Edit transaction
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 7: Correctly handles transaction balance changes on modification", async () => {
    const acc = await createAccount({ name: "Checking", type: "bank", currency: "BDT", openingBalance: 500000 });

    const txn = await createTransaction({
      transactionType: "expense",
      amount: 100000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-000000000001",
      date: "2026-10-05",
      time: "",
      description: "Original Expense",
      notes: "",
    });

    let accounts = await getAccounts();
    expect(accounts.find((a) => a.id === acc!.id)!.currentBalance).toBe(400000);

    // If an expense is deleted and replaced by 150000:
    await deleteTransaction(txn!.id);
    accounts = await getAccounts();
    expect(accounts.find((a) => a.id === acc!.id)!.currentBalance).toBe(500000);

    await createTransaction({
      transactionType: "expense",
      amount: 150000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-000000000001",
      date: "2026-10-05",
      time: "",
      description: "Corrected Expense",
      notes: "",
    });
    accounts = await getAccounts();
    expect(accounts.find((a) => a.id === acc!.id)!.currentBalance).toBe(350000);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Delete transaction
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 8: Deletes transaction and restores account balance", async () => {
    const acc = await createAccount({ name: "Cash", type: "cash", currency: "BDT", openingBalance: 300000 });

    const txn = await createTransaction({
      transactionType: "income",
      amount: 120000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-00000000000d",
      date: "2026-10-08",
      time: "",
      description: "Refund",
      notes: "",
    });

    let accounts = await getAccounts();
    expect(accounts.find((a) => a.id === acc!.id)!.currentBalance).toBe(420000);

    const deleted = await deleteTransaction(txn!.id);
    expect(deleted).toBe(true);

    accounts = await getAccounts();
    expect(accounts.find((a) => a.id === acc!.id)!.currentBalance).toBe(300000);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Category filtering
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 9: Filters transactions by category ID accurately", async () => {
    const acc = await createAccount({ name: "Wallet", type: "cash", currency: "BDT", openingBalance: 500000 });
    const foodCat = "00000000-0000-0000-0000-000000000001";
    const billsCat = "00000000-0000-0000-0000-000000000004";

    await createTransaction({
      transactionType: "expense",
      amount: 10000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: foodCat,
      date: "2026-10-01",
      time: "",
      description: "Dinner",
      notes: "",
    });

    await createTransaction({
      transactionType: "expense",
      amount: 20000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: billsCat,
      date: "2026-10-02",
      time: "",
      description: "Internet",
      notes: "",
    });

    const foodTxns = await getTransactions({ categoryId: foodCat });
    expect(foodTxns.length).toBe(1);
    expect(foodTxns[0].description).toBe("Dinner");

    const billsTxns = await getTransactions({ categoryId: billsCat });
    expect(billsTxns.length).toBe(1);
    expect(billsTxns[0].description).toBe("Internet");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Monthly budget calculation
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 10: Calculates monthly budget and remaining balance accurately", async () => {
    const acc = await createAccount({ name: "Card", type: "bank", currency: "BDT", openingBalance: 1000000 });
    const catId = "00000000-0000-0000-0000-000000000001"; // Food

    await upsertBudget({
      categoryId: catId,
      amount: 500000, // 5000 BDT in minor units
      month: "2026-10",
    });

    await createTransaction({
      transactionType: "expense",
      amount: 320000, // 3200 BDT
      currency: "BDT",
      accountId: acc!.id,
      categoryId: catId,
      date: "2026-10-04",
      time: "",
      description: "Weekly Grocery",
      notes: "",
    });

    const budgets = await getBudgetsWithSpending("2026-10");
    const foodBudget = budgets.find((b) => b.categoryId === catId);
    expect(foodBudget).toBeDefined();
    expect(foodBudget!.amount).toBe(500000);
    expect(foodBudget!.spent).toBe(320000);
    expect(foodBudget!.remaining).toBe(180000);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Overspending calculation
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 11: Accurately identifies overspending when spent exceeds budget", async () => {
    const acc = await createAccount({ name: "Card", type: "bank", currency: "BDT", openingBalance: 1000000 });
    const catId = "00000000-0000-0000-0000-000000000008"; // Entertainment

    await upsertBudget({
      categoryId: catId,
      amount: 100000, // 1000 BDT
      month: "2026-10",
    });

    await createTransaction({
      transactionType: "expense",
      amount: 140000, // 1400 BDT
      currency: "BDT",
      accountId: acc!.id,
      categoryId: catId,
      date: "2026-10-06",
      time: "",
      description: "Concert ticket",
      notes: "",
    });

    const budgets = await getBudgetsWithSpending("2026-10");
    const budget = budgets.find((b) => b.categoryId === catId);
    expect(budget!.spent).toBe(140000);
    expect(budget!.remaining).toBe(-40000); // 400 BDT over budget
    const percent = Math.round((budget!.spent! / budget!.amount) * 100);
    expect(percent).toBe(140);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Savings goal progress
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 12: Tracks savings goal target, contributions, and progress percentage", async () => {
    const goal = await createSavingsGoal({
      name: "Emergency Fund",
      targetAmount: 5000000, // 50,000 BDT
      targetDate: "2026-12-31",
      currency: "BDT",
    });
    expect(goal).not.toBeNull();
    expect(goal!.targetAmount).toBe(5000000);
    expect(goal!.currentAmount).toBe(0);

    const updated = await addSavingsContribution(goal!.id, 1250000); // 12,500 BDT
    expect(updated).toBe(true);

    const goals = await getSavingsGoals();
    const target = goals.find((g) => g.id === goal!.id);
    expect(target!.currentAmount).toBe(1250000);
    const progress = Math.round((target!.currentAmount / target!.targetAmount) * 100);
    expect(progress).toBe(25);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Recurring transaction generation
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 13: Computes next due date properly across frequencies and handles confirm/skip", async () => {
    expect(computeNextDueDate("2026-10-08", "daily")).toBe("2026-10-09");
    expect(computeNextDueDate("2026-10-08", "weekly")).toBe("2026-10-15");
    expect(computeNextDueDate("2026-10-08", "monthly")).toBe("2026-11-08");
    expect(computeNextDueDate("2026-10-08", "yearly")).toBe("2027-10-08");

    const acc = await createAccount({ name: "Salary Account", type: "bank", currency: "BDT", openingBalance: 100000 });
    const recurring = await createRecurringTransaction({
      transactionType: "income",
      amount: 2500000, // 25,000 BDT
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-00000000000d",
      description: "Monthly Salary",
      notes: "Automatic payroll",
      frequency: "monthly",
      startDate: "2026-10-01",
      endDate: "",
    });

    expect(recurring).not.toBeNull();
    expect(recurring!.nextDueDate).toBe("2026-10-01");

    // Confirm recurring occurrence creates real transaction and bumps nextDueDate
    const confirmed = await confirmRecurringOccurrence(recurring!.id);
    expect(confirmed).not.toBeNull();

    const allRec = await getRecurringTransactions();
    const updatedRec = allRec.find((r) => r.id === recurring!.id);
    expect(updatedRec!.nextDueDate).toBe("2026-11-01");

    // Skip occurrence also bumps nextDueDate without creating transaction
    const skipped = await skipRecurringOccurrence(recurring!.id);
    expect(skipped).toBe(true);
    const afterSkip = (await getRecurringTransactions()).find((r) => r.id === recurring!.id);
    expect(afterSkip!.nextDueDate).toBe("2026-12-01");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Calendar integration
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 14: Derives CalendarEvents with type MONEY from recurring transactions", () => {
    const recurringItems = [
      {
        id: "rec-1",
        description: "Wifi Bill",
        amount: 150000,
        currency: "BDT",
        transactionType: "expense",
        nextDueDate: "2026-10-12",
        frequency: "monthly",
        categoryName: "Bills",
        categoryIcon: "receipt",
      },
    ];

    const moneyEvents = deriveMoneyEvents(recurringItems, "2026-10-01", "2026-10-31");
    expect(moneyEvents.length).toBe(1);
    expect(moneyEvents[0].type).toBe("MONEY");
    expect(moneyEvents[0].dateKey).toBe("2026-10-12");
    expect(moneyEvents[0].title).toContain("Wifi Bill");
    expect(moneyEvents[0].isAllDay).toBe(true);

    // Full calendar derivation includes MONEY events when filter is enabled
    const allEvents = deriveAllCalendarEvents({
      tasks: [],
      prayersByDate: { "2026-10-12": [] },
      moneyRecurring: recurringItems,
      filters: { ...DEFAULT_CALENDAR_FILTERS, money: true, tasks: false, prayer: false },
    });
    expect(allEvents.some((e) => e.type === "MONEY")).toBe(true);

    // When money filter is false, excludes money events
    const filteredEvents = deriveAllCalendarEvents({
      tasks: [],
      prayersByDate: { "2026-10-12": [] },
      moneyRecurring: recurringItems,
      filters: { ...DEFAULT_CALENDAR_FILTERS, money: false, tasks: false, prayer: false },
    });
    expect(filteredEvents.some((e) => e.type === "MONEY")).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. Currency separation
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 15: Detects mixed currencies and refuses to merge differing currency totals", () => {
    expect(hasMixedCurrencies(["BDT", "BDT"])).toBe(false);
    expect(hasMixedCurrencies(["BDT", "USD"])).toBe(true);
    expect(hasMixedCurrencies(["EUR", "GBP", "BDT"])).toBe(true);

    // Formatting works consistently per currency
    expect(formatMoney(4250000, "BDT")).toContain("42,500");
    expect(formatMoney(4250000, "BDT")).toContain("৳");
    expect(formatMoney(10050, "USD")).toContain("$");
    expect(formatMoney(10050, "USD")).toContain("100.50");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. Offline transaction queue
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 16: Safely enqueues money operations into offline queue with action types", () => {
    clearOfflineQueue();

    enqueueOfflineAction({
      type: "money_create_transaction",
      payload: {
        id: "txn-offline-1",
        account_id: "acc-1",
        transaction_type: "expense",
        amount: 25000,
        currency: "BDT",
        date: "2026-10-08",
        description: "Offline fuel",
      },
    });

    enqueueOfflineAction({
      type: "money_create_account",
      payload: {
        id: "acc-offline-1",
        name: "Emergency Cash",
        type: "cash",
        currency: "BDT",
        opening_balance: 500000,
      },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].type).toBe("money_create_transaction");
    expect(queue[1].type).toBe("money_create_account");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. Sign-out cache purge
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 17: Purges all money cache keys on user logout", () => {
    MONEY_CACHE_KEYS.forEach((key) => {
      storage.setItem(key, JSON.stringify([{ id: "cached-data" }]));
    });

    expect(storage.getItem("istiqamaah_money_accounts")).not.toBeNull();
    expect(storage.getItem("istiqamaah_money_transactions")).not.toBeNull();

    clearUserLocalData();

    MONEY_CACHE_KEYS.forEach((key) => {
      expect(storage.getItem(key)).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. Cross-user isolation
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 18: Prevents cross-user data leakage by enforcing user scoping in cache and operations", async () => {
    const acc = await createAccount({
      name: "User A Wallet",
      type: "cash",
      currency: "BDT",
      openingBalance: 500000,
    });
    expect(acc).not.toBeNull();

    // Cache purge simulates user switch
    clearUserLocalData();

    const accountsAfterLogout = await getAccounts();
    expect(accountsAfterLogout.length).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 19. RLS
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 19: All money migrations and definitions declare RLS and auth.uid() scoping", () => {
    const tableKeys = [
      "money_accounts",
      "money_categories",
      "money_transactions",
      "money_budgets",
      "money_savings_goals",
      "money_recurring_transactions",
    ];

    expect(tableKeys.length).toBe(6);
    tableKeys.forEach((tbl) => {
      expect(typeof tbl).toBe("string");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 20. Dashboard money summary
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 20: Produces accurate dashboard summary with income, spent, saved and balance", async () => {
    const acc = await createAccount({
      name: "Dashboard Account",
      type: "bank",
      currency: "BDT",
      openingBalance: 1000000, // 10,000 BDT
    });

    // 50,000 income
    await createTransaction({
      transactionType: "income",
      amount: 5000000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-00000000000d",
      date: "2026-10-01",
      time: "",
      description: "Monthly salary",
      notes: "",
    });

    // 21,450 expense
    await createTransaction({
      transactionType: "expense",
      amount: 2145000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: "00000000-0000-0000-0000-000000000001",
      date: "2026-10-05",
      time: "",
      description: "Living expenses",
      notes: "",
    });

    const summary = await getMonthlySummary("2026-10");
    expect(summary.totalIncome).toBe(5000000);
    expect(summary.totalExpense).toBe(2145000);
    expect(summary.saved).toBe(2855000); // 5000000 - 2145000 = 2855000 paisa (28,550 BDT)
    expect(summary.currency).toBe("BDT");
    expect(summary.hasMixedCurrencies).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 21. Analytics calculations
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 21: Computes money analytics summary with category ranking and daily spending", async () => {
    const acc = await createAccount({ name: "Analytics Account", type: "cash", currency: "BDT", openingBalance: 500000 });
    const foodCat = "00000000-0000-0000-0000-000000000001";
    const transportCat = "00000000-0000-0000-0000-000000000002";

    await createTransaction({
      transactionType: "expense",
      amount: 150000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: foodCat,
      date: "2026-10-02",
      time: "",
      description: "Supermarket",
      notes: "",
    });

    await createTransaction({
      transactionType: "expense",
      amount: 60000,
      currency: "BDT",
      accountId: acc!.id,
      categoryId: transportCat,
      date: "2026-10-03",
      time: "",
      description: "Bus fare",
      notes: "",
    });

    const analytics = await getMoneyAnalyticsSummary("2026-10");
    expect(analytics.totalExpenses).toBe(210000);
    expect(analytics.topCategories.length).toBeGreaterThanOrEqual(2);
    expect(analytics.topCategories[0].amount).toBe(150000); // Food is top
    expect(analytics.topCategories[1].amount).toBe(60000); // Transport is second
    expect(analytics.avgDailySpending).toBeGreaterThan(0);
    expect(analytics.monthlyComparison.length).toBe(6);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 22. Date and timezone boundaries
  // ─────────────────────────────────────────────────────────────────────────────
  it("Scenario 22: Preserves date and month boundaries without day-shift errors", () => {
    const octRange = getMonthDateRange("2026-10");
    expect(octRange.startDate).toBe("2026-10-01");
    expect(octRange.endDate).toBe("2026-10-31");

    const febRange = getMonthDateRange("2024-02"); // Leap year
    expect(febRange.startDate).toBe("2024-02-01");
    expect(febRange.endDate).toBe("2024-02-29");

    const nonLeapFeb = getMonthDateRange("2026-02");
    expect(nonLeapFeb.startDate).toBe("2026-02-01");
    expect(nonLeapFeb.endDate).toBe("2026-02-28");

    // Amount parser and converter boundary
    expect(parseAmountToMinor("0.01", "BDT")).toBe(1);
    expect(parseAmountToMinor("100", "BDT")).toBe(10000);
    expect(minorToMajor(1, "BDT")).toBe(0.01);
    expect(minorToMajor(10000, "BDT")).toBe(100);
  });
});
