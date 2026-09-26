import Link from "next/link";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AppLogo } from "@/components/ui/app-logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top navigation header with logo */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <AppLogo size="sm" />
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
