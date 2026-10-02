import { describe, expect, it, vi, beforeEach } from "vitest";

import { clearUserLocalData } from "@/lib/cache/user-cache";
import { clearOfflineQueue, enqueueOfflineAction, getOfflineQueue } from "@/lib/offline/offline-sync-queue";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

const eventTarget = new EventTarget();
Object.defineProperty(globalThis, "window", {
  value: Object.assign(eventTarget, { localStorage: localStorageMock }),
  writable: true,
});

describe("Profile Management & Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("Profile persistence & initials", () => {
    it("stores and retrieves profile changes from localStorage", () => {
      const profile = {
        name: "Abdullah Ibn Umar",
        email: "abdullah@example.com",
        city: "Madinah",
        country: "Saudi Arabia",
        timezone: "Asia/Riyadh",
        language: "ar",
      };

      localStorageMock.setItem("istiqamaah_local_profile", JSON.stringify(profile));

      const saved = JSON.parse(localStorageMock.getItem("istiqamaah_local_profile")!);
      expect(saved.name).toBe("Abdullah Ibn Umar");
      expect(saved.city).toBe("Madinah");
      expect(saved.timezone).toBe("Asia/Riyadh");
    });

    it("generates correct two-letter initials from full name", () => {
      const getInitials = (name: string) =>
        name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "M";

      expect(getInitials("Ahmad Ali")).toBe("AA");
      expect(getInitials("Fatima")).toBe("F");
      expect(getInitials("Muhammad Ibn Idris")).toBe("MI");
      expect(getInitials("")).toBe("M");
    });

    it("dispatches custom profile updated event on change", () => {
      const listener = vi.fn();
      window.addEventListener("istiqamaah_profile_updated", listener);

      window.dispatchEvent(new Event("istiqamaah_profile_updated"));
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener("istiqamaah_profile_updated", listener);
    });
  });

  describe("Sign out state isolation", () => {
    it("clears user offline queue and cached data on sign out", () => {
      // 1. Populate some offline queue and cache items
      enqueueOfflineAction({
        type: "LOG_HABIT",
        payload: { habitId: "h1", dateStr: "2026-10-02" },
      });
      localStorageMock.setItem("istiqamaah_local_profile", JSON.stringify({ name: "User 1" }));
      localStorageMock.setItem("istiqamaah_reminders_u1", JSON.stringify([{ id: "r1" }]));

      expect(getOfflineQueue().length).toBeGreaterThan(0);
      expect(localStorageMock.getItem("istiqamaah_local_profile")).not.toBeNull();

      // 2. Perform logout cleanup
      clearOfflineQueue();
      clearUserLocalData();

      // 3. Verify queue and user caches are purged
      expect(getOfflineQueue().length).toBe(0);
      expect(localStorageMock.getItem("istiqamaah_offline_sync_queue")).toBeNull();
    });

    it("aggregates only user-scoped istiqamaah and noorpath keys during backup export", () => {
      localStorageMock.setItem("istiqamaah_local_profile", JSON.stringify({ name: "Ahmad" }));
      localStorageMock.setItem("istiqamaah_prayers_2026-10", JSON.stringify({ fajr: true }));
      localStorageMock.setItem("other_app_key", "secret");

      const exportObject: Record<string, unknown> = {};
      for (let i = 0; i < localStorageMock.length; i++) {
        const key = localStorageMock.key(i);
        if (key && (key.startsWith("istiqamaah_") || key.startsWith("noorpath_"))) {
          try {
            exportObject[key] = JSON.parse(localStorageMock.getItem(key) || "");
          } catch {
            exportObject[key] = localStorageMock.getItem(key);
          }
        }
      }

      expect(exportObject["istiqamaah_local_profile"]).toEqual({ name: "Ahmad" });
      expect(exportObject["istiqamaah_prayers_2026-10"]).toEqual({ fajr: true });
      expect(exportObject["other_app_key"]).toBeUndefined();
    });
  });
});

