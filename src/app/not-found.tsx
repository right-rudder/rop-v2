import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionalMotif } from "@/components/ui/SectionalMotif";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <SectionalMotif className="pointer-events-none absolute left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]" />
      <div className="relative">
        <Eyebrow accent className="justify-center">
          Off the chart
        </Eyebrow>
        <p className="mt-4 font-display text-[7rem] font-bold leading-none tracking-tighter text-ink md:text-[9rem]">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          We couldn&apos;t find that page. Try browsing flight schools by state, city, or
          airport instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Home</Button>
          <Button href="/states" variant="secondary">
            By state
          </Button>
          <Button href="/cities" variant="secondary">
            By city
          </Button>
          <Button href="/airports" variant="secondary">
            By airport
          </Button>
        </div>
      </div>
    </div>
  );
}
