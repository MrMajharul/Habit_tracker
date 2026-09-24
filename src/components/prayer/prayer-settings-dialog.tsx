"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { PrayerSettings } from "@/services/prayer";

const settingsSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  calculationMethod: z.string(),
  asrMadhhab: z.enum(["standard", "hanafi"]),
  manualOffsetMinutes: z.coerce.number().int().min(-60).max(60),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export interface PrayerSettingsState extends PrayerSettings {
  city: string;
  country: string;
}

interface PrayerSettingsDialogProps {
  settings: PrayerSettingsState;
  onSave: (settings: PrayerSettingsState) => void;
}

const CALCULATION_METHODS = [
  { value: "karachi", label: "University of Islamic Sciences, Karachi" },
  { value: "isna", label: "ISNA (North America)" },
  { value: "mwl", label: "Muslim World League" },
  { value: "makkah", label: "Umm Al-Qura, Makkah" },
  { value: "egypt", label: "Egyptian General Authority" },
  { value: "tehran", label: "Institute of Geophysics, Tehran" },
  { value: "gulf", label: "Gulf Region" },
  { value: "kuwait", label: "Kuwait" },
  { value: "qatar", label: "Qatar" },
  { value: "singapore", label: "MUIS Singapore" },
];

export function PrayerSettingsDialog({
  settings,
  onSave,
}: PrayerSettingsDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      city: settings.city,
      country: settings.country,
      calculationMethod: settings.calculationMethod,
      asrMadhhab: settings.asrMadhhab,
      manualOffsetMinutes: settings.manualOffsetMinutes,
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    onSave({ ...settings, ...values });
    toast.success("Prayer settings saved");
    setOpen(false);
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="size-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prayer Settings</DialogTitle>
            <DialogDescription>
              Configure your location and calculation method.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ps-city">City</Label>
                <input id="ps-city" {...register("city")} className={inputClass} placeholder="Dhaka" />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-country">Country</Label>
                <input id="ps-country" {...register("country")} className={inputClass} placeholder="Bangladesh" />
                {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ps-method">Calculation Method</Label>
              <select id="ps-method" {...register("calculationMethod")} className={inputClass}>
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ps-madhhab">Asr Calculation (Madhhab)</Label>
              <select id="ps-madhhab" {...register("asrMadhhab")} className={inputClass}>
                <option value="standard">Standard (Shafi&apos;i, Maliki, Hanbali)</option>
                <option value="hanafi">Hanafi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ps-offset">Manual Offset (minutes)</Label>
              <input
                id="ps-offset"
                type="number"
                min={-60}
                max={60}
                {...register("manualOffsetMinutes")}
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">Adjust all prayer times by ±60 minutes.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
