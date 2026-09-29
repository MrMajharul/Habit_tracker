"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { mobileNavItems } from "@/features/navigation/nav-items";

import { MobileMoreSheet } from "./mobile-more-sheet";

import { useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden safe-bottom">
      <div className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2">
        {mobileNavItems.map((item) => {
          const isCurrent =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isPending = pendingHref === item.href;
          const isActive = isPending || (isCurrent && !pendingHref);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href !== pathname) {
                  setPendingHref(item.href);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
                isPending && "animate-pulse",
              )}
            >
              <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
              <span>{item.mobileLabel ?? item.title}</span>
            </Link>
          );
        })}
        <MobileMoreSheet />
      </div>
    </nav>
  );
}
