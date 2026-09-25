/**
 * AppLogo — the Istiqamaah brand mark.
 *
 * Usage:
 *   <AppLogo />                  — icon + name (sidebar default)
 *   <AppLogo size="lg" showTagline />  — auth/onboarding header
 *   <AppLogo iconOnly />         — mobile nav / favoured tight spaces
 */

import Image from "next/image";

import { cn } from "@/lib/utils";

interface AppLogoProps {
  /** Controls the overall scale of the lockup. */
  size?: "sm" | "md" | "lg";
  /** Show the "Balance your Deen. Organize your life." tagline. */
  showTagline?: boolean;
  /** Render only the icon, no text. */
  iconOnly?: boolean;
  className?: string;
}

const iconDimensions = {
  sm: 28,
  md: 36,
  lg: 48,
} as const;

const nameSizeClass = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-2xl font-bold tracking-tight",
} as const;

export function AppLogo({
  size = "md",
  showTagline = false,
  iconOnly = false,
  className,
}: AppLogoProps) {
  const dim = iconDimensions[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* ── Icon ─────────────────────────────── */}
      <div
        className="shrink-0 rounded-xl overflow-hidden shadow-sm"
        style={{ width: dim, height: dim }}
      >
        <Image
          src="/icons/icon-512.png"
          alt="Istiqamaah icon"
          width={dim}
          height={dim}
          priority
          unoptimized
        />
      </div>

      {/* ── Wordmark + tagline ────────────────── */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              nameSizeClass[size],
              "text-sidebar-foreground dark:text-foreground",
            )}
          >
            Istiqamaah
          </span>
          {showTagline && (
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              Balance your Deen. Organize your life.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
