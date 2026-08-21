import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Gauge, Plane, Layers } from "lucide-react";
import {
  getAircraftBySlug,
  getSchoolsByAircraftSlug,
  getProgramsBySlugs,
  getLocationMaps,
  getAirports,
} from "@/lib/data";
import type { AircraftCategory } from "@/lib/types";
import { SchoolsExplorer } from "@/components/SchoolsExplorer";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { schoolHref } from "@/lib/utils";

type Props = { params: Promise<{ aircraftSlug: string }> };

const categoryLabels: Record<AircraftCategory, string> = {
  "single-engine": "Single-engine",
  "multi-engine": "Multi-engine",
  helicopter: "Helicopter",
  glider: "Glider",
  sport: "Sport / LSA",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { aircraftSlug } = await params;
  const aircraft = await getAircraftBySlug(aircraftSlug);
  if (!aircraft) return { title: "Aircraft Not Found" };

  const title = `${aircraft.displayName} – Flight Training Aircraft`;
  const description = aircraft.description.slice(0, 160);
  const canonical = `/aircraft/${aircraftSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

const h2 = "mb-4 font-display text-2xl font-bold tracking-tight text-ink";

export default async function AircraftDetailPage({ params }: Props) {
  const { aircraftSlug } = await params;
  const aircraft = await getAircraftBySlug(aircraftSlug);
  if (!aircraft) notFound();

  const [rawSchools, { cityNameBySlug, stateBySlug }, airports, commonUsePrograms] =
    await Promise.all([
      getSchoolsByAircraftSlug(aircraft.slug),
      getLocationMaps(),
      getAirports(),
      getProgramsBySlugs(aircraft.commonUse),
    ]);
  const airportNameByIcao = Object.fromEntries(
    airports.map((a) => [a.icao, a.name]),
  );

  const schools = rawSchools.map((school) => {
    const cityName = cityNameBySlug[school.citySlug];
    const state = stateBySlug[school.stateSlug];
    return {
      id: school.id,
      name: school.name,
      href: schoolHref(school),
      airportCode: school.primaryAirportCode,
      airportName: airportNameByIcao[school.primaryAirportCode],
      location: cityName && state ? `${cityName}, ${state.abbreviation}` : undefined,
      rating: school.rating,
      reviewCount: school.reviewCount,
    };
  });

  const engines = aircraft.engineCount === 1 ? "Single engine" : `${aircraft.engineCount} engines`;
  const specs = [
    { Icon: Layers, label: "Category", value: categoryLabels[aircraft.category] },
    { Icon: Plane, label: "Engines", value: engines },
    aircraft.typicalCruise && { Icon: Gauge, label: "Typical cruise speed", value: aircraft.typicalCruise },
  ].filter(Boolean) as { Icon: typeof Plane; label: string; value: string }[];

  return (
    <div className="pb-20">
      <PageHero
        back={{ href: "/aircraft", label: "All aircraft" }}
        eyebrow={
          <>
            <Badge tone="accent">{categoryLabels[aircraft.category]}</Badge>
            <span className="text-line">/</span>
            <span>{aircraft.make}</span>
          </>
        }
        title={aircraft.displayName}
        meta={
          <>
            <span className="font-mono">{engines}</span>
            {aircraft.typicalCruise && <span className="font-mono">Cruise {aircraft.typicalCruise}</span>}
          </>
        }
      />

      <Container size="default" className="space-y-14 py-12">
        {/* About */}
        <section>
          <h2 className={h2}>About the {aircraft.displayName}</h2>
          <p className="max-w-prose leading-relaxed text-muted">{aircraft.description}</p>
        </section>

        {/* Specs */}
        <section>
          <h2 className={h2}>Specifications</h2>
          <Card className="divide-y divide-line">
            {specs.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                  <Icon size={15} />
                </span>
                <div>
                  <p className="text-xs text-muted">{label}</p>
                  <p className="font-semibold text-ink">{value}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>

        {/* Commonly used for */}
        {commonUsePrograms.length > 0 && (
          <section>
            <h2 className={h2}>Commonly used for</h2>
            <div className="flex flex-wrap gap-2">
              {commonUsePrograms.map(
                (program) =>
                  program && (
                    <Chip key={program.slug} href={`/programs/${program.slug}`}>
                      {program.shortName}
                    </Chip>
                  ),
              )}
            </div>
          </section>
        )}

        {/* Schools with this aircraft */}
        <SchoolsExplorer schools={schools} heading={`Schools flying the ${aircraft.displayName}`} />
      </Container>
    </div>
  );
}
