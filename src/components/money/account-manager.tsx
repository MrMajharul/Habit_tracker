"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney, parseAmountToMinor, isValidAmount, ACCOUNT_TYPE_LABELS } from "@/services/money/money-utils";
import { AccountTypeIcon } from "./money-icons";
import type { MoneyAccount, MoneyAccountType } from "@/types/money";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/types/money";

interface AccountManagerProps {
  accounts: MoneyAccount[];
  onCreate: (data: { name: string; type: string; currency: string; openingBalance: number }) => Promise<void>;
}

export function AccountManager({ accounts, onCreate }: AccountManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<MoneyAccountType>("cash");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [openingBalance, setOpeningBalance] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const balance = openingBalance && isValidAmount(openingBalance)
        ? parseAmountToMinor(openingBalance, currency)
        : 0;
      await onCreate({ name: name.trim(), type, currency, openingBalance: balance });
      setName("");
      setType("cash");
      setOpeningBalance("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const accountTypes: MoneyAccountType[] = ["cash", "bank", "mobile_wallet", "savings", "other"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Your Accounts</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          id="money-create-account"
        >
          <Plus className="size-3" />
          Add Account
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium">Account Name</label>
                <input
                  id="account-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cash Wallet, bKash, Savings Account"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <div className="flex flex-wrap gap-2">
                  {accountTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        type === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <AccountTypeIcon type={t} className="size-3.5" />
                      {ACCOUNT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="account-currency" className="mb-1.5 block text-sm font-medium">Currency</label>
                  <select
                    id="account-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="account-balance" className="mb-1.5 block text-sm font-medium">Opening Balance</label>
                  <input
                    id="account-balance"
                    type="text"
                    inputMode="decimal"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Cards */}
      {accounts.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">No accounts yet. Create one to start tracking.</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Create First Account
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-muted p-2 text-foreground">
                    <AccountTypeIcon type={account.type} className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "text-xl font-bold tabular-nums",
                  account.currentBalance < 0 ? "text-red-600 dark:text-red-400" : "text-foreground",
                )}>
                  {formatMoney(account.currentBalance, account.currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
