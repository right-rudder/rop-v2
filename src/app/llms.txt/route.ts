import {
  getFlightSchools,
  getLocationMaps,
  getAirports,
  getPrograms,
  getTrainerAircraft,
} from "@/lib/data";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { schoolHref } from "@/lib/utils";
import { mdInline } from "@/lib/markdown";

// Rendered per request, like the sitemap: it reads live rows, and prerendering
// it at build would make `next build` need Supabase credentials.
export const dynamic = "force-dynamic";

/** One list line. Label and note may be user-supplied (school names), so they're escaped. */
const md = (label: string, path: string, note?: string) =>
  `- [${mdInline(label)}](${absoluteUrl(path)})${note ? `: ${mdInline(note)}` : ""}`;

/**
 * /llms.txt — a Markdown map of the site for AI crawlers and assistants
 * (https://llmstxt.org). Same shape as the sitemap, but with the one-line
 * context a model needs to answer "which flight schools are in Mesa?"
 * without crawling every page.
 */
export async function GET(): Promise<Response> {
  const [schools, { cityNameBySlug, stateBySlug }, airports, programs, aircraft] =
    await Promise.all([
      getFlightSchools(),
      getLocationMaps(),
      getAirports(),
      getPrograms(),
      getTrainerAircraft(),
    ]);

  const airportName = new Map(airports.map((a) => [a.icao, a.name]));
  const programShort = new Map(programs.map((p) => [p.slug, p.shortName]));
  const states = Object.values(stateBySlug)
    .filter((s) => s.schoolCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const faa = (part?: "61" | "141" | "both") =>
    part ? `FAR Part ${part === "both" ? "61 & 141" : part}` : null;

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} is a free directory of flight schools across the USA, searchable by state, city, airport code, training program and trainer aircraft. Every school listing has its primary airport, programs offered (Private Pilot through ATP and instructor ratings), fleet and instructor estimates, FAA Part 61 / Part 141 status, contacts, and student reviews. Prospective students can request information from a school directly on its page.`,
    "",
    "URL pattern for a school: `/{state}/{city}/{airport-icao}/{school}`. Browse pages: `/states/{state}`, `/cities/{city}`, `/airports/{icao}`, `/programs/{program}`, `/aircraft/{aircraft}`.",
    "",
    "## Browse",
    md("Search", "/search", "filter by state, city, airport, program, aircraft, FAA part, rating, or within a radius of a location"),
    md("Flight schools by state", "/states"),
    md("Flight schools by city", "/cities"),
    md("Flight schools by airport", "/airports"),
    md("Top rated flight schools", "/top-rated", "ranked by student reviews"),
    md("Featured flight schools", "/featured"),
    md("Training programs", "/programs", "FAA certificates, ratings and endorsements"),
    md("Trainer aircraft", "/aircraft"),
    "",
    "## States with listings",
    ...states.map((s) =>
      md(`Flight schools in ${s.name}`, `/states/${s.slug}`, `${s.schoolCount} school${s.schoolCount === 1 ? "" : "s"}`),
    ),
    "",
    "## Flight schools",
    ...schools.map((s) => {
      const place = `${cityNameBySlug[s.citySlug] ?? s.citySlug}, ${stateBySlug[s.stateSlug]?.abbreviation ?? s.stateSlug}`;
      const airport = `${s.primaryAirportCode}${airportName.get(s.primaryAirportCode) ? ` (${airportName.get(s.primaryAirportCode)})` : ""}`;
      const offered = s.programSlugs.map((p) => programShort.get(p) ?? p).join(", ");
      const note = [place, airport, faa(s.faaPart), offered ? `programs: ${offered}` : null]
        .filter(Boolean)
        .join(" · ");
      return md(s.name, schoolHref(s), note);
    }),
    "",
    "## Training programs",
    ...programs.map((p) =>
      md(p.name, `/programs/${p.slug}`, [p.shortName, p.minimumHours ? `${p.minimumHours}+ hours (Part 61 minimum)` : null, p.typicalDuration].filter(Boolean).join(" · ")),
    ),
    "",
    "## Trainer aircraft",
    ...aircraft.map((a) => md(a.displayName, `/aircraft/${a.slug}`, a.make)),
    "",
    "## Optional",
    md("How it works", "/how-it-works", "help and FAQs: searching, requesting information, reviews and comments, suggesting corrections to a listing, and how school owners claim, add or edit a listing"),
    md("Privacy policy", "/privacy-policy"),
    md("Terms of service", "/terms-of-service"),
    md("Add a flight school", "/schools/add", "school owners can submit a listing (account required)"),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
