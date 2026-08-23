import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getCitiesWithCounts, getStates } from "@/lib/data";
import { RADIUS_OPTIONS } from "@/lib/geo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { NearMeLocator } from "@/components/NearMeLocator";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";

const title = "Flight Schools Near Me";
const description =
  "Find flight schools near you. Share your location to see pilot training within 25 to 250 miles, sorted by distance — or start from your metro area, state, or a nearby airport.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/near-me" },
  openGraph: { title, description, url: "/near-me", type: "website" },
  twitter: { title, description },
};

const h2 = "mb-5 font-display text-2xl font-bold tracking-tight text-ink";

export default async function NearMePage() {
  const [cities, states] = await Promise.all([getCitiesWithCounts(), getStates()]);
  const metros = cities
    .filter((c) => c.schoolCount > 0)
    .sort((a, b) => b.schoolCount - a.schoolCount || a.name.localeCompare(b.name));
  const populatedStates = states.filter((s) => s.schoolCount > 0);
  const radii = RADIUS_OPTIONS.map((r) => `${r}`).join(", ");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: title, path: "/near-me" }])} />
      <div className="pb-20">
        <PageHero
          eyebrow="Within 25 to 250 miles"
          title="Flight schools near me"
          description="Share your location once and we'll show every school within driving distance, closest first — with its airport, programs, ratings and a direct way to request information."
        >
          <NearMeLocator />
        </PageHero>

        <Container size="default" className="space-y-14 py-12">
          <section>
            <h2 className={h2}>Start from your metro</h2>
            <p className="mb-5 max-w-prose text-sm text-muted">
              Each city page lists the schools based there and the airports they fly from, plus the
              neighbouring cities that share the same training airspace.
            </p>
            <div className="flex flex-wrap gap-2">
              {metros.map((city) => (
                <Chip key={city.id} href={`/cities/${city.slug}`}>
                  {city.name}
                  <span className="font-mono text-xs text-muted">
                    {city.stateAbbreviation} · {city.schoolCount}
                  </span>
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <h2 className={h2}>Browse by state</h2>
            <div className="flex flex-wrap gap-2">
              {populatedStates.map((state) => (
                <Chip key={state.id} href={`/states/${state.slug}`}>
                  {state.name}
                  <span className="font-mono text-xs text-muted">
                    {state.schoolCount} {state.schoolCount === 1 ? "school" : "schools"}
                  </span>
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <h2 className={h2}>How the near-me search works</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <p className="font-semibold text-ink">Distance is measured from the airport</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Every school is placed at its primary airport (or its own hangar when it has given
                  us a location), so the miles you see are the miles you would drive to fly.
                </p>
              </Card>
              <Card className="p-5">
                <p className="font-semibold text-ink">Pick a radius that fits your week</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Choose {radii} miles. Most students train two or three times a week, so a school
                  under an hour away is usually the one you will actually finish at.
                </p>
              </Card>
              <Card className="p-5">
                <p className="font-semibold text-ink">Your location stays in your browser</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  The coordinates go into the search page&apos;s address bar and nowhere else — we do
                  not store them. Deny the prompt and you can still search by airport code or city.
                </p>
              </Card>
            </div>
            <Button href="/search" variant="secondary" className="mt-6">
              Open the full search
              <ArrowRight size={15} aria-hidden />
            </Button>
          </section>
        </Container>
      </div>
    </>
  );
}
