import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, tile) => (
          <Skeleton key={tile} className="h-20 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </main>
  );
}
