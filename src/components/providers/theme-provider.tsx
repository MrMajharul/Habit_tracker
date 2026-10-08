"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

const SCRIPT_TAG_WARNING =
  "Encountered a script tag while rendering React component";

if (typeof console !== "undefined") {
  const originalError = console.error;
  if (!(originalError as unknown as { __nextThemesPatched?: boolean }).__nextThemesPatched) {
    const patchedError = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes(SCRIPT_TAG_WARNING)) {
        return;
      }
      originalError.apply(console, args);
    };
    (patchedError as unknown as { __nextThemesPatched?: boolean }).__nextThemesPatched = true;
    console.error = patchedError;
  }
}

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
