import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { getTrainerAircraft } from "@/lib/data";
import type { AircraftCategory } from "@/lib/types";
import AircraftFilterBar from "@/components/AircraftFilterBar";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Trainer Aircraft – Common Flight Training Aircraft",
  description:
    "Browse single-engine trainers, multi-engine aircraft, helicopters, and sport planes used at U.S. flight schools — specs, descriptions, and schools that fly each type.",
  alternates: { canonical: "/aircraft" },
  openGraph: {
    title: "Trainer Aircraft – Common Flight Training Aircraft",
    description:
      "Browse trainer aircraft used at U.S. flight schools — specs and schools that fly each type.",
    url: "/aircraft",
    type: "website",
  },
};

const categoryLabels: Record<AircraftCategory, string> = {
  "single-engine": "Single-engine",
  "multi-engine": "Multi-engine",
  helicopter: "Helicopter",
  glider: "Glider",
  sport: "Sport / LSA",
};

const categoryOrder: AircraftCategory[] = [
  "single-engine",
  "multi-engine",
  "helicopter",
  "sport",
  "glider",
];

export default async function AircraftPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category as AircraftCategory | undefined;

  const sorted = await getTrainerAircraft();
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      aircraft: sorted.filter((a) => a.category === cat),
    }))
    .filter((g) => g.aircraft.length > 0);

  const visibleGroups = activeCategory
    ? grouped.filter((g) => g.category === activeCategory)
    : grouped;

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${sorted.length} aircraft types`}
        title="Common flight training aircraft"
        description="From the Cessna 172 to the Piper Seminole — specs, descriptions, and the schools near you that fly each one."
      >
        <Suspense>
          <AircraftFilterBar />
        </Suspense>
      </PageHero>

      <Container size="default" className="space-y-12 py-12">
        {visibleGroups.length === 0 && (
          <p className="text-muted">No aircraft in this category yet.</p>
        )}
        {visibleGroups.map(({ category, label, aircraft }) => (
          <section key={category}>
            <Eyebrow accent className="mb-4">
              {label}
              <span className="text-line">/</span>
              {aircraft.length}
            </Eyebrow>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aircraft.map((ac) => (
                <Card key={ac.slug} href={`/aircraft/${ac.slug}`} className="flex h-full flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{ac.make}</p>
                      <h3 className="mt-0.5 font-display text-xl font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                        {ac.displayName}
                      </h3>
                    </div>
                    <ArrowUpRight
                      size={18}
                      aria-hidden
                      className="mt-1 shrink-0 text-muted transition-[color,transform,translate] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-ink"
                    />
                  </div>
                  <p className="mb-4 line-clamp-2 text-sm text-muted">{ac.description}</p>
                  <p className="mt-auto font-mono text-xs uppercase tracking-[0.12em] text-muted">
                    {ac.engineCount === 1 ? "Single engine" : `${ac.engineCount} engines`}
                    {ac.typicalCruise && ` · ${ac.typicalCruise}`}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </Container>
    </div>
  );
}
