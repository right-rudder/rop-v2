import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  Map,
  MessageSquare,
  PencilLine,
  SlidersHorizontal,
} from "lucide-react";
import { SchoolCard } from "@/components/SchoolCard";
import { HeroSearch } from "@/components/HeroSearch";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LogoMark } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionalMotif } from "@/components/ui/SectionalMotif";
import {
  getCities,
  getFeaturedSchools,
  getProgramsBySlugs,
  getSearchIndex,
  getStates,
} from "@/lib/data";
import { schoolHref } from "@/lib/utils";

export const metadata: Metadata = {
  // The home page is the brand — don't let the layout template append it again
  title: { absolute: "Flight School Finder – Find Pilot Training Schools Across the USA" },
  description:
    "Find flight schools by city, state, airport, or school name. Compare ratings, programs, and contact info for pilot training across the USA.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Flight School Finder – Find Pilot Training Schools Across the USA",
    description:
      "Find flight schools by city, state, airport, or school name. Compare ratings, programs, and contact info for pilot training across the USA.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "Flight School Finder – Find Pilot Training Schools Across the USA",
    description: "Find flight schools by city, state, airport, or school name.",
  },
};

/** The training ladder, in the order pilots actually climb it */
const PATH_SLUGS = ["private-pilot", "instrument-rating", "commercial-pilot", "cfi"];

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export default async function Home() {
  const [featuredSchools, searchIndex, pathPrograms, states, cities] = await Promise.all([
    getFeaturedSchools(),
    getSearchIndex(),
    getProgramsBySlugs(PATH_SLUGS),
    getStates(),
    getCities(),
  ]);
  const schoolById = Object.fromEntries(searchIndex.schools.map((s) => [s.id, s]));
  const orderedPath = [...pathPrograms].sort(
    (a, b) => PATH_SLUGS.indexOf(a.slug) - PATH_SLUGS.indexOf(b.slug),
  );

  const stats = [
    { n: searchIndex.schools.length, label: "schools" },
    { n: states.length, label: "states" },
    { n: searchIndex.airports.length, label: "airports" },
  ];

  const browse = [
    {
      href: "/airports",
      Icon: LogoMark,
      title: "By airport",
      body: "Start from an ICAO code or field name.",
      count: `${searchIndex.airports.length} airports`,
    },
    {
      href: "/cities",
      Icon: Building2,
      title: "By city",
      body: "Schools near the metro you're in.",
      count: `${cities.length} cities`,
    },
    {
      href: "/states",
      Icon: Map,
      title: "By state",
      body: "Every listing, state by state.",
      count: `${states.length} states`,
    },
    {
      href: "/search",
      Icon: SlidersHorizontal,
      title: "Advanced search",
      body: "Filter by program, aircraft and location.",
      count: "All filters",
    },
  ];

  const accountPerks = [
    {
      Icon: MessageSquare,
      title: "Respond to comments",
      body: "Answer questions from prospective students and classmates, right on the review.",
    },
    {
      Icon: PencilLine,
      title: "Add or update listings",
      body: "Keep your school's programs, fleet and contact details current.",
    },
    {
      Icon: Bell,
      title: "Get notified",
      body: "Hear about new comments on your reviews or your school's page.",
    },
  ];

  return (
    <div>
      {/* Hero — no overflow-hidden on the section: the search dropdown must be
          able to extend past the hero's bottom edge. The motif is clipped in
          its own wrapper instead. */}
      <section className="relative border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <SectionalMotif className="absolute -right-48 -top-40 h-[44rem] w-[44rem] opacity-[0.18] sm:-right-40 md:-top-28 lg:-right-24 lg:-top-32 lg:h-[56rem] lg:w-[56rem]" />
        </div>

        <Container className="relative py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <Eyebrow accent className="animate-fade-up stagger" style={stagger(0)}>
              {stats.map((s, i) => (
                <span key={s.label} className="inline-flex items-center gap-2">
                  {i > 0 && <span className="text-line">/</span>}
                  <span className="text-ink">{s.n.toLocaleString()}</span> {s.label}
                </span>
              ))}
            </Eyebrow>

            <h1
              className="mt-6 animate-fade-up stagger text-5xl font-bold leading-[0.98] text-ink sm:text-6xl lg:text-7xl"
              style={stagger(1)}
            >
              Find pilot training schools across the USA.
            </h1>

            <p
              className="mt-6 max-w-xl animate-fade-up stagger text-lg text-muted md:text-xl"
              style={stagger(2)}
            >
              Search by school name, city, airport code, or state — then compare
              ratings, programs, and contact info before you book a discovery flight.
            </p>

            <div className="mt-10">
              <HeroSearch
                schools={searchIndex.schools}
                airports={searchIndex.airports}
                examples={["KFFZ", "Mesa, AZ", "Arizona"]}
                staggerIndex={3}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Featured schools */}
      <Section
        eyebrow="Featured"
        title="Featured flight schools"
        action={{ href: "/featured", label: "View all featured" }}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredSchools.map((school, i) => {
            const indexed = schoolById[school.id];
            return (
              <Reveal key={school.id} index={i} className="h-full">
                <SchoolCard
                  name={school.name}
                  location={indexed?.location ?? school.citySlug}
                  airportCode={school.primaryAirportCode}
                  rating={school.rating}
                  reviewCount={school.reviewCount}
                  href={schoolHref(school)}
                />
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Browse by */}
      <Section
        tone="tinted"
        eyebrow="Browse"
        title="Start from where you are"
        description="Every school is filed under its state, city and home airport — pick the way in that matches what you already know."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {browse.map((b, i) => (
            <Reveal key={b.href} index={i} className="h-full">
              <Card href={b.href} className="flex h-full flex-col p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                    <b.Icon size={18} className="text-accent-ink" />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                    {b.count}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight text-ink">
                  {b.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{b.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-ink">
                  Browse
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Training path — the content is a real sequence, so it's drawn as one */}
      <Section
        eyebrow="How flight training works"
        title="One certificate at a time"
        description="Most schools offer some combination of these certificates and ratings. Career pilots usually climb all four."
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
          <ol className="relative">
            {orderedPath.map((program, i) => (
              <Reveal key={program.id} index={i}>
                <li className="relative flex gap-5 pb-10 last:pb-0">
                  {/* connector */}
                  {i < orderedPath.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[11px] top-7 h-[calc(100%-0.5rem)] w-px border-l border-dashed border-accent/50"
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface"
                  >
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        href={`/programs/${program.slug}`}
                        className="font-display text-2xl font-bold tracking-tight text-ink transition-colors hover:text-accent-ink"
                      >
                        {program.shortName}
                      </Link>
                      <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                        {program.minimumHours && `${program.minimumHours}+ hrs`}
                        {program.minimumHours && program.typicalDuration && " · "}
                        {program.typicalDuration}
                      </span>
                    </div>
                    <p className="mt-2 max-w-prose text-muted">{program.description}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal index={2}>
            <div className="space-y-5 text-base leading-relaxed text-muted lg:sticky lg:top-24">
              <p>
                Flight training begins with the{" "}
                <strong className="font-semibold text-ink">Private Pilot certificate</strong>,
                which lets you fly small aircraft in good weather — the first step for anyone
                interested in aviation, whether for fun or for a career.
              </p>
              <p>
                To fly professionally you&apos;ll add an Instrument Rating, a Commercial
                certificate and often a Flight Instructor certificate. Most airline and
                well-paid pilot jobs require{" "}
                <strong className="font-semibold text-ink">1,500 hours</strong>, and many
                pilots instruct to build that time. Schools differ in approach, fleet and
                teaching style — Flight School Finder exists to help you compare them for your
                goals, budget and location.
              </p>
              <Button href="/programs" variant="secondary" size="sm">
                See all programs
                <ArrowRight size={14} />
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Why create an account */}
      <Section
        tone="tinted"
        eyebrow="Accounts"
        title="Why create an account?"
        action={{ href: "/signup", label: "Create a free account" }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {accountPerks.map((perk, i) => (
            <Reveal key={perk.title} index={i} className="h-full">
              <Card className="flex h-full flex-col p-6">
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                  <perk.Icon size={18} />
                </span>
                <h3 className="font-display text-xl font-bold tracking-tight text-ink">
                  {perk.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{perk.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Add your school */}
      <Section>
        <Reveal>
          <Card className="relative overflow-hidden p-8 md:p-12">
            <SectionalMotif
              animate={false}
              className="pointer-events-none absolute -right-32 -top-48 h-[30rem] w-[30rem] opacity-[0.12]"
            />
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
              <div>
                <Eyebrow accent className="mb-4">
                  For flight schools
                </Eyebrow>
                <h2 className="text-3xl font-bold leading-[1.05] text-ink md:text-4xl">
                  Looking to add or update your flight school?
                </h2>
                <p className="mt-4 max-w-xl text-muted">
                  Adding your school is simple. Create an account, submit your listing —
                  location, fleet, certificates offered, instructors — and our team reviews
                  it for accuracy. Once approved, it&apos;s visible to students searching for
                  training in your area.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button href="/signup">Create account</Button>
                  <Button href="/schools/add" variant="secondary">
                    Submit a listing
                  </Button>
                </div>
              </div>
              <ol className="space-y-3 font-mono text-sm">
                {["Create an account", "Submit your listing", "Reviewed, then published"].map(
                  (step, i) => (
                    <li
                      key={step}
                      className="flex items-center gap-4 rounded-xl border border-line bg-paper/60 px-4 py-3"
                    >
                      <span className="text-xs text-accent-ink">0{i + 1}</span>
                      <span className="text-ink">{step}</span>
                    </li>
                  ),
                )}
              </ol>
            </div>
          </Card>
        </Reveal>

        <Reveal index={1}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted">
            Looking for something different? Structured school programs aren&apos;t the only
            route. Working one-on-one with a private Certified Flight Instructor (CFI) offers
            more scheduling flexibility and a learning pace tailored to you.
          </p>
        </Reveal>
      </Section>
    </div>
  );
}
