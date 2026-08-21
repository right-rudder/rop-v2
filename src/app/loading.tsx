import { Container } from "@/components/ui/Container";

/**
 * Route-level loading skeleton shown while dynamic pages fetch from the
 * database. Mirrors the shared page shape: PageHero band + card grid.
 */
export default function Loading() {
  return (
    <div className="pb-20 motion-safe:animate-pulse" aria-busy="true" aria-label="Loading">
      {/* Hero placeholder */}
      <section className="border-b border-line bg-surface">
        <Container className="space-y-4 py-12 md:py-16">
          <div className="h-3 w-32 rounded bg-surface-2" />
          <div className="h-12 w-2/3 max-w-xl rounded-lg bg-surface-2" />
          <div className="h-4 w-1/3 max-w-xs rounded bg-surface-2" />
        </Container>
      </section>

      {/* Content placeholder */}
      <Container className="py-12">
        <div className="mb-6 h-3 w-40 rounded bg-surface-2" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-4 h-3 w-1/2 rounded bg-surface-2" />
              <div className="mb-2 h-5 w-5/6 rounded bg-surface-2" />
              <div className="mb-5 h-5 w-2/3 rounded bg-surface-2" />
              <div className="border-t border-line pt-4">
                <div className="h-3 w-1/3 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
