"use client";

import { Toaster } from "@/components/ui/sonner";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </QueryProvider>
    </ThemeProvider>
  );
}
