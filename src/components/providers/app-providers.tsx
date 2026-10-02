"use client";

import { Toaster } from "@/components/ui/sonner";

import { AuthStateSync } from "@/components/auth/auth-state-sync";
import { AlarmSchedulerProvider } from "./alarm-scheduler-provider";
import { PwaRegister } from "./pwa-register";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthStateSync />
        <AlarmSchedulerProvider>
          {children}
        </AlarmSchedulerProvider>
        <PwaRegister />
        <Toaster richColors closeButton position="top-center" />
      </QueryProvider>
    </ThemeProvider>
  );
}
