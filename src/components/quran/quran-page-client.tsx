"use client";

import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuranLog {
  id: string;
  date: string;
  pages: number;
  minutes: number;
  note?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const JUZ_NAMES = [
  "Alif Lam Mim", "Sayaqul", "Tilkar Rusul", "Lan Tana Lu", "Wal Muhsanat",
  "La Yuhibbullah", "Wa Iza Samiu", "Wa Lau Annana", "Qalal Mala", "Wa Alamu",
  "Yatazerrun", "Wa Ma Min Dabbah", "Wa Ma Ubarri'u", "Rubama", "Subhanallazi",
  "Qal Alam", "Iqtaraba", "Qadd Aflaha", "Wa Qalallazina", "A'man Khalaqa",
  "Utlu Ma Uhiya", "Wa Man Yaqnut", "Wa Mali", "Faman Azlamu", "Ilayhi Yuraddu",
  "Ha Mim", "Qala Fama Khatbukum", "Qadd Sami Allah", "Tabaraka", "Amma",
];

const SEED_LOGS: QuranLog[] = [
  { id: "1", date: "Today", pages: 5, minutes: 20, note: "After Fajr" },
  { id: "2", date: "Yesterday", pages: 8, minutes: 30, note: "After Isha" },
  { id: "3", date: "2 days ago", pages: 4, minutes: 15 },
  { id: "4", date: "3 days ago", pages: 6, minutes: 25, note: "After Asr" },
  { id: "5", date: "4 days ago", pages: 10, minutes: 40, note: "Weekend" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function QuranPageClient() {
  const [currentJuz, setCurrentJuz] = useState(12);
  const [totalPages, setTotalPages] = useState(43);
  const [logs, setLogs] = useState<QuranLog[]>(SEED_LOGS);
  const [logPages, setLogPages] = useState(5);
  const [logMinutes, setLogMinutes] = useState(20);
  const [logNote, setLogNote] = useState("");

  const juzProgress = (currentJuz / 30) * 100;
  const TARGET_PAGES = 604;
  const pageProgress = (totalPages / TARGET_PAGES) * 100;

  const handleLog = () => {
    if (logPages < 1) {
      toast.error("Please enter at least 1 page");
      return;
    }
    const newLog: QuranLog = {
      id: crypto.randomUUID(),
      date: "Just now",
      pages: logPages,
      minutes: logMinutes,
      note: logNote || undefined,
    };
    setLogs((prev) => [newLog, ...prev]);
    setTotalPages((p) => p + logPages);
    toast.success(`Logged ${logPages} pages — BarakAllahu feek! 📖`);
    setLogNote("");
  };

  const inputClass = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Qur&apos;an</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your reading, memorisation, and revision.</p>
      </div>

      {/* Khatm Progress */}
      <Card className="border-emerald/20 bg-gradient-to-br from-card to-emerald/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-emerald" />
            Khatm Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Juz progress</span>
              <span className="font-semibold">{currentJuz} / 30 Juz</span>
            </div>
            <Progress value={juzProgress} className="h-3 [&>div]:bg-emerald" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pages read</span>
              <span className="font-semibold">{totalPages} / {TARGET_PAGES}</span>
            </div>
            <Progress value={pageProgress} className="h-2" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Currently on</p>
              <p className="font-semibold">Juz {currentJuz} — {JUZ_NAMES[currentJuz - 1]}</p>
            </div>
            <Badge variant="secondary" className="bg-emerald/10 text-emerald">
              {Math.round(juzProgress)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Today&apos;s Reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="q-pages">Pages read</label>
              <input
                id="q-pages"
                type="number"
                min={1}
                max={100}
                value={logPages}
                onChange={(e) => setLogPages(Number(e.target.value))}
                className={inputClass + " w-full"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="q-mins">Minutes spent</label>
              <input
                id="q-mins"
                type="number"
                min={1}
                max={240}
                value={logMinutes}
                onChange={(e) => setLogMinutes(Number(e.target.value))}
                className={inputClass + " w-full"}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="q-note">Note (optional)</label>
            <input
              id="q-note"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              className={inputClass + " w-full"}
              placeholder="After Fajr, Surah Yusuf…"
            />
          </div>
          <Button onClick={handleLog} className="w-full gap-2">
            <Plus className="size-4" />
            Log {logPages} page{logPages !== 1 ? "s" : ""}
          </Button>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Update current Juz</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={30}
                value={currentJuz}
                onChange={(e) => setCurrentJuz(Number(e.target.value))}
                className="flex-1 accent-emerald"
                aria-label="Current Juz"
              />
              <span className="w-16 text-center text-sm font-medium">Juz {currentJuz}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Juz Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">30 Juz Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
              <button
                key={juz}
                onClick={() => setCurrentJuz(juz)}
                title={JUZ_NAMES[juz - 1]}
                className={cn(
                  "aspect-square rounded-lg border text-xs font-medium transition-colors",
                  juz < currentJuz
                    ? "border-emerald/30 bg-emerald/20 text-emerald"
                    : juz === currentJuz
                      ? "border-emerald bg-emerald text-emerald-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40",
                )}
              >
                {juz}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Click a Juz to update your position</p>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {logs.slice(0, 7).map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{log.pages} pages</p>
                  {log.note && <p className="text-xs text-muted-foreground">{log.note}</p>}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{log.minutes} min</p>
                  <p className="font-medium">{log.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
