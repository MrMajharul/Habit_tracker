"use client";

import { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseAmountToMinor, isValidAmount, getLocalToday } from "@/services/money/money-utils";
import { CategoryIcon } from "./money-icons";
import type { MoneyAccount, MoneyCategory } from "@/types/money";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense" | "transfer";
  onTypeChange: (type: "income" | "expense" | "transfer") => void;
  accounts: MoneyAccount[];
  categories: MoneyCategory[];
  onSave: (data: {
    accountId: string;
    transactionType: "income" | "expense";
    amount: number;
    currency: string;
    categoryId: string | null;
    date: string;
    time?: string;
    description: string;
    notes?: string;
  }) => Promise<void>;
  onTransfer: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
  onCreateCategory: (data: { name: string; type: string; icon: string; color: string }) => Promise<void>;
}

export function TransactionDialog({
  open,
  onOpenChange,
  type,
  onTypeChange,
  accounts,
  categories,
  onSave,
  onTransfer,
}: TransactionDialogProps) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(getLocalToday());
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = categories.filter((c) => {
    if (type === "income") return c.type === "income" || c.type === "both";
    if (type === "expense") return c.type === "expense" || c.type === "both";
    return false;
  });

  const defaultAccountId = accounts[0]?.id ?? "";
  const effectiveAccountId = accountId || defaultAccountId;
  const selectedAccount = accounts.find((a) => a.id === effectiveAccountId);
  const currency = selectedAccount?.currency ?? "BDT";

  const resetForm = () => {
    setAmount("");
    setAccountId("");
    setToAccountId("");
    setCategoryId("");
    setDate(getLocalToday());
    setTime("");
    setDescription("");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidAmount(amount)) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    const minorAmount = parseAmountToMinor(amount, currency);
    if (minorAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (!effectiveAccountId && type !== "transfer") {
      setError("Please select an account");
      return;
    }

    if (type === "transfer") {
      const fromId = effectiveAccountId;
      const toId = toAccountId || accounts.find((a) => a.id !== fromId)?.id;
      if (!fromId || !toId) {
        setError("Please select both accounts");
        return;
      }
      if (fromId === toId) {
        setError("From and To accounts must be different");
        return;
      }

      setSaving(true);
      try {
        await onTransfer({
          fromAccountId: fromId,
          toAccountId: toId,
          amount: minorAmount,
          currency,
          date,
          notes: notes || undefined,
        });
        handleClose();
      } catch {
        setError("Failed to create transfer");
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      await onSave({
        accountId: effectiveAccountId,
        transactionType: type,
        amount: minorAmount,
        currency,
        categoryId: categoryId || null,
        date,
        time: time || undefined,
        description: description || filteredCategories.find((c) => c.id === categoryId)?.name || "",
        notes: notes || undefined,
      });
      handleClose();
    } catch {
      setError("Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const typeButtons = [
    { key: "expense" as const, label: "Expense", icon: ArrowUpRight, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
    { key: "income" as const, label: "Income", icon: ArrowDownLeft, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { key: "transfer" as const, label: "Transfer", icon: ArrowLeftRight, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Add transaction">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-background/95 px-5 py-4 shrink-0">
          <h2 className="text-lg font-semibold">
            {type === "transfer" ? "New Transfer" : `Add ${type === "income" ? "Income" : "Expense"}`}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Type Selector */}
          <div className="flex gap-2" role="radiogroup" aria-label="Transaction type">
            {typeButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.key}
                  type="button"
                  role="radio"
                  aria-checked={type === btn.key}
                  onClick={() => onTypeChange(btn.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all",
                    type === btn.key
                      ? cn(btn.bg, btn.color, "ring-1 ring-current/20")
                      : "bg-muted/50 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5" />
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="txn-amount" className="mb-1.5 block text-sm font-medium">
              Amount <span className="text-muted-foreground">({currency})</span>
            </label>
            <input
              id="txn-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-2xl font-bold tabular-nums placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
              aria-describedby="txn-amount-desc"
            />
            <p id="txn-amount-desc" className="sr-only">Enter the transaction amount in {currency}</p>
          </div>

          {/* Account */}
          {type !== "transfer" ? (
            <div>
              <label htmlFor="txn-account" className="mb-1.5 block text-sm font-medium">Account</label>
              <select
                id="txn-account"
                value={effectiveAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="txn-from-account" className="mb-1.5 block text-sm font-medium">From</label>
                <select
                  id="txn-from-account"
                  value={effectiveAccountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="txn-to-account" className="mb-1.5 block text-sm font-medium">To</label>
                <select
                  id="txn-to-account"
                  value={toAccountId || accounts.find((a) => a.id !== effectiveAccountId)?.id || ""}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {accounts.filter((a) => a.id !== effectiveAccountId).map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Category */}
          {type !== "transfer" && (
            <div>
              <label htmlFor="txn-category" className="mb-1.5 block text-sm font-medium">Category</label>
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      categoryId === cat.id
                        ? "bg-primary text-primary-foreground ring-1 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <CategoryIcon icon={cat.icon} className="size-3.5" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="txn-date" className="mb-1.5 block text-sm font-medium">Date</label>
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            {type !== "transfer" && (
              <div>
                <label htmlFor="txn-time" className="mb-1.5 block text-sm font-medium">
                  Time <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <input
                  id="txn-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          {/* Description */}
          {type !== "transfer" && (
            <div>
              <label htmlFor="txn-description" className="mb-1.5 block text-sm font-medium">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="txn-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="txn-notes" className="mb-1.5 block text-sm font-medium">
              Notes <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <textarea
              id="txn-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional details..."
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          </div>

          {/* Sticky Footer with Save Button */}
          <div className="border-t bg-background/95 backdrop-blur px-5 py-3.5 pb-6 sm:pb-3.5 shrink-0">
            <button
              type="submit"
              id="txn-save-button"
              disabled={saving}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-sm",
                type === "income"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  : type === "expense"
                  ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600",
                saving && "opacity-50 cursor-not-allowed",
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  <span>
                    Save {type === "transfer" ? "Transfer" : type === "income" ? "Income" : "Expense"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
