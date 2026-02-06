export function Skeleton({ className = "" }) {
  return (
    <div className={`bg-gradient-to-r from-shimmer via-shimmer-hi to-shimmer bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-edge rounded-xl p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-edge rounded-xl p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-10 w-20 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SessionSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-edge rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-edge rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
