"use client";

import { useState } from "react";
import { Plus, Archive, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney, parseAmountToMinor, isValidAmount, getLocalToday } from "@/services/money/money-utils";
import type { MoneySavingsGoal } from "@/types/money";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/types/money";

interface SavingsGoalSectionProps {
  goals: MoneySavingsGoal[];
  compact?: boolean;
  onContribute: (goalId: string, amount: number) => Promise<void>;
  onCreate?: (data: { name: string; targetAmount: number; currency: string; targetDate?: string }) => Promise<void>;
  onArchive?: (goalId: string) => Promise<void>;
}

export function SavingsGoalSection({ goals, compact, onContribute, onCreate, onArchive }: SavingsGoalSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreate || !name.trim() || !isValidAmount(target)) return;
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        targetAmount: parseAmountToMinor(target, currency),
        currency,
        targetDate: targetDate || undefined,
      });
      setName("");
      setTarget("");
      setTargetDate("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async (goalId: string) => {
    if (!isValidAmount(contributeAmount)) return;
    const goal = goals.find((g) => g.id === goalId);
    const amt = parseAmountToMinor(contributeAmount, goal?.currency ?? DEFAULT_CURRENCY);
    await onContribute(goalId, amt);
    setContributeId(null);
    setContributeAmount("");
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onContribute={onContribute} contributeId={contributeId} setContributeId={setContributeId} contributeAmount={contributeAmount} setContributeAmount={setContributeAmount} handleContribute={handleContribute} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Savings Goals</h3>
        {onCreate && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            id="money-add-savings-goal"
          >
            <Plus className="size-3" />
            New Goal
          </button>
        )}
      </div>

      {showForm && onCreate && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label htmlFor="goal-name" className="mb-1.5 block text-sm font-medium">Goal Name</label>
                <input id="goal-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MacBook Fund, Emergency Fund" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="goal-target" className="mb-1.5 block text-sm font-medium">Target Amount</label>
                  <input id="goal-target" type="text" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
                <div>
                  <label htmlFor="goal-currency" className="mb-1.5 block text-sm font-medium">Currency</label>
                  <select id="goal-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="goal-date" className="mb-1.5 block text-sm font-medium">Target Date <span className="text-xs text-muted-foreground">(optional)</span></label>
                <input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} min={getLocalToday()} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Creating..." : "Create Goal"}</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-3 rounded-2xl bg-muted/50 p-3 w-fit">
              <Target className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No savings goals yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onContribute={onContribute}
              onArchive={onArchive}
              contributeId={contributeId}
              setContributeId={setContributeId}
              contributeAmount={contributeAmount}
              setContributeAmount={setContributeAmount}
              handleContribute={handleContribute}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onArchive,
  contributeId,
  setContributeId,
  contributeAmount,
  setContributeAmount,
  handleContribute,
  compact,
}: {
  goal: MoneySavingsGoal;
  onContribute: (id: string, amount: number) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  contributeId: string | null;
  setContributeId: (id: string | null) => void;
  contributeAmount: string;
  setContributeAmount: (v: string) => void;
  handleContribute: (id: string) => void;
  compact?: boolean;
}) {
  const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = goal.targetAmount - goal.currentAmount;

  if (compact) {
    return (
      <div className="rounded-xl border p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{goal.name}</span>
          <span className="text-xs font-semibold text-primary">{percent.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatMoney(goal.currentAmount, goal.currency)}</span>
          <span>{formatMoney(goal.targetAmount, goal.currency)}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold">{goal.name}</h4>
            {goal.targetDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: {new Date(goal.targetDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            percent >= 100 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary",
          )}>
            {percent.toFixed(1)}%
          </span>
        </div>

        {/* Progress */}
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden mb-2">
          <div
            className={cn("h-full rounded-full transition-all duration-700", percent >= 100 ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs mb-3">
          <span className="text-muted-foreground">Current: <strong className="text-foreground">{formatMoney(goal.currentAmount, goal.currency)}</strong></span>
          <span className="text-muted-foreground">Remaining: <strong className="text-foreground">{formatMoney(Math.max(0, remaining), goal.currency)}</strong></span>
        </div>

        {/* Actions */}
        {contributeId === goal.id ? (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              aria-label="Contribution amount"
            />
            <button type="button" onClick={() => handleContribute(goal.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Add</button>
            <button type="button" onClick={() => setContributeId(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setContributeId(goal.id); setContributeAmount(""); }}
              className="flex-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="inline size-3 mr-1" />
              Add Contribution
            </button>
            {onArchive && (
              <button
                type="button"
                onClick={() => onArchive(goal.id)}
                className="rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Archive goal: ${goal.name}`}
              >
                <Archive className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
