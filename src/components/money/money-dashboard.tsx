"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney, getCurrentMonth, formatMonthLabel } from "@/services/money/money-utils";
import {
  getAccounts,
  getTransactions,
  getMonthlySummary,
  getBudgetsWithSpending,
  getSavingsGoals,
  getRecurringTransactions,
  getCategories,
  createAccount,
  createTransaction,
  createTransfer,
  deleteTransaction,
  upsertBudget,
  createSavingsGoal,
  updateSavingsGoal,
  addSavingsContribution,
  createRecurringTransaction,
  confirmRecurringOccurrence,
  skipRecurringOccurrence,
  createCategory,
} from "@/services/money/money-service";
import type {
  MoneyAccount,
  MoneyTransaction,
  MoneyMonthlySummary,
  MoneyBudget,
  MoneySavingsGoal,
  MoneyRecurringTransaction,
  MoneyCategory,
} from "@/types/money";
import { DEFAULT_CURRENCY } from "@/types/money";
import { TransactionDialog } from "./transaction-dialog";
import { AccountManager } from "./account-manager";
import { BudgetSection } from "./budget-section";
import { SavingsGoalSection } from "./savings-goals";
import { RecurringSection } from "./recurring-transactions";
import { TransactionList } from "./transaction-list";
import { MoneyAnalyticsSection } from "./money-analytics-section";

type Tab = "overview" | "transactions" | "budgets" | "savings" | "recurring" | "accounts" | "analytics";

export function MoneyDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  // Data states
  const [accounts, setAccounts] = useState<MoneyAccount[]>([]);
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);
  const [summary, setSummary] = useState<MoneyMonthlySummary | null>(null);
  const [budgets, setBudgets] = useState<MoneyBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<MoneySavingsGoal[]>([]);
  const [recurring, setRecurring] = useState<MoneyRecurringTransaction[]>([]);
  const [categories, setCategories] = useState<MoneyCategory[]>([]);

  // Dialog states
  const [showTxnDialog, setShowTxnDialog] = useState(false);
  const [txnDialogType, setTxnDialogType] = useState<"income" | "expense" | "transfer">("expense");

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        const [accs, cats, txns, sum, budgetData, goals, rec] = await Promise.all([
          getAccounts(),
          getCategories(),
          getTransactions({ month: selectedMonth }),
          getMonthlySummary(selectedMonth),
          getBudgetsWithSpending(selectedMonth),
          getSavingsGoals(),
          getRecurringTransactions(),
        ]);
        if (!ignore) {
          setAccounts(accs);
          setCategories(cats);
          setTransactions(txns);
          setSummary(sum);
          setBudgets(budgetData);
          setSavingsGoals(goals);
          setRecurring(rec);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.warn("Failed to load money data:", err);
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [selectedMonth, refreshTrigger]);

  const loadData = () => setRefreshTrigger((prev) => prev + 1);

  const navigateMonth = (delta: number) => {
    setLoading(true);
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const handleOpenTxnDialog = (type: "income" | "expense" | "transfer") => {
    setTxnDialogType(type);
    setShowTxnDialog(true);
  };

  const currency = summary?.currency ?? DEFAULT_CURRENCY;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Wallet },
    { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { key: "budgets", label: "Budgets", icon: BarChart3 },
    { key: "savings", label: "Savings", icon: Target },
    { key: "recurring", label: "Recurring", icon: RefreshCw },
    { key: "accounts", label: "Accounts", icon: CreditCard },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  // Due recurring transactions (next_due_date <= today)
  const dueRecurring = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return recurring.filter((r) => r.isActive && r.nextDueDate <= today);
  }, [recurring]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Money</h1>
          <p className="text-sm text-muted-foreground">Track income, expenses, and savings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenTxnDialog("income")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors dark:text-emerald-400"
            aria-label="Add income"
            id="money-add-income"
          >
            <ArrowDownLeft className="size-4" />
            <span className="hidden sm:inline">Income</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenTxnDialog("expense")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 transition-colors dark:text-red-400"
            aria-label="Add expense"
            id="money-add-expense"
          >
            <ArrowUpRight className="size-4" />
            <span className="hidden sm:inline">Expense</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenTxnDialog("transfer")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-500/20 transition-colors dark:text-blue-400"
            aria-label="Transfer between accounts"
            id="money-add-transfer"
          >
            <ArrowLeftRight className="size-4" />
            <span className="hidden sm:inline">Transfer</span>
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="min-w-[160px] text-center text-lg font-semibold">
          {formatMonthLabel(selectedMonth)}
        </h2>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Due Recurring Banner */}
      {dueRecurring.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {dueRecurring.length} recurring transaction{dueRecurring.length > 1 ? "s" : ""} due
            </p>
            <div className="mt-2 space-y-1.5">
              {dueRecurring.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span>{r.description || r.category?.name || "Transaction"}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatMoney(r.amount, r.currency)}</span>
                    <button
                      type="button"
                      onClick={async () => { await confirmRecurringOccurrence(r.id); loadData(); }}
                      className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={async () => { await skipRecurringOccurrence(r.id); loadData(); }}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Balance"
            amount={summary.balance}
            currency={currency}
            icon={Wallet}
            variant="primary"
            hasMixed={summary.hasMixedCurrencies}
          />
          <SummaryCard
            label="Income"
            amount={summary.totalIncome}
            currency={currency}
            icon={TrendingUp}
            variant="income"
          />
          <SummaryCard
            label="Spent"
            amount={summary.totalExpense}
            currency={currency}
            icon={TrendingDown}
            variant="expense"
          />
          <SummaryCard
            label="Saved"
            amount={summary.saved}
            currency={currency}
            icon={PiggyBank}
            variant="savings"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 no-scrollbar" role="tablist" aria-label="Money sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              id={`money-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Recent Transactions</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("transactions")}
                      className="text-sm text-primary hover:underline"
                    >
                      View all
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <EmptyState onAdd={() => handleOpenTxnDialog("expense")} />
                  ) : (
                    <TransactionList
                      transactions={transactions.slice(0, 5)}
                      onDelete={async (id) => { await deleteTransaction(id); loadData(); }}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Budget Overview */}
              {budgets.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Budget Status</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("budgets")}
                        className="text-sm text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BudgetSection budgets={budgets.slice(0, 4)} compact currency={currency} />
                  </CardContent>
                </Card>
              )}

              {/* Savings Goals Preview */}
              {savingsGoals.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Savings Goals</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("savings")}
                        className="text-sm text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SavingsGoalSection goals={savingsGoals.slice(0, 3)} compact onContribute={async (id, amount) => { await addSavingsContribution(id, amount); loadData(); }} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">All Transactions</h3>
                  <button
                    type="button"
                    onClick={() => handleOpenTxnDialog("expense")}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="size-3" />
                    Add
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <EmptyState onAdd={() => handleOpenTxnDialog("expense")} />
                ) : (
                  <TransactionList
                    transactions={transactions}
                    onDelete={async (id) => { await deleteTransaction(id); loadData(); }}
                    showAll
                  />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "budgets" && (
            <BudgetSection
              budgets={budgets}
              currency={currency}
              categories={categories}
              onSave={async (data) => {
                await upsertBudget({ ...data, month: selectedMonth });
                loadData();
              }}
            />
          )}

          {activeTab === "savings" && (
            <SavingsGoalSection
              goals={savingsGoals}
              onContribute={async (id, amount) => { await addSavingsContribution(id, amount); loadData(); }}
              onCreate={async (data) => { await createSavingsGoal(data); loadData(); }}
              onArchive={async (id) => { await updateSavingsGoal(id, { isArchived: true }); loadData(); }}
            />
          )}

          {activeTab === "recurring" && (
            <RecurringSection
              recurring={recurring}
              accounts={accounts}
              categories={categories}
              onConfirm={async (id) => { await confirmRecurringOccurrence(id); loadData(); }}
              onSkip={async (id) => { await skipRecurringOccurrence(id); loadData(); }}
              onCreate={async (data) => { await createRecurringTransaction(data); loadData(); }}
            />
          )}

          {activeTab === "accounts" && (
            <AccountManager
              accounts={accounts}
              onCreate={async (data) => { await createAccount(data); loadData(); }}
            />
          )}

          {activeTab === "analytics" && (
            <MoneyAnalyticsSection month={selectedMonth} currency={currency} />
          )}
        </>
      )}

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showTxnDialog}
        onOpenChange={setShowTxnDialog}
        type={txnDialogType}
        onTypeChange={setTxnDialogType}
        accounts={accounts}
        categories={categories}
        onSave={async (data) => {
          await createTransaction(data);
          loadData();
        }}
        onTransfer={async (data) => {
          await createTransfer(data);
          loadData();
        }}
        onCreateCategory={async (data) => {
          const cat = await createCategory(data);
          if (cat) {
            setCategories((prev) => [...prev, cat]);
          }
        }}
      />
    </div>
  );
}

// ─── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  amount,
  currency,
  icon: Icon,
  variant,
  hasMixed,
}: {
  label: string;
  amount: number;
  currency: string;
  icon: React.ElementType;
  variant: "primary" | "income" | "expense" | "savings";
  hasMixed?: boolean;
}) {
  const variants = {
    primary: "bg-primary/5 text-primary border-primary/10",
    income: "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10",
    expense: "bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/10",
    savings: "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10",
  };

  const iconBg = {
    primary: "bg-primary/10",
    income: "bg-emerald-500/10",
    expense: "bg-red-500/10",
    savings: "bg-blue-500/10",
  };

  return (
    <Card className={cn("border", variants[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("rounded-lg p-1.5", iconBg[variant])}>
            <Icon className="size-3.5" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        {hasMixed && variant === "primary" ? (
          <p className="text-xs text-muted-foreground italic">Multiple currencies</p>
        ) : (
          <p className="text-lg font-bold tracking-tight">
            {formatMoney(amount, currency, { compact: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-2xl bg-muted/50 p-4 mb-4">
        <Wallet className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">No transactions yet</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-[240px]">
        Start tracking your finances by adding your first transaction.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="size-4" />
        Add Transaction
      </button>
    </div>
  );
}
