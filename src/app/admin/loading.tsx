import { Container } from "@/components/ui/Container";

/** Narrow skeleton matching AdminPage: hero band + stacked card placeholders */
export default function Loading() {
  return (
    <div className="pb-20 motion-safe:animate-pulse" aria-busy="true" aria-label="Loading">
      <section className="border-b border-line bg-surface">
        <Container size="narrow" className="space-y-4 py-12 md:py-16">
          <div className="h-3 w-32 rounded bg-surface-2" />
          <div className="h-12 w-2/3 max-w-xl rounded-lg bg-surface-2" />
          <div className="h-4 w-1/3 max-w-xs rounded bg-surface-2" />
        </Container>
      </section>
      <Container size="narrow" className="py-12">
        <div className="mb-6 h-7 w-40 rounded bg-surface-2" />
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-6">
              <div className="mb-4 h-3 w-1/3 rounded bg-surface-2" />
              <div className="mb-2 h-5 w-5/6 rounded bg-surface-2" />
              <div className="h-5 w-2/3 rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
