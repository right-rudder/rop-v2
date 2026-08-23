import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Award, Timer } from "lucide-react";
import {
  getProgramBySlug,
  getProgramsBySlugs,
  getSchoolsByProgram,
  getLocationMaps,
  getAirports,
} from "@/lib/data";
import { SchoolsExplorer } from "@/components/SchoolsExplorer";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { schoolHref } from "@/lib/utils";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, schoolListJsonLd } from "@/lib/structured-data";
import { metaDescription } from "@/lib/seo";

type Props = { params: Promise<{ programSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programSlug } = await params;
  const program = await getProgramBySlug(programSlug);
  if (!program) return { title: "Program Not Found" };

  const title = `${program.name} – Flight Training Requirements & Schools`;
  const description = metaDescription(program.description);
  const canonical = `/programs/${programSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

const h2 = "mb-4 font-display text-2xl font-bold tracking-tight text-ink";

export default async function ProgramDetailPage({ params }: Props) {
  const { programSlug } = await params;
  const program = await getProgramBySlug(programSlug);
  if (!program) notFound();

  const [rawSchools, { cityNameBySlug, stateBySlug }, airports, prereqs] =
    await Promise.all([
      getSchoolsByProgram(program.slug),
      getLocationMaps(),
      getAirports(),
      getProgramsBySlugs(program.prerequisites ?? []),
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

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Flight Training Programs", path: "/programs" },
    { name: program.name, path: `/programs/${program.slug}` },
  ]);
  const schoolList = schoolListJsonLd(`Schools offering ${program.shortName}`, rawSchools);

  const facts = [
    program.certificate && {
      Icon: Award,
      label: "Certificate / endorsement issued",
      value: program.certificate,
    },
    program.minimumHours && {
      Icon: Timer,
      label: "Minimum flight hours (Part 61)",
      value: `${program.minimumHours} hours`,
    },
    program.typicalDuration && {
      Icon: Clock,
      label: "Typical duration",
      value: program.typicalDuration,
    },
  ].filter(Boolean) as { Icon: typeof Clock; label: string; value: string }[];

  return (
    <div className="pb-20">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={schoolList} />
      <PageHero
        back={{ href: "/programs", label: "All programs" }}
        eyebrow={
          <Badge tone="accent">
            {program.faaPart
              ? `FAR Part ${program.faaPart === "both" ? "61 / 141" : program.faaPart}`
              : "Endorsement / add-on"}
          </Badge>
        }
        title={program.name}
        meta={
          <>
            {program.minimumHours && (
              <span className="font-mono">{program.minimumHours}+ flight hours (Part 61 minimum)</span>
            )}
            {program.typicalDuration && (
              <span className="font-mono">Typically {program.typicalDuration}</span>
            )}
          </>
        }
      />

      <Container size="default" className="space-y-14 py-12">
        {/* Overview */}
        <section>
          <h2 className={h2}>What is the {program.shortName}?</h2>
          <p className="max-w-prose leading-relaxed text-muted">{program.description}</p>
        </section>

        {/* Key facts */}
        {facts.length > 0 && (
          <section>
            <h2 className={h2}>Key requirements</h2>
            <Card className="divide-y divide-line">
              {facts.map(({ Icon, label, value }) => (
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
        )}

        {/* Prerequisites */}
        {prereqs.length > 0 && (
          <section>
            <h2 className={h2}>Prerequisites</h2>
            <p className="mb-3 text-sm text-muted">
              You must hold the following before beginning this program:
            </p>
            <div className="flex flex-wrap gap-2">
              {prereqs.map(
                (prereq) =>
                  prereq && (
                    <Chip key={prereq.slug} href={`/programs/${prereq.slug}`}>
                      {prereq.shortName}
                    </Chip>
                  ),
              )}
            </div>
          </section>
        )}

        {/* Schools offering this program */}
        <SchoolsExplorer schools={schools} heading={`Schools offering ${program.shortName}`} />
      </Container>
    </div>
  );
}
