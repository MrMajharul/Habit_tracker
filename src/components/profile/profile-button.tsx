"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileButtonProps {
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

const PROFILE_STORAGE_KEY = "istiqamaah_local_profile";
const LEGACY_STORAGE_KEY = "noorpath_local_profile";

export function ProfileButton({
  compact = false,
  className,
  onClick,
}: ProfileButtonProps) {
  const pathname = usePathname();
  const isProfileActive = pathname === "/profile";
  const [name, setName] = React.useState("Muslim");

  React.useEffect(() => {
    const readName = () => {
      try {
        const saved =
          localStorage.getItem(PROFILE_STORAGE_KEY) ??
          localStorage.getItem(LEGACY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name && typeof parsed.name === "string" && parsed.name.trim()) {
            setName(parsed.name.trim());
          }
        }
      } catch {
        // Ignore
      }
    };

    readName();
    window.addEventListener("storage", readName);
    window.addEventListener("istiqamaah_profile_updated", readName);
    return () => {
      window.removeEventListener("storage", readName);
      window.removeEventListener("istiqamaah_profile_updated", readName);
    };
  }, []);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "M";

  if (compact) {
    return (
      <Link
        href="/profile"
        onClick={onClick}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border transition-transform active:scale-95",
          isProfileActive
            ? "border-primary ring-2 ring-primary/20 bg-primary/10"
            : "border-border/80 bg-muted/30 hover:border-primary/50",
          className,
        )}
        title="Manage Profile"
        aria-label="Manage Profile"
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-bold text-primary bg-primary/10">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors group",
        isProfileActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/60",
        className,
      )}
      aria-label="Manage Profile"
    >
      <Avatar className="size-8 shrink-0 border border-primary/20 bg-primary/10">
        <AvatarFallback className="text-xs font-bold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          Manage Profile
        </p>
      </div>
    </Link>
  );
}
