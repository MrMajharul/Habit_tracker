"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney, parseAmountToMinor, isValidAmount } from "@/services/money/money-utils";
import { CategoryIcon } from "./money-icons";
import type { MoneyBudget, MoneyCategory } from "@/types/money";

interface BudgetSectionProps {
  budgets: MoneyBudget[];
  compact?: boolean;
  currency?: string;
  categories?: MoneyCategory[];
  onSave?: (data: { categoryId: string; amount: number; currency: string }) => Promise<void>;
}

export function BudgetSection({ budgets, compact, currency = "BDT", categories, onSave }: BudgetSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [catId, setCatId] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const expenseCategories = (categories ?? []).filter(
    (c) => (c.type === "expense" || c.type === "both") && !budgets.some((b) => b.categoryId === c.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave || !catId || !isValidAmount(amount)) return;
    setSaving(true);
    try {
      await onSave({ categoryId: catId, amount: parseAmountToMinor(amount, currency), currency });
      setCatId("");
      setAmount("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {budgets.map((b) => (
          <BudgetRow key={b.id} budget={b} currency={currency} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Monthly Budgets</h3>
        {onSave && expenseCategories.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            id="money-add-budget"
          >
            <Plus className="size-3" />
            Add Budget
          </button>
        )}
      </div>

      {showForm && onSave && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="budget-category" className="mb-1.5 block text-sm font-medium">Category</label>
                <select
                  id="budget-category"
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select a category</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="budget-amount" className="mb-1.5 block text-sm font-medium">Monthly Budget ({currency})</label>
                <input
                  id="budget-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No budgets set for this month.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <BudgetRow key={b.id} budget={b} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetRow({ budget, currency }: { budget: MoneyBudget; currency: string }) {
  const spent = budget.spent ?? 0;
  const remaining = budget.amount - spent;
  const percent = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
  const isOver = remaining < 0;

  return (
    <div className="rounded-xl border p-3.5 transition-colors hover:bg-accent/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {budget.category && (
            <CategoryIcon icon={budget.category.icon} className="size-4 text-primary" />
          )}
          <span className="text-sm font-medium">{budget.category?.name ?? "Category"}</span>
        </div>
        <span className={cn("text-xs font-medium", isOver ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
          {isOver ? "Over by " : ""}{formatMoney(Math.abs(remaining), currency)} {isOver ? "" : "left"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isOver
              ? "bg-red-500"
              : percent > 80
              ? "bg-amber-500"
              : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>Spent: {formatMoney(spent, currency)}</span>
        <span>Budget: {formatMoney(budget.amount, currency)}</span>
      </div>
    </div>
  );
}
