"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/services/money/money-utils";
import type { MoneyTransaction } from "@/types/money";

interface TransactionListProps {
  transactions: MoneyTransaction[];
  onDelete: (id: string) => void;
  showAll?: boolean;
}

export function TransactionList({ transactions, onDelete, showAll }: TransactionListProps) {
  // Group by date
  const grouped: Record<string, MoneyTransaction[]> = {};
  for (const txn of transactions) {
    if (!grouped[txn.date]) grouped[txn.date] = [];
    grouped[txn.date].push(txn);
  }

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const displayDates = showAll ? dates : dates.slice(0, 5);

  return (
    <div className="space-y-4">
      {displayDates.map((date) => (
        <div key={date}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {formatDateLabel(date)}
          </p>
          <div className="space-y-1">
            {grouped[date].map((txn) => (
              <TransactionRow key={txn.id} txn={txn} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionRow({ txn, onDelete }: { txn: MoneyTransaction; onDelete: (id: string) => void }) {
  const isIncome = txn.transactionType === "income";
  const isExpense = txn.transactionType === "expense";
  const isTransferOut = txn.transactionType === "transfer_out";
  const isTransferIn = txn.transactionType === "transfer_in";
  const isTransfer = isTransferOut || isTransferIn;

  const icon = isIncome ? ArrowDownLeft : isExpense ? ArrowUpRight : ArrowLeftRight;
  const Icon = icon;

  const colorClass = isIncome
    ? "text-emerald-600 dark:text-emerald-400"
    : isExpense
    ? "text-red-600 dark:text-red-400"
    : "text-blue-600 dark:text-blue-400";

  const bgClass = isIncome
    ? "bg-emerald-500/10"
    : isExpense
    ? "bg-red-500/10"
    : "bg-blue-500/10";

  const sign = isIncome || isTransferIn ? "+" : "-";

  return (
    <div className="group flex items-center gap-3 rounded-xl p-2.5 hover:bg-accent/50 transition-colors">
      <div className={cn("shrink-0 rounded-lg p-2", bgClass)}>
        {txn.category?.icon ? (
          <span className="text-base" role="img" aria-label={txn.category.name}>
            {txn.category.icon}
          </span>
        ) : (
          <Icon className={cn("size-4", colorClass)} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {txn.description || txn.category?.name || (isTransfer ? "Transfer" : "Transaction")}
        </p>
        <p className="text-xs text-muted-foreground">
          {txn.category?.name ?? (isTransfer ? (isTransferOut ? "Transfer Out" : "Transfer In") : "")}
          {txn.time && ` · ${txn.time.slice(0, 5)}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {sign}{formatMoney(txn.amount, txn.currency)}
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(txn.id); }}
          className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          aria-label={`Delete transaction: ${txn.description}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr + "T12:00:00");
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  if (dateStr === todayStr) return "Today";
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateStr === yesterdayStr) return "Yesterday";

  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}
