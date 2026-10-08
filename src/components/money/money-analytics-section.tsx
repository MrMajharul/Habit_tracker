"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatMoney, formatMonthLabel } from "@/services/money/money-utils";
import { getMoneyAnalyticsSummary } from "@/services/money/money-service";
import type { MoneyAnalyticsSummary } from "@/types/money";
import { AnalyticsBarChart } from "@/components/analytics/charts/bar-chart";
import { TrendChart } from "@/components/analytics/charts/trend-chart";

interface MoneyAnalyticsSectionProps {
  month: string;
  currency?: string;
}

export function MoneyAnalyticsSection({ month, currency = "BDT" }: MoneyAnalyticsSectionProps) {
  const [data, setData] = useState<MoneyAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getMoneyAnalyticsSummary(month)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load money analytics:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [month]);

  // Transform data for charts
  const categoryChartData = useMemo(() => {
    if (!data?.topCategories?.length) return [];
    return data.topCategories.map((item) => ({
      name: `${item.category.icon ? `${item.category.icon} ` : ""}${item.category.name}`,
      value: Math.round(item.amount / 100), // convert to major units for chart display
    }));
  }, [data]);

  const monthlyExpenseTrend = useMemo(() => {
    if (!data?.monthlyComparison?.length) return [];
    return data.monthlyComparison.map((item) => ({
      date: item.month,
      label: formatMonthLabel(item.month).split(" ")[0],
      value: Math.round(item.expense / 100),
    }));
  }, [data]);

  const monthlyIncomeTrend = useMemo(() => {
    if (!data?.monthlyComparison?.length) return [];
    return data.monthlyComparison.map((item) => ({
      date: item.month,
      label: formatMonthLabel(item.month).split(" ")[0],
      value: Math.round(item.income / 100),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
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
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-52 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-52 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No financial analytics available for {formatMonthLabel(month)}.
        </CardContent>
      </Card>
    );
  }

  const isNetPositive = data.netCashFlow >= 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Income</span>
            </div>
            <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMoney(data.totalIncome, currency, { compact: true })}
            </p>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Expenses</span>
            </div>
            <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatMoney(data.totalExpenses, currency, { compact: true })}
            </p>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className={cn(
          "border",
          isNetPositive ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "rounded-lg p-1.5",
                isNetPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}>
                {isNetPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              </div>
              <span className="text-xs font-medium text-muted-foreground">Net Cash Flow</span>
            </div>
            <p className={cn(
              "text-xl font-bold tracking-tight",
              isNetPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {formatMoney(data.netCashFlow, currency, { showSign: true, compact: true })}
            </p>
          </CardContent>
        </Card>

        {/* Avg Daily Spending */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg p-1.5 bg-muted text-muted-foreground">
                <Calendar className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Avg Daily Spending</span>
            </div>
            <p className="text-xl font-bold tracking-tight">
              {formatMoney(data.avgDailySpending, currency, { compact: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories Spending & Budget Utilization */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
            <CardDescription className="text-xs">
              Expense distribution across categories for {formatMonthLabel(month)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No categorized expenses for this month.
              </p>
            ) : (
              <AnalyticsBarChart
                data={categoryChartData}
                label="Major unit expenditure"
              />
            )}
          </CardContent>
        </Card>

        {/* Budget vs Actual Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Budget Utilization</CardTitle>
            <CardDescription className="text-xs">
              Spending progress against allocated budgets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.budgetUtilization.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No budgets configured for this month.
              </p>
            ) : (
              <div className="space-y-4">
                {data.budgetUtilization.map((item) => {
                  const isOver = item.percent > 100;
                  const isWarning = item.percent >= 80 && !isOver;

                  return (
                    <div key={item.budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {item.budget.category?.name ?? "General Budget"}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs tabular-nums">
                          <span className={cn(
                            isOver ? "text-rose-600 font-bold dark:text-rose-400" : isWarning ? "text-amber-600 font-semibold dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            {formatMoney(item.spent, currency)} / {formatMoney(item.budget.amount, currency)}
                          </span>
                          <span className="text-muted-foreground">({item.percent}%)</span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(item.percent, 100)}
                        className={cn(
                          "h-2",
                          isOver && "[&>div]:bg-rose-500",
                          isWarning && "[&>div]:bg-amber-500",
                          !isOver && !isWarning && "[&>div]:bg-emerald-500"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Expense Trend</CardTitle>
            <CardDescription className="text-xs">
              Last 6 months expense comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={monthlyExpenseTrend}
              label="Expenses (Major Units)"
              unit={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Income Trend</CardTitle>
            <CardDescription className="text-xs">
              Last 6 months income comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={monthlyIncomeTrend}
              label="Income (Major Units)"
              unit={currency}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
