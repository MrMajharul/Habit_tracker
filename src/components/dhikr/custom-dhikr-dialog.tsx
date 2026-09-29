"use client";

import { Minus, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomDhikr } from "@/services/dhikr/dhikr-service";
import type { CustomDhikr, DhikrCategory } from "@/services/dhikr/dhikr-types";

interface CustomDhikrDialogProps {
  userId: string;
  onCreated: (dhikr: CustomDhikr) => void;
}

export function CustomDhikrDialog({ userId, onCreated }: CustomDhikrDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [arabic, setArabic] = useState("");
  const [transliteration, setTransliteration] = useState("");
  const [translation, setTranslation] = useState("");
  const [targetCount, setTargetCount] = useState(33);
  const [category, setCategory] = useState<DhikrCategory>("personal");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setName("");
    setArabic("");
    setTransliteration("");
    setTranslation("");
    setTargetCount(33);
    setCategory("personal");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name for your Dhikr");
      return;
    }

    try {
      const created = createCustomDhikr(userId, {
        name,
        arabic,
        transliteration,
        translation,
        targetCount,
        category,
        notes,
      });

      onCreated(created);
      toast.success("Custom Dhikr created");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Failed to create custom Dhikr");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          Add Custom Dhikr
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Add Personal Dhikr
            </DialogTitle>
            <DialogDescription>
              Create a custom Dhikr or Tasbeeh counter for your personal routine.
              This is labeled as Personal to distinguish it from verified Sunnah content.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="custom-dhikr-name">Dhikr Name *</Label>
              <Input
                id="custom-dhikr-name"
                placeholder="e.g. Subhanallahi wa bihamdihi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custom-dhikr-arabic">Arabic Text (Optional)</Label>
              <Input
                id="custom-dhikr-arabic"
                placeholder="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
                dir="rtl"
                className="font-arabic text-lg text-right"
                value={arabic}
                onChange={(e) => setArabic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="custom-dhikr-translit">Transliteration</Label>
                <Input
                  id="custom-dhikr-translit"
                  placeholder="Optional pronunciation"
                  value={transliteration}
                  onChange={(e) => setTransliteration(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="custom-dhikr-category">Category</Label>
                <select
                  id="custom-dhikr-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DhikrCategory)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="personal">Personal</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="after_salah">After Salah</option>
                  <option value="general">General</option>
                  <option value="forgiveness">Forgiveness</option>
                  <option value="gratitude">Gratitude</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custom-dhikr-trans">Meaning / Translation</Label>
              <Input
                id="custom-dhikr-trans"
                placeholder="Glory be to Allah and His is the praise"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
              />
            </div>

            {/* Target Count Stepper */}
            <div className="space-y-1.5">
              <Label>Target Count: <span className="font-semibold text-primary">{targetCount}</span></Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setTargetCount((prev) => Math.max(1, prev - 1))}
                  disabled={targetCount <= 1}
                >
                  <Minus className="size-4" />
                </Button>
                <div className="flex flex-1 gap-1.5 justify-center">
                  {[10, 33, 100, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetCount(preset)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        targetCount === preset
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setTargetCount((prev) => Math.min(10000, prev + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Dhikr</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
