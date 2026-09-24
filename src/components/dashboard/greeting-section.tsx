import { DailyReflectionDialog } from "@/components/reflection/daily-reflection-dialog";
import { formatGregorianDate, formatHijriDate } from "@/lib/dates";
import type { UserProfile } from "@/types";

interface GreetingSectionProps {
  profile: UserProfile;
  date?: Date;
}

export function GreetingSection({
  profile,
  date = new Date(),
}: GreetingSectionProps) {
  return (
    <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
          Assalamu Alaikum
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {profile.name} 👋
        </h1>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
          <span>{formatGregorianDate(date)}</span>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span>{formatHijriDate(date)}</span>
        </div>
      </div>
      <div>
        <DailyReflectionDialog />
      </div>
    </section>
  );
}
