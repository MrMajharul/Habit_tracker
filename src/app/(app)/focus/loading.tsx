import { Skeleton } from "@/components/ui/skeleton";

export default function FocusLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Mode selection buttons */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>

      {/* Timer circular display skeleton */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="flex size-64 items-center justify-center rounded-full border-4 border-muted/50 p-6">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-16 w-36" />
            <Skeleton className="mx-auto h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-12 w-32 rounded-xl" />
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>

      {/* Task & Subject Selector skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
