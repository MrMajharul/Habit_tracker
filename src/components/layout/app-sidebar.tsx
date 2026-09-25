"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AppLogo } from "@/components/ui/app-logo";
import { cn } from "@/lib/utils";
import { mainNavItems } from "@/features/navigation/nav-items";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard">
          <AppLogo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">Appearance</p>
        <ThemeToggle />
      </div>
    </aside>
  );
}
