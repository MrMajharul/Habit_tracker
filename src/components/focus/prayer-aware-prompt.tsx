"use client";

import { Clock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";

interface PrayerAwarePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPrayerName: string;
  minutesUntilNextPrayer: number;
  suggestedDuration: number;
  originalDuration: number;
  onSelectDuration: (durationMinutes: number) => void;
  onCancel: () => void;
}

export function PrayerAwarePrompt({
  open,
  onOpenChange,
  nextPrayerName,
  minutesUntilNextPrayer,
  suggestedDuration,
  originalDuration,
  onSelectDuration,
  onCancel,
}: PrayerAwarePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Sparkles className="size-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Prayer-Aware Focus
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">
              {nextPrayerName} in {minutesUntilNextPrayer} minutes
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Your next prayer is approaching. Would you like to adjust your
              session so you can finish calmly before Salah without rushing?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-3 my-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Original plan:</span>
              <span className="font-semibold text-foreground">
                {originalDuration} minutes
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Recommended window:</span>
              <span className="font-semibold text-primary">
                {suggestedDuration} minutes
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2">
              <span className="text-muted-foreground">Preparation buffer:</span>
              <span className="font-semibold text-emerald">
                {minutesUntilNextPrayer - suggestedDuration} min for Wudu
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onCancel();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectDuration(originalDuration);
                onOpenChange(false);
              }}
            >
              Keep {originalDuration} min
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground font-semibold"
              onClick={() => {
                onSelectDuration(suggestedDuration);
                onOpenChange(false);
              }}
            >
              <Clock className="size-3.5" />
              Start {suggestedDuration} min
            </Button>
          </div>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
