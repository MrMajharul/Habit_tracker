import {
  Coordinates,
  PrayerTimes,
} from "adhan";

import { getCalculationParameters } from "./adhan-prayer-provider";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ForbiddenTimeWindow {
  name: string;
  start: Date;
  end: Date;
  description: string;
}

interface ForbiddenTimesInput {
  latitude: number;
  longitude: number;
  calculationMethod: string;
  asrMadhhab: "standard" | "hanafi";
  date?: Date;
}

// ─── Constants ───────────────────────────────────────────────────────────────
// Standard window durations based on Islamic jurisprudence
const SUNRISE_WINDOW_MINUTES = 15; // ~15 min after sunrise
const ZAWAL_WINDOW_MINUTES = 5; // ~5 min around solar noon (when sun is at zenith)
const SUNSET_WINDOW_MINUTES = 15; // ~15 min before sunset (Maghrib)

/**
 * Computes the three forbidden prayer time windows for the given day/location.
 *
 * Based on established Islamic jurisprudence (fiqh):
 * 1. After Sunrise — from sunrise until ~15 min after (sun rises a spear's length)
 * 2. At Zawal — when the sun is at its zenith (solar noon ± a few minutes)
 *    Using PrayerTimes.dhuhr as the solar transit point.
 * 3. Before Sunset — ~15 min before Maghrib (sunset)
 *
 * References: Sahih Muslim 831, Sunan Abu Dawud 1274
 * These apply to voluntary (Nafl) prayers only; obligatory (Fard) prayers are not affected.
 */
export function computeForbiddenTimes(input: ForbiddenTimesInput): ForbiddenTimeWindow[] {
  const { latitude, longitude, calculationMethod, asrMadhhab, date = new Date() } = input;

  try {
    const coordinates = new Coordinates(latitude, longitude);
    const params = getCalculationParameters(calculationMethod, asrMadhhab);
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const sunrise = prayerTimes.sunrise;
    // Dhuhr in the adhan library is calculated at solar transit (noon) —
    // this IS the zawal point.
    const zawal = prayerTimes.dhuhr;
    const maghrib = prayerTimes.maghrib;

    const windows: ForbiddenTimeWindow[] = [];

    // 1. After Sunrise
    if (sunrise instanceof Date && !isNaN(sunrise.getTime())) {
      const sunriseEnd = new Date(sunrise.getTime() + SUNRISE_WINDOW_MINUTES * 60 * 1000);
      windows.push({
        name: "After Sunrise",
        start: sunrise,
        end: sunriseEnd,
        description: "From sunrise until the sun has risen a spear's length (~15 minutes).",
      });
    }

    // 2. At Zawal (Solar Noon)
    if (zawal instanceof Date && !isNaN(zawal.getTime())) {
      const zawalStart = new Date(zawal.getTime() - ZAWAL_WINDOW_MINUTES * 60 * 1000);
      const zawalEnd = new Date(zawal.getTime() + ZAWAL_WINDOW_MINUTES * 60 * 1000);
      windows.push({
        name: "Zawal (Solar Noon)",
        start: zawalStart,
        end: zawalEnd,
        description: "When the sun is at its zenith (meridian transit), before it starts declining.",
      });
    }

    // 3. Before Sunset
    if (maghrib instanceof Date && !isNaN(maghrib.getTime())) {
      const sunsetStart = new Date(maghrib.getTime() - SUNSET_WINDOW_MINUTES * 60 * 1000);
      windows.push({
        name: "Before Sunset",
        start: sunsetStart,
        end: maghrib,
        description: "When the sun turns pale/yellow before setting (~15 minutes before Maghrib).",
      });
    }

    return windows;
  } catch (error) {
    console.warn("Failed to compute forbidden prayer times:", error);
    return [];
  }
}
