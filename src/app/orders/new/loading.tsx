import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>

      <Skeleton className="h-48 rounded-lg" />
    </main>
  );
}
