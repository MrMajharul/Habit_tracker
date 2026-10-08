"use client";

import { useState, useEffect } from "react";
import { ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/services/money/money-utils";
import { getMonthlySummary } from "@/services/money/money-service";
import type { MoneyMonthlySummary } from "@/types/money";

export function MoneyDashboardCard() {
  const [summary, setSummary] = useState<MoneyMonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMonthlySummary();
        if (!cancelled) setSummary(data);
      } catch {
        // Silently fail — dashboard should not break for money
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Don't render if no accounts exist (user hasn't set up money yet)
  if (!loading && summary && summary.totalIncome === 0 && summary.totalExpense === 0 && summary.balance === 0) {
    return null;
  }

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Wallet className="size-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Money</h3>
          </div>
          <Link
            href="/money"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline group-hover:gap-1.5 transition-all"
          >
            View Money
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : summary ? (
          <div>
            {summary.hasMixedCurrencies ? (
              <p className="text-lg font-bold text-muted-foreground italic">Multiple currencies</p>
            ) : (
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {formatMoney(summary.balance, summary.currency)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-3">Balance</p>

            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3" />
                {formatMoney(summary.totalIncome, summary.currency, { compact: true })}
                <span className="text-muted-foreground">income</span>
              </span>
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="size-3" />
                {formatMoney(summary.totalExpense, summary.currency, { compact: true })}
                <span className="text-muted-foreground">expenses</span>
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
