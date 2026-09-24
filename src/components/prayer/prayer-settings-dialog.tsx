"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { LocateFixed, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { requestBrowserGeolocation } from "@/services/prayer/prayer-settings-service";
import type { PrayerSettings } from "@/services/prayer";

const settingsSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z.string().min(1, "Timezone is required"),
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
  { value: "gulf", label: "Gulf Region / Dubai" },
  { value: "kuwait", label: "Kuwait" },
  { value: "qatar", label: "Qatar" },
  { value: "singapore", label: "MUIS Singapore" },
  { value: "turkey", label: "Diyanet İşleri Başkanlığı, Turkey" },
  { value: "moonsighting", label: "Moonsighting Committee" },
];

export function PrayerSettingsDialog({
  settings,
  onSave,
}: PrayerSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      city: settings.city,
      country: settings.country,
      latitude: settings.latitude,
      longitude: settings.longitude,
      timezone: settings.timezone || "Asia/Dhaka",
      calculationMethod: settings.calculationMethod,
      asrMadhhab: settings.asrMadhhab,
      manualOffsetMinutes: settings.manualOffsetMinutes,
    },
  });

  const handleUseGeolocation = async () => {
    setLocating(true);
    const coords = await requestBrowserGeolocation();
    setLocating(false);

    if (coords) {
      setValue("latitude", coords.latitude);
      setValue("longitude", coords.longitude);
      setValue("timezone", coords.timezone);
      toast.success("Location acquired from browser", {
        description: `Coordinates: ${coords.latitude}°, ${coords.longitude}°`,
      });
    } else {
      toast.error("Location access denied or unavailable", {
        description: "Please enter your city, country, or coordinates manually.",
      });
    }
  };

  const onSubmit = (values: SettingsFormValues) => {
    onSave({ ...settings, ...values });
    toast.success("Prayer settings saved & recalculated");
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prayer Settings</DialogTitle>
            <DialogDescription>
              Configure your global location, Madhhab, and calculation method.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                  Detect Location
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Use GPS coordinates for exact astronomical calculations.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseGeolocation}
                disabled={locating}
                className="gap-1.5 text-xs border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
              >
                {locating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="size-3.5" />
                )}
                <span>{locating ? "Locating..." : "Use GPS"}</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ps-city" className="text-xs">City</Label>
                <input id="ps-city" {...register("city")} className={inputClass} placeholder="Dhaka" />
                {errors.city && <p className="text-[11px] text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="ps-country" className="text-xs">Country</Label>
                <input id="ps-country" {...register("country")} className={inputClass} placeholder="Bangladesh" />
                {errors.country && <p className="text-[11px] text-destructive">{errors.country.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ps-lat" className="text-xs">Latitude</Label>
                <input
                  id="ps-lat"
                  type="number"
                  step="any"
                  {...register("latitude")}
                  className={inputClass}
                  placeholder="23.8103"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ps-lng" className="text-xs">Longitude</Label>
                <input
                  id="ps-lng"
                  type="number"
                  step="any"
                  {...register("longitude")}
                  className={inputClass}
                  placeholder="90.4125"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ps-method" className="text-xs">Calculation Method</Label>
              <select id="ps-method" {...register("calculationMethod")} className={inputClass}>
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ps-madhhab" className="text-xs">Asr Calculation (Madhhab)</Label>
              <select id="ps-madhhab" {...register("asrMadhhab")} className={inputClass}>
                <option value="standard">Standard / Shafi&apos;i, Maliki, Hanbali (Shadow 1x)</option>
                <option value="hanafi">Hanafi (Shadow 2x)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ps-offset" className="text-xs">Manual Offset (minutes: ±60)</Label>
              <input
                id="ps-offset"
                type="number"
                min={-60}
                max={60}
                {...register("manualOffsetMinutes")}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Save settings</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
