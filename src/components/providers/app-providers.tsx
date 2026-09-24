"use client";

import { Toaster } from "@/components/ui/sonner";

import { PwaRegister } from "./pwa-register";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <PwaRegister />
        <Toaster richColors closeButton position="top-center" />
      </QueryProvider>
    </ThemeProvider>
  );
}
