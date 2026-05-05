export function MissionLoadingSkeleton() {
  return (
    <main className="container max-w-6xl py-10">
      <div className="animate-pulse">
        <div className="h-3 w-32 bg-secondary rounded mb-4" />
        <div className="h-9 w-72 bg-secondary rounded mb-2" />
        <div className="h-4 w-48 bg-secondary/60 rounded mb-10" />

        <div className="rounded-lg border bg-card p-5 mb-6">
          <div className="h-5 w-40 bg-secondary rounded mb-2" />
          <div className="h-3 w-56 bg-secondary/60 rounded" />
        </div>

        <div className="h-5 w-24 bg-secondary rounded mb-4" />
        <div className="grid md:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="h-10 w-10 bg-secondary rounded-lg mb-4" />
              <div className="h-5 w-48 bg-secondary rounded mb-2" />
              <div className="h-3 w-full bg-secondary/60 rounded mb-1.5" />
              <div className="h-3 w-3/4 bg-secondary/60 rounded mb-6" />
              <div className="h-2 w-full bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <main className="container max-w-6xl py-12">
      <div className="rounded-2xl bg-secondary/50 p-8 md:p-10 mb-12 animate-pulse">
        <div className="h-3 w-32 bg-secondary rounded mb-4" />
        <div className="h-12 w-2/3 bg-secondary rounded mb-3" />
        <div className="h-4 w-1/2 bg-secondary/60 rounded" />
      </div>
      <div className="flex items-end justify-between mb-6 animate-pulse">
        <div>
          <div className="h-5 w-24 bg-secondary rounded mb-2" />
          <div className="h-3 w-20 bg-secondary/60 rounded" />
        </div>
        <div className="h-10 w-44 bg-secondary rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="h-5 w-32 bg-secondary rounded mb-2" />
            <div className="h-3 w-24 bg-secondary/60 rounded mb-5" />
            <div className="h-2 w-full bg-secondary rounded mb-4" />
            <div className="h-3 w-full bg-secondary/60 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
