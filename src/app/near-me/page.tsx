import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCitiesWithCounts } from "@/lib/data";
import { DEFAULT_RADIUS, RADIUS_OPTIONS } from "@/lib/geo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { NearMeLocator } from "@/components/NearMeLocator";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

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

const METRO_LIMIT = 12;

const metroSearchHref = (slug: string) =>
  `/search?near=${encodeURIComponent(`city:${slug}`)}&radius=${DEFAULT_RADIUS}&sort=distance&dir=asc`;

export default async function NearMePage() {
  const cities = await getCitiesWithCounts();
  const metros = cities
    .filter((c) => c.schoolCount > 0)
    .sort((a, b) => b.schoolCount - a.schoolCount || a.name.localeCompare(b.name))
    .slice(0, METRO_LIMIT);
  const [minRadius, maxRadius] = [RADIUS_OPTIONS[0], RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]];

  const steps = [
    {
      title: "Miles are measured from the airport",
      body: "Every school sits at its home airport (or its own hangar when it has told us where that is), so the distance you see is the drive you would make to fly.",
    },
    {
      title: "Pick a radius that fits your week",
      body: "Most students train two or three times a week. A school under an hour away is usually the one you will actually finish at.",
    },
    {
      title: "Your location stays in your browser",
      body: "The coordinates go into the search page's address bar and nowhere else — we never store them. Deny the prompt and everything below still works.",
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: title, path: "/near-me" }])} />
      <div className="pb-20">
        <PageHero
          eyebrow={`Within ${minRadius} to ${maxRadius} miles`}
          title="Flight schools near me"
          description="Pick a radius, share your location once, and see every school within driving distance — closest first."
        >
          <NearMeLocator />
        </PageHero>

        <Section
          eyebrow="No location? No problem"
          title="Start from a metro"
          description={`The ${METRO_LIMIT} areas with the most schools. Each one runs the same distance search from the city centre.`}
          action={{ href: "/cities", label: "All cities" }}
          size="default"
          className="py-14 md:py-16"
        >
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {metros.map((city, i) => (
              <Reveal key={city.id} index={i} as="li" className="h-full">
                <Card href={metroSearchHref(city.slug)} className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-muted tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <ArrowUpRight
                      size={16}
                      aria-hidden
                      className="shrink-0 text-muted transition-[color,transform,translate] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-ink"
                    />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                    {city.name}
                    <span className="ml-1.5 font-mono text-xs font-medium text-muted">
                      {city.stateAbbreviation}
                    </span>
                  </p>
                  <p className="mt-auto pt-3 text-sm text-muted tabular-nums">
                    {city.schoolCount} {city.schoolCount === 1 ? "school" : "schools"}
                  </p>
                </Card>
              </Reveal>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">
            Prefer a map-style list?{" "}
            <Link href="/states" className="font-medium text-ink underline-offset-4 hover:underline">
              Browse by state
            </Link>
            {" · "}
            <Link href="/airports" className="font-medium text-ink underline-offset-4 hover:underline">
              Browse by airport
            </Link>
          </p>
        </Section>

        <Section size="default" className="border-t border-line py-14 md:py-16">
          <Eyebrow accent className="mb-8">
            How the near-me search works
          </Eyebrow>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step, i) => (
              <li key={step.title} className="relative border-t border-line pt-5">
                <span className="absolute -top-px left-0 h-px w-10 bg-accent" aria-hidden />
                <span className="font-mono text-xs text-accent-ink tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 font-display text-lg font-bold leading-tight tracking-tight text-ink">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/search"
            className="group mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
          >
            Open the full search with every filter
            <ArrowRight
              size={15}
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </Section>
      </div>
    </>
  );
}
