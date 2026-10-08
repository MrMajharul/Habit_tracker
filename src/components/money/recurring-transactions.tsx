"use client";

import { useState } from "react";
import { Plus, Check, SkipForward, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney, parseAmountToMinor, isValidAmount, getLocalToday, FREQUENCY_LABELS } from "@/services/money/money-utils";
import type { MoneyRecurringTransaction, MoneyAccount, MoneyCategory, RecurringFrequency } from "@/types/money";

interface RecurringSectionProps {
  recurring: MoneyRecurringTransaction[];
  accounts: MoneyAccount[];
  categories: MoneyCategory[];
  onConfirm: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
  onCreate: (data: {
    accountId: string;
    transactionType: "income" | "expense";
    amount: number;
    currency: string;
    categoryId: string | null;
    description: string;
    notes?: string;
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string;
  }) => Promise<void>;
}

export function RecurringSection({ recurring, accounts, categories, onConfirm, onSkip, onCreate }: RecurringSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [txnType, setTxnType] = useState<"income" | "expense">("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(getLocalToday());
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveAccountId = accountId || accounts[0]?.id || "";
  const selectedAccount = accounts.find((a) => a.id === effectiveAccountId);
  const currency = selectedAccount?.currency ?? "BDT";

  const filteredCategories = categories.filter((c) =>
    txnType === "income" ? c.type === "income" || c.type === "both" : c.type === "expense" || c.type === "both",
  );

  const today = getLocalToday();
  const dueItems = recurring.filter((r) => r.isActive && r.nextDueDate <= today);
  const upcomingItems = recurring.filter((r) => r.isActive && r.nextDueDate > today);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount(amount) || !effectiveAccountId) return;
    setSaving(true);
    try {
      await onCreate({
        accountId: effectiveAccountId,
        transactionType: txnType,
        amount: parseAmountToMinor(amount, currency),
        currency,
        categoryId: categoryId || null,
        description: description.trim(),
        frequency,
        startDate,
        endDate: endDate || undefined,
      });
      setAmount("");
      setDescription("");
      setCategoryId("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Recurring Transactions</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          id="money-add-recurring"
        >
          <Plus className="size-3" />
          New Recurring
        </button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTxnType(t)} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-all", txnType === t ? (t === "income" ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-600 ring-1 ring-red-500/20") : "bg-muted/50 text-muted-foreground")}>
                    {t === "income" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="rec-desc" className="mb-1.5 block text-sm font-medium">Description</label>
                <input id="rec-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Rent, Salary, Internet Bill" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rec-amount" className="mb-1.5 block text-sm font-medium">Amount ({currency})</label>
                  <input id="rec-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
                <div>
                  <label htmlFor="rec-frequency" className="mb-1.5 block text-sm font-medium">Frequency</label>
                  <select id="rec-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {(["daily", "weekly", "monthly", "yearly"] as const).map((f) => (
                      <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="rec-account" className="mb-1.5 block text-sm font-medium">Account</label>
                <select id="rec-account" value={effectiveAccountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="rec-category" className="mb-1.5 block text-sm font-medium">Category</label>
                <select id="rec-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">None</option>
                  {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rec-start" className="mb-1.5 block text-sm font-medium">Start Date</label>
                  <input id="rec-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
                <div>
                  <label htmlFor="rec-end" className="mb-1.5 block text-sm font-medium">End Date <span className="text-xs text-muted-foreground">(opt)</span></label>
                  <input id="rec-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Due Now */}
      {dueItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Due Now</p>
          <div className="space-y-2">
            {dueItems.map((r) => (
              <RecurringRow key={r.id} item={r} isDue onConfirm={onConfirm} onSkip={onSkip} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</p>
          <div className="space-y-2">
            {upcomingItems.map((r) => (
              <RecurringRow key={r.id} item={r} onConfirm={onConfirm} onSkip={onSkip} />
            ))}
          </div>
        </div>
      )}

      {recurring.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No recurring transactions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecurringRow({
  item,
  isDue,
  onConfirm,
  onSkip,
}: {
  item: MoneyRecurringTransaction;
  isDue?: boolean;
  onConfirm: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
}) {
  const isIncome = item.transactionType === "income";

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-3 transition-colors", isDue ? "border-amber-500/30 bg-amber-500/5" : "hover:bg-accent/30")}>
      <div className={cn("shrink-0 rounded-lg p-2", isIncome ? "bg-emerald-500/10" : "bg-red-500/10")}>
        {item.category?.icon ? (
          <span className="text-base">{item.category.icon}</span>
        ) : (
          <Calendar className={cn("size-4", isIncome ? "text-emerald-600" : "text-red-600")} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.description || item.category?.name || "Recurring"}</p>
        <p className="text-xs text-muted-foreground">
          {FREQUENCY_LABELS[item.frequency]} · Next: {new Date(item.nextDueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className={cn("text-sm font-semibold tabular-nums", isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {formatMoney(item.amount, item.currency)}
        </p>
        {isDue && (
          <>
            <button type="button" onClick={() => onConfirm(item.id)} className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400" aria-label="Confirm this occurrence">
              <Check className="size-3.5" />
            </button>
            <button type="button" onClick={() => onSkip(item.id)} className="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-accent" aria-label="Skip this occurrence">
              <SkipForward className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
