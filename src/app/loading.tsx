/**
 * Route-level loading skeleton shown while dynamic pages fetch from the
 * database. Mirrors the shared page shape: dark hero band + card grid.
 */
export default function Loading() {
  return (
    <div className="pb-20 animate-pulse" aria-busy="true" aria-label="Loading">
      {/* Hero placeholder */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="h-10 w-2/3 max-w-xl rounded-lg bg-white/15" />
          <div className="h-4 w-1/3 max-w-xs rounded bg-white/10" />
        </div>
      </section>

      {/* Content placeholder */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900"
            >
              <div className="h-44 bg-slate-100 dark:bg-slate-800" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
