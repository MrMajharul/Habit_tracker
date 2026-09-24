"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { moreNavItems } from "@/features/navigation/nav-items";

export function MobileMoreSheet() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMoreActive = moreNavItems.some(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
              isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          />
        }
      >
        <MoreHorizontal className={cn("size-5", isMoreActive && "stroke-[2.5]")} />
        <span>More</span>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetDescription>Explore all sections of the app</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-2 overflow-y-auto pb-8">
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "outline"}
                className="h-auto justify-start gap-3 px-4 py-3"
                render={
                  <Link href={item.href} onClick={() => setOpen(false)} />
                }
              >
                <Icon className="size-4 shrink-0" />
                <span className="text-left text-sm">{item.title}</span>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
