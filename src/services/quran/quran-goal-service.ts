// ============================================================================
// Qur'an Goal Service — Daily Target + Spiritual Goals
// ============================================================================

import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import type {
  QuranGoalSettings,
  SpiritualGoal,
  SpiritualGoalType,
} from "./quran-types";

const GOAL_SETTINGS_KEY = "istiqamaah_quran_goal_settings";
const SPIRITUAL_GOALS_KEY = "istiqamaah_spiritual_goals";

// ─── Daily Target Settings ──────────────────────────────────────────────────

export function getGoalSettings(): QuranGoalSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GOAL_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGoalSettings(settings: QuranGoalSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GOAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }

  enqueueOfflineAction({
    type: "update_quran_goal",
    payload: {
      id: settings.id,
      user_id: settings.userId,
      target_type: settings.targetType,
      target_value: settings.targetValue,
      is_enabled: settings.isEnabled,
      prayer_anchor: settings.prayerAnchor,
    },
  });
}

export function createGoalSettings(
  settings: Omit<QuranGoalSettings, "id" | "createdAt" | "updatedAt">,
): QuranGoalSettings {
  const newSettings: QuranGoalSettings = {
    ...settings,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveGoalSettings(newSettings);
  return newSettings;
}

// ─── Spiritual Goals ────────────────────────────────────────────────────────

function getGoals(): SpiritualGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SPIRITUAL_GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGoals(goals: SpiritualGoal[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SPIRITUAL_GOALS_KEY, JSON.stringify(goals));
  } catch {
    // Ignore
  }
}

export function createSpiritualGoal(
  goal: Omit<SpiritualGoal, "id" | "createdAt" | "updatedAt">,
): SpiritualGoal {
  const newGoal: SpiritualGoal = {
    ...goal,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const goals = getGoals();
  goals.unshift(newGoal);
  saveGoals(goals);

  enqueueOfflineAction({
    type: "update_quran_goal",
    payload: { ...newGoal, action: "create_spiritual_goal" },
  });

  return newGoal;
}

export function updateSpiritualGoal(
  id: string,
  updates: Partial<SpiritualGoal>,
): SpiritualGoal | null {
  const goals = getGoals();
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return null;

  goals[idx] = {
    ...goals[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Auto-complete if target reached
  if (
    goals[idx].currentValue >= goals[idx].targetValue &&
    !goals[idx].isCompleted
  ) {
    goals[idx].isCompleted = true;
  }

  saveGoals(goals);

  enqueueOfflineAction({
    type: "update_quran_goal",
    payload: { id, ...updates, action: "update_spiritual_goal" },
  });

  return goals[idx];
}

export function deleteSpiritualGoal(id: string): void {
  const goals = getGoals().filter((g) => g.id !== id);
  saveGoals(goals);
}

export function getSpiritualGoals(): SpiritualGoal[] {
  return getGoals();
}

export function getSpiritualGoalsByType(
  type: SpiritualGoalType,
): SpiritualGoal[] {
  return getGoals().filter((g) => g.type === type);
}

export function getActiveSpiritualGoals(): SpiritualGoal[] {
  return getGoals().filter((g) => !g.isCompleted);
}

export const quranGoalService = {
  getGoalSettings,
  saveGoalSettings,
  createGoalSettings,
  createSpiritualGoal,
  updateSpiritualGoal,
  deleteSpiritualGoal,
  getSpiritualGoals,
  getSpiritualGoalsByType,
  getActiveSpiritualGoals,
};
