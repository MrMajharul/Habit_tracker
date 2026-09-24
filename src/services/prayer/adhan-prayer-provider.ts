import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from "adhan";
import { addDays } from "date-fns";

import type { PrayerTimeProvider } from "./prayer-service.interface";
import type {
  PrayerDaySummary,
  PrayerName,
  PrayerSettings,
  PrayerTime,
} from "./types";

const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export function getCalculationParameters(
  method: string,
  madhhab: "standard" | "hanafi",
) {
  let params;
  switch (method?.toLowerCase()) {
    case "karachi":
      params = CalculationMethod.Karachi();
      break;
    case "isna":
    case "north_america":
      params = CalculationMethod.NorthAmerica();
      break;
    case "mwl":
    case "muslim_world_league":
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case "makkah":
    case "umm_al_qura":
      params = CalculationMethod.UmmAlQura();
      break;
    case "egypt":
    case "egyptian":
      params = CalculationMethod.Egyptian();
      break;
    case "tehran":
      params = CalculationMethod.Tehran();
      break;
    case "gulf":
    case "dubai":
      params = CalculationMethod.Dubai();
      break;
    case "kuwait":
      params = CalculationMethod.Kuwait();
      break;
    case "qatar":
      params = CalculationMethod.Qatar();
      break;
    case "singapore":
    case "muis":
      params = CalculationMethod.Singapore();
      break;
    case "turkey":
      params = CalculationMethod.Turkey();
      break;
    case "moonsighting":
      params = CalculationMethod.MoonsightingCommittee();
      break;
    default:
      params = CalculationMethod.Karachi();
      break;
  }

  if (madhhab === "hanafi") {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  return params;
}

export class AdhanPrayerProvider implements PrayerTimeProvider {
  async getPrayerTimes(
    settings: PrayerSettings,
    date = new Date(),
    completedPrayers: PrayerName[] = [],
  ): Promise<PrayerDaySummary> {
    const lat = Number(settings.latitude) || 23.8103;
    const lng = Number(settings.longitude) || 90.4125;
    const coordinates = new Coordinates(lat, lng);

    const params = getCalculationParameters(
      settings.calculationMethod,
      settings.asrMadhhab,
    );

    // Apply per-prayer manual offsets or global offset
    const manualOffset = Number(settings.manualOffsetMinutes) || 0;
    params.adjustments.fajr = (settings.fajrAdjustment || 0) + manualOffset;
    params.adjustments.sunrise = (settings.sunriseAdjustment || 0) + manualOffset;
    params.adjustments.dhuhr = (settings.dhuhrAdjustment || 0) + manualOffset;
    params.adjustments.asr = (settings.asrAdjustment || 0) + manualOffset;
    params.adjustments.maghrib = (settings.maghribAdjustment || 0) + manualOffset;
    params.adjustments.isha = (settings.ishaAdjustment || 0) + manualOffset;

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const prayerNames: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

    const prayers: PrayerTime[] = prayerNames.map((name) => {
      const time = prayerTimes[name] instanceof Date ? prayerTimes[name] : new Date();
      return {
        name,
        label: PRAYER_LABELS[name],
        time,
        completed: completedPrayers.includes(name),
        notificationsEnabled: true,
      };
    });

    const now = new Date();
    // Find next prayer today
    let nextPrayer: PrayerTime | null =
      prayers.find((p) => p.time.getTime() > now.getTime()) ?? null;

    // If all prayers today have passed (e.g. after Isha), next prayer is tomorrow's Fajr
    if (!nextPrayer) {
      const tomorrow = addDays(date, 1);
      const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
      nextPrayer = {
        name: "fajr",
        label: PRAYER_LABELS.fajr,
        time: tomorrowTimes.fajr,
        completed: false,
        notificationsEnabled: true,
      };
    }

    return {
      date,
      prayers,
      nextPrayer,
      location: {
        city: settings.city || (settings.timezone?.includes("Dhaka") ? "Dhaka" : "Current Location"),
        country: settings.country || "Global",
      },
      isMockData: false,
    };
  }
}
