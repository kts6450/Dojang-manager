import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar placeholder */}
      <div className="hidden lg:block w-[240px] bg-slate-950 shrink-0" />

      <main className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-[60px] flex items-center justify-between px-6 bg-white border-b border-slate-200/80 shrink-0">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24 hidden md:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-6 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <Skeleton className="h-3 w-16 mb-3" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>

          {/* Toolbar skeleton */}
          <div className="flex gap-3 items-center justify-between">
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>

          {/* Table skeleton */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-20" />
                ))}
              </div>
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-4 border-b border-slate-50">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
