import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <div className="rounded-lg border">
        {Array.from({ length: 5 }).map((_, row) => (
          <div
            key={row}
            className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </main>
  );
}
