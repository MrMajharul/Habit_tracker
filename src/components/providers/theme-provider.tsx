"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface UseThemeProps {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: ResolvedTheme;
  themes: string[];
  systemTheme: ResolvedTheme;
  forcedTheme?: string;
}

const ThemeContext = React.createContext<UseThemeProps>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  themes: ["light", "dark", "system"],
  systemTheme: "light",
});

export const useTheme = () => React.useContext(ThemeContext);

const MEDIA = "(prefers-color-scheme: dark)";

function subscribeToMedia(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia(MEDIA);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSystemThemeSnapshot(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

function getSystemThemeServerSnapshot(): ResolvedTheme {
  return "light";
}

function createThemeStore(storageKey: string, defaultTheme: string) {
  let listeners: (() => void)[] = [];

  const subscribe = (callback: () => void) => {
    listeners.push(callback);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        callback();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
      window.removeEventListener("storage", handleStorage);
    };
  };

  const getSnapshot = (): string => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      return localStorage.getItem(storageKey) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  };

  const getServerSnapshot = () => defaultTheme;

  const set = (newTheme: string) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // Ignore storage errors
    }
    listeners.forEach((l) => l());
  };

  return { subscribe, getSnapshot, getServerSnapshot, set };
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  disableTransitionOnChange = true,
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: unknown;
}) {
  const store = React.useMemo(
    () => createThemeStore(storageKey, defaultTheme),
    [storageKey, defaultTheme],
  );

  const theme = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const systemTheme = React.useSyncExternalStore(
    subscribeToMedia,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : theme === "dark" ? "dark" : "light";

  React.useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (disableTransitionOnChange) {
      const css = document.createElement("style");
      css.appendChild(
        document.createTextNode(
          "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}",
        ),
      );
      document.head.appendChild(css);
      cleanup = () => {
        (() => window.getComputedStyle(document.body))();
        setTimeout(() => {
          if (css.parentNode) css.parentNode.removeChild(css);
        }, 1);
      };
    }

    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (cleanup) cleanup();
  }, [resolvedTheme, disableTransitionOnChange]);

  const value = React.useMemo<UseThemeProps>(
    () => ({
      theme,
      setTheme: store.set,
      resolvedTheme,
      themes: ["light", "dark", "system"],
      systemTheme,
    }),
    [theme, store.set, resolvedTheme, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
