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
    <section className="space-y-1">
      <p className="text-sm font-medium text-primary">Assalamu Alaikum</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {profile.name} 👋
      </h1>
      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
        <span>{formatGregorianDate(date)}</span>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <span>{formatHijriDate(date)}</span>
      </div>
    </section>
  );
}
