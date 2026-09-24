"use client";

import { Moon, Save, Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DailyReflectionData {
  mood: string;
  achievements: string;
  improvements: string;
  priority: string;
  updatedAt: string;
}

const STORAGE_KEY = "noorpath_daily_reflection";

export function DailyReflectionDialog() {
  const [open, setOpen] = React.useState(false);
  const [mood, setMood] = React.useState("🌿 Peaceful");
  const [achievements, setAchievements] = React.useState("");
  const [improvements, setImprovements] = React.useState("");
  const [priority, setPriority] = React.useState("");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: DailyReflectionData = JSON.parse(saved);
        setTimeout(() => {
          setMood(data.mood || "🌿 Peaceful");
          setAchievements(data.achievements || "");
          setImprovements(data.improvements || "");
          setPriority(data.priority || "");
        }, 0);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data: DailyReflectionData = {
      mood,
      achievements,
      improvements,
      priority,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }
    toast.success("Daily reflection saved in private storage");
    setOpen(false);
  };

  const moods = [
    { label: "🌟 Barakah", desc: "Productive & grateful" },
    { label: "🌿 Peaceful", desc: "Calm & steady" },
    { label: "⚖️ Balanced", desc: "Moderate effort" },
    { label: "🌧 Challenging", desc: "Sabr & seeking mercy" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"
        >
          <Moon className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Daily Reflection</span>
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Moon className="size-5" />
              <DialogTitle>Daily Reflection (Muhasabah)</DialogTitle>
            </div>
            <DialogDescription>
              Take a quiet moment to audit your day. Kept completely private.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">How was your day?</Label>
              <div className="grid grid-cols-2 gap-2">
                {moods.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setMood(m.label)}
                    className={`rounded-lg border p-2 text-left text-xs transition-all ${
                      mood === m.label
                        ? "border-emerald-500 bg-emerald-500/10 font-medium text-emerald-900 dark:text-emerald-100"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div>{m.label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-achieve" className="text-xs font-semibold">
                Today&apos;s achievements &amp; blessings
              </Label>
              <textarea
                id="ref-achieve"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Completed Fajr on time, finished chapter 4 of Machine Learning..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-improve" className="text-xs font-semibold">
                What can you improve tomorrow?
              </Label>
              <textarea
                id="ref-improve"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Guard focus during study session; avoid screen distraction after Isha..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-prior" className="text-xs font-semibold">
                Tomorrow&apos;s primary priority
              </Label>
              <input
                id="ref-prior"
                type="text"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="Complete Compiler assignment before Dhuhr"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="size-3 text-gold" />
                Private to your device
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <Button type="submit" size="sm" className="gap-1.5">
                  <Save className="size-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
